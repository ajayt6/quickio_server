var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var redis = require("redis"),
    client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});


app.get('/tut', function(req, res){
  res.send('<h1>Hello world</h1>');
});


app.get('/', function(req, res){
  res.sendFile(__dirname +  '/html/index.html');
});

var userMap = new Map();
var sessionMap = new Map();

io.on('connection', function(socket){
  console.log('a user connected');
  //io.emit('chat message', 'yo u r connected');
  socket.on('chat message', function(msg){
    //io.emit('chat message', msg);
    console.log('chat message', msg);
  });
  socket.on('add username + user passkey', function(msg) {
      var msgArray = msg.split(" ");
      var username = msgArray[0];
      var passKey = msgArray[1];

      if(! userMap.has(username))
      {
          userMap.set(username,passKey);
          sessionMap.set(socket.id,username);


          console.log('The originalRequest passkey at addition time is' + userMap.get(username));
          console.log('The originalRequest userName at addition time is' + username);
      }
      else
          console.log('The user already exists');

  });
  socket.on('confirm user passkey', function(msg) {
     var msgArray = msg.split(" ");
     var username = msgArray[0];
     var passKey = msgArray[1];


     console.log('The confirmRequest passkey is' + passKey);
     console.log('The confirmRequest userName is' + username);

     console.log('The originalRequest passkey is' + userMap.get(username));
     //console.log('The originalRequest userName is' + username);

        if(userMap.get(username) == passKey)
        {
		console.log('Its a pass yo');
		socket.emit('user joined', '921 you are right');
        console.log('Going to use secure channel');
        console.log('The session id is ' + socket.id);
        //Set this socket to the same room
        sessionMap.set(socket.id,username);
        console.log('Setting this session id to room: ' + username + ' and joining aforementioned room');
        socket.join(username);
	    }
        else
        {
        console.log('Its a miss');
        console.log('The original passkey is' + app.settings.passKey);
        console.log('The confirmRequest passkey is' + msg);
        }
  });
  socket.on('secure message', function(msg){

    //Below is prototype
    //socket.broadcast.to(sessionMap.get(socket.id)).emit('chat message', msg);

      console.log('Secure message received and going to broadcast to: ' + sessionMap.get(socket.id));
    if(msg.includes("921") == true) //== "Music")
        {
        io.emit('user joined', msg+' joined yoyo');
        console.log('received', msg);
        socket.broadcast.to(sessionMap.get(socket.id)).emit('chat message', msg);
        //socket.broadcast.emit('chat message',msg);
        }
    else  if(msg.includes("pass") == true) //== "Music")
        {
        console.log('received', msg);
        socket.broadcast.to(sessionMap.get(socket.id)).emit('chat message', msg);
        //socket.broadcast.emit('chat message',msg);
        }

    else  if(msg.includes("yahoo") == true) //== "Music")
        {
        //io.emit('user joined', msg+' joined yoyo');
        console.log('Opening', msg);
        socket.broadcast.to(sessionMap.get(socket.id)).emit('chat message', msg);
        //socket.broadcast.emit('chat message',msg);
        }

    else
    {
        socket.broadcast.to(sessionMap.get(socket.id)).emit('chat message', msg);
    }

  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
