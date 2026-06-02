/*
  Trigger TX indexer after block IBD completes.
*/

import axios from 'axios'
import config from '../../config/index.js'

class TxIndexerAdapter {
  constructor () {
    this.axios = axios
    this.config = config
  }

  async startTxIndexer () {
    const response = await this.axios.get(
      `http://${this.config.txRestApiIp}:${this.config.txRestApiPort}/tx-start`
    )
    console.log('TX indexer start response:', response.data)
    return true
  }
}

export default TxIndexerAdapter
