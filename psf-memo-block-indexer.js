/*
  Entry point for the Memo block indexer.
*/

import RetryQueue from '@chris.troutner/retry-queue'
import 'dotenv/config'

import Adapters from './src/adapters/adapters-index.js'
import UseCases from './src/use-cases/use-cases-index.js'
import Controllers from './src/controllers/controllers-index.js'

const EPOCH = 1000

async function start () {
  try {
    const adapters = new Adapters()
    await adapters.initAdapters()

    const useCases = new UseCases({ adapters })
    await useCases.initUseCases()

    const controllers = new Controllers({ useCases, adapters })
    await controllers.initControllers()

    const queue = new RetryQueue()

    console.log('Starting Memo block indexer...')

    const status = await useCases.state.getStatus()
    console.log('Indexer State:', status)

    let nextBlockHeight = status.syncedBlockHeight + 1
    let biggestBlockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})

    if (nextBlockHeight <= biggestBlockHeight) {
      do {
        const blockStart = new Date()
        await useCases.indexBlocks.processBlock(nextBlockHeight)

        const blockProcessTime = new Date().getTime() - blockStart.getTime()
        console.log(`Block ${nextBlockHeight} processed in ${blockProcessTime / 1000}s`)

        nextBlockHeight = await useCases.state.updateIndexedBlockHeight({
          lastIndexedBlockHeight: nextBlockHeight
        })

        if (controllers.keyboard.stopStatus()) {
          console.log(`Stopped at block ${nextBlockHeight - 1}`)
          process.exit(1)
        }

        if (nextBlockHeight % EPOCH === 0) {
          console.log(`Creating DB backup at block ${nextBlockHeight}`)
          await adapters.dbCtrl.backupDb(nextBlockHeight, EPOCH)
        }

        biggestBlockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})
      } while (nextBlockHeight <= biggestBlockHeight)
    } else {
      console.log(`Already at tip (block ${status.syncedBlockHeight}).`)
    }

    console.log(`\nIBD complete. Last block: ${nextBlockHeight - 1}`)

    await adapters.zmq.connect()
    console.log('Connected to ZMQ.')

    await adapters.txIndexerAdapter.startTxIndexer()
    console.log('TX indexer started.')

    let loopCnt = 0
    const liveStatus = status
    do {
      let blockHeight = await queue.addToQueue(adapters.rpc.getBlockCount, {})
      const block = adapters.zmq.getBlock()

      if (block) {
        const blockHeader = await queue.addToQueue(
          adapters.rpc.getBlockHeader,
          block.hash
        )
        blockHeight = blockHeader.height

        liveStatus.syncedBlockHeight = blockHeight
        liveStatus.chainBlockHeight = blockHeight
        await adapters.statusDb.updateStatus(liveStatus)

        await useCases.indexBlocks.processBlock(blockHeight)
      }

      loopCnt++
      if (loopCnt > 100) {
        loopCnt = 0
        console.log(`ZMQ alive. Block height: ${blockHeight}`)
      }

      await useCases.utils.sleep(500)
    } while (1)
  } catch (err) {
    console.error('Error in psf-memo-block-indexer:', err)
    process.exit(1)
  }
}

start()
