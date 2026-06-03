/*
  Business logic for indexing blocks with Memo transactions.
*/

import RetryQueue from '@chris.troutner/retry-queue'
import PQueue from 'p-queue'
import config from '../../config/index.js'
import FilterBlock from './filter-block.js'
import { findMemoOutputs, getSignerAddress } from '../lib/memo-parser.js'
import { dispatchMemoAction } from './action-types/index.js'

class IndexBlocks {
  constructor (localConfig = {}) {
    if (!localConfig.adapters) {
      throw new Error('Adapters required for index-blocks.js')
    }
    this.adapters = localConfig.adapters
    this.filterBlock = new FilterBlock({ adapters: this.adapters })
    this.retryQueue = new RetryQueue()
    this.pQueue = new PQueue({ concurrency: config.memoTxConcurrency })
    this.processBlock = this.processBlock.bind(this)
    this.processMemoTx = this.processMemoTx.bind(this)
    this.processMemoTxs = this.processMemoTxs.bind(this)
  }

  async processMemoTx (txid, blockHeight) {
    try {
      try {
        await this.adapters.ptxDb.get(txid)
        return true
      } catch (err) {
        // not processed yet
      }

      const txDetails = await this.adapters.transaction.get(txid)
      const signerAddr = getSignerAddress(txDetails)
      if (!signerAddr) {
        await this.adapters.processErrorDb.create(txid, {
          error: 'could not find input address for memo tx',
          ts: Date.now()
        })
        return false
      }

      const memoOutputs = findMemoOutputs(txDetails)
      const seen = Date.now()

      for (const decoded of memoOutputs) {
        await dispatchMemoAction({
          adapters: this.adapters,
          txid,
          txDetails,
          signerAddr,
          decoded,
          seen,
          blockHeight
        })
      }

      await this.adapters.ptxDb.create(txid, { processedAt: seen, blockHeight })
      return true
    } catch (err) {
      console.error(`Error processing memo tx ${txid}:`, err.message)
      throw err
    }
  }

  async processMemoTxs (txids, blockHeight) {
    const tasks = txids.map((txid) => async () => {
      await this.processMemoTx(txid, blockHeight)
    })
    await this.pQueue.addAll(tasks)
    return true
  }

  async processBlock (blockHeight) {
    const blockHash = await this.retryQueue.addToQueue(
      this.adapters.rpc.getBlockHash,
      { height: blockHeight }
    )
    const block = await this.retryQueue.addToQueue(
      this.adapters.rpc.getBlock,
      { hash: blockHash }
    )

    const txs = block.tx
    const now = new Date()
    console.log(
      `\nIndexing block ${blockHeight} with ${txs.length} txs. ${now.toLocaleString()}`
    )

    const memoTxs = await this.filterBlock.filterMemoTxs(txs)
    if (memoTxs.length) {
      console.log(`Memo txs in block: ${memoTxs.length}`)
      await this.processMemoTxs(memoTxs, blockHeight)
    }

    return true
  }
}

export default IndexBlocks
