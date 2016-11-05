var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var request =  require('request');


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


var redis = require("redis"),
    client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
    console.log("Error " + err);
});

/*
client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    //client.quit();
});
*/


app.get('/tut', function(req, res){
  res.send('<h1>Hello world</h1>');
});

app.get('/signin', function(req, res){
    var socket_id = req.param('socket_id');
    console.log('The socket_id is: '+ socket_id);
    res.sendFile(__dirname +  '/html/googleSignIn.html');
});

app.get('/signinVerification', function(req, res){
    console.log('GET /');
    var data = req.param('data');
    console.log('The data is: '+ data);
    console.log("The body structure is :" + req.data);
    console.dir(req.body);
    console.log("the request content is: " + req.param.data);
    console.log("The request id token is "+ req.idtoken);
    console.log(JSON.stringify(req.body));
    res.send('<h1>Ok Cool</h1>');
});

app.post('/signinVerificationPOST', function(req, res){
    console.log('POST /');

    var email = req.body.email;
    var id_token = req.body.id_token;

    console.log("The email is :" + email);
    console.log("The token_id is :" + id_token);



    res.send('<h1>Ok Cool</h1>');

    client.hset("chrome_extension_store", email, id_token, redis.print);
    console.log("the email is: " + email);
    //client.hget("chrome_extension_store",email,redis.print);

/*
    request.post(
        'https://www.googleapis.com/oauth2/v3/tokeninfo',
        { json: { key: 'value' } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
            }
        }
    );
*/

    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+req.body.id_token, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Show the HTML for the Modulus homepage.
        }
    });

});

app.post('/androidSigninVerificationPOST', function(req, res){
    console.log('POST /');



    console.log("The body is :" + req.body.toString());
    var id_token = req.body.idToken;
    console.log("The token_id is :" + id_token);



    res.send('<h1>signed in</h1>');




    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+id_token, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Show the HTML for the Modulus homepage.
            var bodyParsed = JSON.parse(body);
            client.hset("android_store", bodyParsed["email"], id_token, redis.print);
        }
    });



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

  socket.on('confirm_user_auth_token', function(msg) {

      request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+msg, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log("The body is: " + body); // Show the HTML for the Modulus homepage.
              var bodyParsed = JSON.parse(body);
              var email = bodyParsed["email"];
              console.log("the email from parsed http response is: " + email);
              var hgetSuccess = client.hget("chrome_extension_store",email,function(err, reply) {
                  // reply is null when the key is missing
                  //console.log(reply);
                  if(reply)
                  {
                      //console.log("the retrieved token is: " + reply);
                      if(reply == msg) {
                          console.log("its an exact match of auth tokens");

                          console.log('Going to use secure channel');
                          console.log('The session id of quicky chrome client is ' + socket.id);
                          //Set this socket to the same room

                          console.log('Setting this session id to room: ' + email + ' and joining aforementioned room');
                          socket.join(email);

                      }
                  }

              });
              //console.log("The result of hget is: " + hgetSuccess);

          }
      });

  });

    socket.on('confirm_user_auth_token_android', function(msg) {

        request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+msg, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("The body is: " + body); // Show the HTML for the Modulus homepage.
                var bodyParsed = JSON.parse(body);
                var email = bodyParsed["email"];
                console.log("the email from parsed http response is: " + email);
                var hgetSuccess = client.hget("android_store",email,function(err, reply) {
                    // reply is null when the key is missing
                    //console.log(reply);
                    if(reply)
                    {
                        //console.log("the retrieved token is: " + reply);
                        if(reply == msg) {
                            console.log("its an exact match of auth tokens from android client side");


                            console.log('Going to use secure channel');
                            console.log('The session id of quicky android client is ' + socket.id);
                            //Set this socket to the same room

                            console.log('Setting this session id to room: ' + email + ' and joining aforementioned room');
                            socket.join(email);
                            client.hset("socket_id_store", socket.id, email, redis.print);
                        }
                    }

                });
                //console.log("The result of hget is: " + hgetSuccess);

            }
        });

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

  socket.on('auth_message', function(msg) {

      var hgetSuccess = client.hget("socket_id_store",socket.id,function(err, reply) {

          console.log("The room to which auth_message is going to be broadcast is: " + reply);
          socket.broadcast.to(reply).emit('chat message', msg);
      });

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
