#-*- coding: utf-8 -*-
class  Block:
    def __init__(self,version,previous,bits,time,data,nonce,blockHash,merkleHash):
        self.version = version
        self.previousBlockHash = previous
        self.bits = bits
        self.time = time
        self.data = data
        self.nonce = nonce
        self.blockHash = blockHash
        self.merkleHash = merkleHash
    def printBlockInfo(self):
        return {"version" : str(self.version),"previousBlockHash" : self.previousBlockHash ,"bits": str(self.bits),
                  "time" : str(self.time), "data" : self.data, "nonce" : str(self.nonce), "blockHash" : self.blockHash,
                  "merkleHash" : self.merkleHash}