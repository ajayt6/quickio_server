var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.get('/tut', function(req, res){
  res.send('<h1>Hello world</h1>');
});


app.get('/', function(req, res){
  res.sendFile(__dirname +  '/html/index.html');
});


io.on('connection', function(socket){
  console.log('a user connected');
  io.emit('chat message', 'yo u r connected');
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('chat message', msg);
  });
  socket.on('add user passkey', function(msg) {
  	app.set('passKey',msg);
	console.log('passKey is ' + msg);
});
 socket.on('confirm user passkey', function(msg) {
        if(app.settings.passKey == msg)
        {
		console.log('Its a pass yo');
		io.emit('user joined', '921 you are right');
	}
	else
	{	
	console.log('Its a miss');
	console.log('The original passkey is' + app.settings.passKey);
	console.log('The confirmRequest passkey is' + msg);
	}
});
  socket.on('add user', function(msg){
    if(msg == "YourMamaSoDumb")
	{
    	io.emit('user joined', msg+' joined yoyo');
    	console.log('user added yo and the username is ', msg);
        socket.broadcast.emit('chat message','Yo the kid authenticated alright');
	}
    else  if(msg.includes("921") == true) //== "Music")
        {
        io.emit('user joined', msg+' joined yoyo');
        console.log('received', msg);
        socket.broadcast.emit('chat message',msg);
        }
   else  if(msg.includes("pass") == true) //== "Music")
        {
        console.log('received', msg);
        socket.broadcast.emit('chat message',msg);
        }

    else  if(msg.includes("yahoo") == true) //== "Music")
        {
        //io.emit('user joined', msg+' joined yoyo');
        console.log('Opening', msg);
        socket.broadcast.emit('chat message',msg);
        }

    else 
	console.log('user login wrong yo');
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
