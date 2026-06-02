/*
  Entry point for the Memo TX indexer (mempool).
*/

import RetryQueue from '@chris.troutner/retry-queue'
import 'dotenv/config'

import Adapters from './src/adapters/adapters-index.js'
import UseCases from './src/use-cases/use-cases-index.js'
import Controllers from './src/controllers/controllers-index.js'
import config from './config/index.js'

async function start () {
  try {
    const queue = new RetryQueue()
    const adapters = new Adapters()
    const useCases = new UseCases({ adapters })
    const controllers = new Controllers({ useCases, adapters })
    await controllers.initControllers()
    await controllers.startTxRESTController()

    console.log('Starting Memo TX indexer...')

    let runTxIndexer = false
    const seenTxs = new Set()
    const seenTxQueue = []

    do {
      await useCases.utils.sleep(2000)
      runTxIndexer = controllers.txRESTController.runTxIndexing
      if (runTxIndexer) {
        console.log('TX Indexer triggered from REST API!')
        break
      }
    } while (1)

    await adapters.zmq.connect()
    console.log('Connected to ZMQ.')

    do {
      const blockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})
      const tx = adapters.zmq.getTx()

      if (tx) {
        if (seenTxs.has(tx)) continue

        seenTxs.add(tx)
        seenTxQueue.push(tx)
        if (seenTxQueue.length > config.seenTxMax) {
          const oldTxid = seenTxQueue.shift()
          seenTxs.delete(oldTxid)
        }

        try {
          await useCases.indexBlocks.processMemoTx(tx, blockHeight + 1)
        } catch (err) {
          console.error(`Error indexing mempool tx ${tx}:`, err.message)
        }
      }

      await useCases.utils.sleep(100)
    } while (1)
  } catch (err) {
    console.error('Error in psf-memo-tx-indexer:', err)
    process.exit(1)
  }
}

start()
