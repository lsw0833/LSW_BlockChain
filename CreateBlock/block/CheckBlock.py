import Miner
import datetime
import time
import sys
import os

if __name__ == "__main__":
    # def checkBlockHash(nonce,version,previous,merkleHash,time,bits,blockHash1)
    if(Miner.checkBlockHash(int(os.environ["nonce"]),int(os.environ["version"]),os.environ["previousBlockHash"],os.environ["merkleHash"]
                        ,int(os.environ["time"]),int(os.environ["bits"]),os.environ["blockHash"])):
        print "true"
    else :
        print "false"
