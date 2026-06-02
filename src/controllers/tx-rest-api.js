import express from 'express'
import config from '../../config/index.js'

const port = config.txRestApiPort

class TxRESTController {
  constructor (localConfig = {}) {
    this.adapters = localConfig.adapters
    this.useCases = localConfig.useCases
    this.app = express()
    this.runTxIndexing = false
    this.start = this.start.bind(this)
  }

  start () {
    this.app.get('/tx-start', (req, res) => {
      this.runTxIndexing = true
      console.log('Starting TX Indexer...')
      res.send({ report: { success: true } })
    })

    this.app.listen(port, () => {
      console.log(`TX Indexer listening at http://localhost:${port}`)
    })
  }
}

export default TxRESTController
