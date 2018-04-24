var io = require('socket.io')();
io.listen(3030);

io.on('connection', function(socket){
  io.emit('peer-msg',"hello")
  io.on('ms',function(data){
    console.log(data);
  });
});
console.log("aaaaaaa");
io.on('abcdefg',function(data){
  console.log("aaaaaaaaaaaa");
  console.log(data);
});
