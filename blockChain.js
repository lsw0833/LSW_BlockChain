var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var bs58 = require('bs58');
var expressErrorHandler = require('express-error-handler');
var exec = require('child_process').exec;
var bits = 440711666;
var version = 1;
var zero = 4;
var node = [];
var data = ["Genesis"];
var nodeName = "julia";
var isMining = false;
var blockChain = [];
var recieveTXID = [];
var syncLastBlockHash = [];
var app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
//var errorhandler = expressErrorHandler({
//  static:{
//    '404' : './public/404.html'
//  }
//});
//app.use(expressErrorHandler.httpError(404));
//app.use(errorhandler);
app.post('/dataShop',(req,res)=>{
  let txID = req.body.TXID;
  let txData = req.body.TXdata;
  var newData = {
    TXID: txID,
    Txdata: txData
  };
  console.log("***************************");
  console.log("Data : " + newData + "for data shop");
  console.log("***************************");
  data.push(newData);
  console.log(data);
  recieveTXID.push(newData["TXID"]);
  io.emit("addData", newData);
  res.send();
});
app.post('/wallet',(req,res)=>{
  let txID = req.body.TXID;
  let txRealData = req.body.TXRealData;
  let txSignature = req.body.txSignature;
  let publicKey = req.body.publicKey;

  var temp = crypto.publicDecrypt(publicKey, Buffer.from(txSignature));

  if(temp == txID){
    var newData = {
      TXID: txID,
      Txdata: txRealData
      console.log("***************************");
      console.log("Data : " + newData + "for wallet");
      console.log("***************************");
      data.push(newData);
      console.log(data);
      recieveTXID.push(newData["TXID"]);
      io.emit("addData", newData);
      res.send();
    };
  }

});
app.get('/blockChain',(req,res)=>{
  res.json({blockChain :blockChain});
});
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function deleteinData(list) {
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < data.length; j++) {
      if (data[j]["TXID"] == list[i]["TXID"]) {
        data.splice(j, 1);
        j--;
      }
    }
  }
}

function isinBlock(data1) {
  for (var i = 0; i < blockChain.length; i++) {
    if (blockChain[i]["blockHash"] == data1["blockHash"]) {
      return true;
    }
  }
  return false;
}

function addNode(ip) {
  var socket = require('socket.io-client')('http://' + ip);
  socket.on('findBlock', function(data1) {
    if (!isinBlock(data1)) {
      exec("ps -ef | grep MakeBlock | awk '{print $2}' | xargs kill -9", function(err, stdout, stderr) {
        let flag = false;
        // 블록이 유효한지, 유효하지않다면 그 블록 제외하는 법과 그 노드 제외
        var options = {
          env: {
            "nonce": data1["nonce"],
            "merkleHash": data1["merkleHash"],
            "version": data1["version"],
            "blockHash": data1["blockHash"],
            "time": data1["time"],
            "previousBlockHash": data1["previousBlockHash"],
            "bits": data1["bits"],
          }
        };
        exec('python ./CreateBlock/block/CheckBlock.py', options, function(error, stdout, stderr) {
          if (error) {} else {
            if (stdout.trim() == "true") {
              flag = true;
            }
            if (flag) {
              if (data1["previousBlockHash"] == blockChain[blockChain.length - 1]["blockHash"]) {
                let temp = data1["data"];
                deleteinData(temp);
                blockChain.push(data1);
                io.emit("findBlock", data1);
                console.log("get block from other Node");
                console.log(data1);
              } else {
                if (!isinBlock(data1)) {
                  syncLastBlockHash.push(blockChain[blockChain.length - 1]["blockHash"]);
                  io.emit('syncBlockChain', blockChain);
                  console.log("Data synchronized by " + nodeName);
                }
              }
            } else {
              // 블록 만든 노드 트랍
              console.log("WTF");
            }
            isMining = false;
          }
        });
      });
    }
  });
  //여기에 전자서명 필요
  socket.on('addData', function(recieveData) {
    if (recieveTXID.indexOf(recieveData.TXID) == -1) {
      data.push(recieveData);
      recieveTXID.push(recieveData.TXID);
      io.emit('addData', recieveData);
      console.log("-------------------------------");
      console.log("Add data");
      console.log(data);
      console.log("-------------------------------");
    }
  });
  socket.on('connected', function(blockChain1) {
    if (blockChain.length == 0) {
      blockChain = blockChain1;
      console.log("----Connect-----");
      console.log(blockChain);
    }
  });
  socket.on('syncBlockChain', function(blockChain1) {
    if (syncLastBlockHash.indexOf(blockChain1[blockChain1.length - 1]["blockHash"]) == -1) {
      exec("ps -ef | grep MakeBlock | awk '{print $2}' | xargs kill -9", function(err, stdout, stderr) {
        blockChain = blockChain1;
        syncLastBlockHash.push(blockChain[blockChain.length - 1]["blockHash"]);
        io.emit('syncBlockChain', blockChain);
        isMining = false;
      });
    }
  });
}

function initConnect() {
  for (var i = 0; i < node.length; i++) {
    addNode(node[i]);
  }
}

function mining(previous) {
  // 파이썬 코드 실행
  console.log("Run Mining at " + new Date().getTime());
  isMining = true;
  let datainMining = [];
  let TXinMining = [];
  for (var i in data) {
    datainMining.push(data[i].TXID);
    TXinMining.push(data[i]);
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
        nonce: buf[0],
        merkleHash: buf[1],
        version: buf[2],
        blockHash: buf[3],
        time: buf[4],
        previousBlockHash: buf[5],
        bits: buf[6],
        data: TXinMining,
        MinerName: nodeName
      };
      if (blockChain.length == 0 || block["previousBlockHash"] != blockChain[blockChain.length - 1]["previousBlockHash"]) {
        blockChain.push(block)
        console.log("<------------------------------------------->");
        console.log("Find blockhash");
        console.log(blockChain);
        console.log("<------------------------------------------->");
        let temp = block["data"];
        deleteinData(temp);
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
    socket.emit("connected", blockChain);
  }
});
app.listen(3030, () => console.log('Listening http on port: 3030'));
initConnect();
//if this is First Miner node, start function at bottom
mining("0000000000000000000000000000000000000000000000000000000000000000");

setInterval(runMining, 1000);
