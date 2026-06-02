/*
  JSON RPC adapter for BCH full node.
*/

import axios from 'axios'
import config from '../../config/index.js'

class RPC {
  constructor () {
    this.axios = axios
    this.config = config
    this.getAxiosOptions = this.getAxiosOptions.bind(this)
    this.getBlockCount = this.getBlockCount.bind(this)
    this.getBlockHeader = this.getBlockHeader.bind(this)
    this.getBlock = this.getBlock.bind(this)
    this.getBlockHash = this.getBlockHash.bind(this)
    this.getRawTransaction = this.getRawTransaction.bind(this)
  }

  getAxiosOptions () {
    return {
      method: 'post',
      baseURL: `http://${this.config.rpcIp}:${this.config.rpcPort}/`,
      timeout: 15000,
      auth: {
        username: this.config.rpcUser,
        password: this.config.rpcPass
      },
      data: { jsonrpc: '1.0' }
    }
  }

  async getBlockCount () {
    const options = this.getAxiosOptions()
    options.data.id = 'getblockcount'
    options.data.method = 'getblockcount'
    options.data.params = []
    const response = await this.axios.request(options)
    return response.data.result
  }

  async getBlockHeader (hash, verbose = true) {
    if (!hash) throw new Error('Block hash must be provided')
    const options = this.getAxiosOptions()
    options.data.id = 'getblockheader'
    options.data.method = 'getblockheader'
    options.data.params = [hash, verbose]
    const response = await this.axios.request(options)
    return response.data.result
  }

  async getBlock (inObj = {}) {
    const { hash, verbose = true } = inObj
    if (!hash) throw new Error('Block hash must be provided')
    const options = this.getAxiosOptions()
    options.data.id = 'getblock'
    options.data.method = 'getblock'
    options.data.params = [hash, verbose]
    const response = await this.axios.request(options)
    return response.data.result
  }

  async getBlockHash (inObj = {}) {
    const { height } = inObj
    if (height === undefined) throw new Error('Block height must be provided')
    const options = this.getAxiosOptions()
    options.data.id = 'getblockhash'
    options.data.method = 'getblockhash'
    options.data.params = [parseInt(height)]
    const response = await this.axios.request(options)
    return response.data.result
  }

  async getRawTransaction (txid, verbose = true) {
    if (!txid) throw new Error('txid must be provided')
    const options = this.getAxiosOptions()
    options.data.id = 'getrawtransaction'
    options.data.method = 'getrawtransaction'
    options.data.params = [txid, verbose]
    const response = await this.axios.request(options)
    return response.data.result
  }
}

export default RPC
