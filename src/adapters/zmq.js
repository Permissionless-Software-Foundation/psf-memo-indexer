/*
  ZMQ adapter for full node notifications.
*/

import BitcoinCashZmqDecoder from '@psf/bitcoincash-zmq-decoder'
import * as zmq from 'zeromq'
import config from '../../config/index.js'

class ZMQ {
  constructor () {
    this.sock = new zmq.Subscriber()
    this.bchZmqDecoder = new BitcoinCashZmqDecoder('mainnet')
    this.config = config
    this.txQueue = []
    this.blockQueue = []
    this.connect = this.connect.bind(this)
    this.monitorZmq = this.monitorZmq.bind(this)
    this.getTx = this.getTx.bind(this)
    this.getBlock = this.getBlock.bind(this)
    this.decodeMsg = this.decodeMsg.bind(this)
  }

  async connect () {
    this.sock.connect(`tcp://${this.config.rpcIp}:${this.config.zmqPort}`)
    this.sock.subscribe('raw')
    this.monitorZmq()
    return true
  }

  async monitorZmq () {
    for await (const [topic, msg] of this.sock) {
      this.decodeMsg(topic, msg)
    }
  }

  decodeMsg (topic, message) {
    try {
      const decoded = topic.toString('ascii')
      if (decoded === 'rawtx') {
        const txd = this.bchZmqDecoder.decodeTransaction(message)
        this.txQueue.push(txd.format.txid)
        if (this.txQueue.length > this.config.zmqTxQueueMax) {
          this.txQueue.shift()
        }
      } else if (decoded === 'rawblock') {
        const blk = this.bchZmqDecoder.decodeBlock(message)
        this.blockQueue.push(blk)
        if (this.blockQueue.length > this.config.zmqBlockQueueMax) {
          this.blockQueue.shift()
        }
      }
      return true
    } catch (err) {
      console.error('Error in decodeMsg: ', err)
      return false
    }
  }

  getTx () {
    const nextTx = this.txQueue.shift()
    return nextTx === undefined ? false : nextTx
  }

  getBlock () {
    const nextBlock = this.blockQueue.shift()
    return nextBlock === undefined ? false : nextBlock
  }
}

export default ZMQ
