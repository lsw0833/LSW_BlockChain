#-*- coding: utf-8 -*-
##
## lsw0833 , 20180417~
##
from Block import Block
import time
import hashlib


def delete0x(hex):
    return hex[2:]

# 1120ka0v -> 0vka2011 으로 만듬
def swapEndian(data):
    if data[-1] == "L":
        data = data[0:len(data) - 1]
    real = data
    if len(real)!=32 and len(real) < 8:
        real="";
        for i in range(0,8-len(data)):
            real = real + "0"
        real = real + data
    result =""
    for i in range(len(real)-2,-1,-2):
        result = result + real[i]
        result = result + real[i+1]
    return result

# 거래 두개로 해쉬값을 만듬
def calculateTransactionHash(tx1,tx2):
    tx_1 = swapEndian(tx1)
    tx_2 = swapEndian(tx2)

    d_tx1 = tx_1.decode('hex')
    d_tx2 = tx_2.decode('hex')

    hash = hashlib.sha256(hashlib.sha256(d_tx1+d_tx2).digest()).digest()

    encodeHash = hash.encode('hex_codec')

    result = swapEndian(encodeHash)
    return result

# 머클해시 구함, 비트코인에서 사용중인 알고리즘 사용
def calculateMerkleHash(data):
    li = []
    for i in range(0,len(data)):
        li.append(hashlib.sha256(data[i]).digest().encode('hex_codec'))
    liLength = len(li)
    start = 0
    while liLength>=2:
        if (liLength - start) ==2 :
            li.append(calculateTransactionHash(li[start],li[start+1]))
            break
        for i in range(start,liLength,2):
            if i+1 == liLength:
                li.append(calculateTransactionHash(li[i],li[i]))
                break
            li.append(calculateTransactionHash(li[i],li[i+1]))
        start = liLength
        liLength = len(li)
    return li[len(li)-1]

def createBlock(version,previous,data,bits,count):
    blockCreatedTime = int(time.time()*1000%1000000000)
    merkleHash = calculateMerkleHash(data)
    block = calculateBlockHash(version,previous,merkleHash,blockCreatedTime,bits,count)
    return Block(version,previous,bits,blockCreatedTime,data,block["nonce"],block["hash"],merkleHash)

def calculateBlockHash(version,previous,merkleHash,time,bits,count):
    ver = swapEndian(str(version))
    previousBlockHash = swapEndian(previous)
    merkleRootHash = swapEndian(merkleHash)
    time = swapEndian(delete0x(hex(time)))
    bits1 = swapEndian(delete0x(hex(bits)))
    nonce = 0
    currentTarget = getCurrentTarget(bits,count)
    blockHash = ""
    headerHex = ""
    while True:
        headerHex = ver + previousBlockHash + merkleRootHash + time + bits1 + swapEndian(delete0x(hex(nonce)))
        headerBin = headerHex.decode('hex')
        hash = hashlib.sha256(hashlib.sha256(headerBin).digest()).digest()
        temp = hash.encode('hex_codec')
        blockHash = swapEndian(temp)
        if currentTarget >= blockHash:
            return {"hash" : blockHash , "nonce" : nonce }
        nonce = nonce + 1

def getCurrentTarget(bits,count):
    result = ""
    for i in range(0,count):
        result = result + "0"
    bitsHexValue = hex(bits)
    x = "0x" + bitsHexValue[4:]
    y = "0x" + bitsHexValue[2:4]
    currentTarget = hex(int(x, 16) * 2 ** (8 * (int(y, 16) - 3)))
    currentTarget = delete0x(currentTarget)
    if currentTarget[-1] =="L":
        currentTarget = currentTarget[0:len(currentTarget)-1]
    result = result + currentTarget
    for i in range(0,64-count-len(currentTarget)):
        result = result+"0"
    return result

def checkBlockHash(nonce,version,previous,merkleHash,time,bits,blockHash):
    ver = swapEndian(str(version))
    previousBlockHash = swapEndian(previous)
    merkleRootHash = swapEndian(merkleHash)
    time = swapEndian(delete0x(hex(time)))
    bits1 = swapEndian(delete0x(hex(bits)))
    headerHex = ""
    headerHex = ver + previousBlockHash + merkleRootHash + time + bits1 + swapEndian(delete0x(hex(nonce)))
    headerBin = headerHex.decode('hex')
    hash = hashlib.sha256(hashlib.sha256(headerBin).digest()).digest()
    temp = hash.encode('hex_codec')
    blockHash1 = swapEndian(temp)
    if blockHash1 == blockHash:
        return True
    else:
        return False
