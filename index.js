var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*
app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});
*/
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
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3001, function(){
  console.log('listening on *:3001');
});
