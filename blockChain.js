var express = require('express');
var bodyParser = require('body-parser');
var expressErrorHandler = require('express-error-handler');
var exec = require('child_process').exec;
var bits = 440711666;
var version = 1;
var zero = 4;
var node = [];
var data = ["aaaa", "asdasd"];
var nodeName = "jul";
var isMining = false;
var blockChain = [];
var app = express();
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
//var errorhandler = expressErrorHandler({
//  static:{
//    '404' : './public/404.html'
//  }
//});
//app.use(expressErrorHandler.httpError(404));
//app.use(errorhandler);
app.post('/data',(req,res)=>{
  let comeData = req.body.data;
  data.push(comeData);
  console.log(comeData);
  let reciverList = [];
  reciverList.push(nodeName);
  let dataSet = {
    "data" : comeData,
    "reciverList" : reciverList
  };
  io.emit("addData",dataSet);
  res.send();
});

function addNode(ip) {
  var socket = require('socket.io-client')('http://' + ip);
  socket.on('findBlock', function(data1) {
    // 추후 블록 받았을 시 확인하는 거 짜서 넣을거임
    if(data1["previousBlockHash"]== blockChain[blockChain.length - 1]["blockHash"]){
      exec("ps -ef | grep MakeBlock | awk '{print $2}' | xargs kill -9", function(err, stdout, stderr) {
        // 블록 확인하는거 넣고..
        let temp = data1["data"];
        for(var i =0; i< temp.length; i++) {
          if(data.indexOf(temp[i])!=-1){
            data.splice(data.indexOf(temp[i]),1);
          }
        }
        blockChain.push(data1);
        io.emit("findBlock", data1);
        console.log("get block from other Node");
        console.log(data1);
        setTimeout(() => {
          console.log("delay 1sec");
        }, 1000);
        isMining = false;
      });
    }
  });
  socket.on('addData', function(recieveData) {
    if(recieveData["reciverList"].indexOf(nodeName)==-1){
      data.push(recieveData["data"]);
      recieveData["reciverList"].push(nodeName);
      io.emit('addData',recieveData);
      console.log(data);
    }
  });
  socket.on('peerConnected', function(blockChain1) {
    blockChain = blockChain1;
    console.log(blockChain);
  });
}

function initConnect() {
  for (var i = 0; i < node.length; i++) {
    addNode(node[i]);
  }
}

function mining(previous) {
  // 파이썬 코드 실행
  isMining = true;
  let datainMining=[];
  for(var i in data){
    datainMining.push(data[i]);
  }
  var options = {
    env: {
      "version": version,
      "previous": previous,
      "datainMining": datainMining,
      "bits": bits,
      "zero": zero
    }
  };
  exec('python ./CreateBlock/block/MakeBlock.py', options, function(error, stdout, stderr) {
    if (error) {} else {
      str = stdout;
      // 파싱
      let buf = [];
      let word = "";
      for (var i = 0; i < str.length; i++) {
        if (str[i] == "\n") {
          buf.push(word);
          word = "";
        } else if (str[i] == "\r") {
          continue;
        } else {
          word += str[i];
        }
      }
      let block = {
        "nonce": buf[0],
        "merkleHash": buf[1],
        "version": buf[2],
        "blockHash": buf[3],
        "time": buf[4],
        "previousBlockHash": buf[5],
        "data": datainMining,
        "MinerName": nodeName
      };
      if (blockChain.length == 0 || block["previousBlockHash"] != blockChain[blockChain.length - 1]["previousBlockHash"]) {
        blockChain.push(block)
        console.log("<------------------------------------------->");
        console.log(blockChain);
        console.log("<------------------------------------------->");
        let temp = block["data"];
        for(var i =0; i< temp.length; i++) {
          if(data.indexOf(temp[i])!=-1){
            data.splice(data.indexOf(temp[i]),1);
          }
        }
        io.emit("findBlock", block);
        isMining = false;
      }
    }
  });
}

function runMining() {
  if (blockChain.length != 0 && data.length != 0 && !isMining) {
    mining(blockChain[blockChain.length - 1].blockHash);
  }
}
var io = require('socket.io')();
io.listen(3000);

io.on('connection', function(socket) {
  //console.log(socket.handshake.address.slice(7, socket.handshake.address.length));
  if (node.indexOf(socket.handshake.address.slice(7, socket.handshake.address.length) + ":3000") == -1) {
    addNode(socket.handshake.address.slice(7, socket.handshake.address.length) + ":3000");
    node.push(socket.handshake.address.slice(7, socket.handshake.address.length) + ":3000");
    socket.emit("peerConnected", blockChain);
  }
});
app.listen(3030, () => console.log('Listening http on port: 3030'));
initConnect();
//if this is First Node, start function at bottom
mining("0000000000000000000000000000000000000000000000000000000000000000");

setInterval(runMining, 1000);
