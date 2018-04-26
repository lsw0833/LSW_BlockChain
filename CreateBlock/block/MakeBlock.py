import Miner
import datetime
import time
import sys
import os

if __name__ == "__main__":
    # print(Miner.createBlock(version,"0000000000000000000000000000000000000000000000000000000000000000",
                      #data,bits,5).printBlockInfo())
    li = []
    start = 0;
    last = 0;
    for i in range(0,len(os.environ['datainMining'])):
       if os.environ['datainMining'][i] ==",":
           last = i
           li.append(os.environ['datainMining'][start:last])
           start = last+1
       elif i == len(os.environ['datainMining']) -1:
           last = i+1
           li.append(os.environ['datainMining'][start:last])
    block=Miner.createBlock(int(os.environ['version']), os.environ['previous'], li, int(os.environ['bits']), int(os.environ['zero']))
    print(block.nonce)
    print(block.merkleHash)
    print(block.version)
    print(block.blockHash)
    print(block.time)
    print(block.previousBlockHash)
    print(block.bits)