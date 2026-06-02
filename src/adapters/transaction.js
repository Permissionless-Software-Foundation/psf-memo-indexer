/*
  Transaction adapter: fetch TX data and detect Memo OP_RETURN outputs.
*/

import RetryQueue from '@chris.troutner/retry-queue'
import RPC from './rpc.js'
import { findMemoOutputs } from '../lib/memo-parser.js'
import config from '../../config/index.js'

class Transaction {
  constructor () {
    this.rpc = new RPC()
    this.queue = new RetryQueue()
    this.config = config
    this.txCache = {}
    this.txCacheKeys = []
    this.get = this.get.bind(this)
    this.isMemoTx = this.isMemoTx.bind(this)
    this.getTxData = this.getTxData.bind(this)
  }

  async getTxData (txid) {
    const cached = this.txCache[txid]
    if (cached) return cached

    const txDetails = await this.queue.addToQueue(this.rpc.getRawTransaction, txid)

    if (txDetails.blockhash) {
      const blockHeader = await this.rpc.getBlockHeader(txDetails.blockhash)
      txDetails.blockheight = blockHeader.height
    } else {
      const blockHeight = await this.rpc.getBlockCount()
      txDetails.blockheight = blockHeight + 1
    }

    this.txCache[txid] = txDetails
    this.txCacheKeys.push(txid)
    if (this.txCacheKeys.length > this.config.txCacheMax) {
      const old = this.txCacheKeys.shift()
      delete this.txCache[old]
    }

    return txDetails
  }

  async get (txid) {
    if (typeof txid !== 'string') {
      throw new Error('Input to Transaction.get() must be a string TXID.')
    }
    return this.getTxData(txid)
  }

  async isMemoTx (txid) {
    try {
      const tx = await this.getTxData(txid)
      return findMemoOutputs(tx).length > 0
    } catch (err) {
      return false
    }
  }
}

export default Transaction
