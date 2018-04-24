var socket = require('socket.io-client')('http://127.0.0.1:3030');

socket.on('peer-msg', function (data) {
  console.log(data);
});
