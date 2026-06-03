/*
  Business logic for indexing blocks with Memo transactions.
*/

import RetryQueue from '@chris.troutner/retry-queue'
import PQueue from 'p-queue'
import config from '../../config/index.js'
import FilterBlock from './filter-block.js'
import { findMemoOutputs, getSignerAddress } from '../lib/memo-parser.js'
import { logMemoTxResult } from '../lib/debug-log.js'
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

  async getProcessErrorMessage (txid) {
    try {
      const record = await this.adapters.processErrorDb.get(txid)
      return record && record.error ? record.error : null
    } catch (err) {
      return null
    }
  }

  async processMemoTx (txid, blockHeight, seen = Date.now()) {
    let actions = []

    try {
      try {
        await this.adapters.ptxDb.get(txid)
        logMemoTxResult({ txid, actions, skipped: true, success: true })
        return true
      } catch (err) {
        // not processed yet
      }

      const txDetails = await this.adapters.transaction.get(txid)
      const memoOutputs = findMemoOutputs(txDetails)
      actions = memoOutputs.map((output) => output.action)

      const signerAddr = getSignerAddress(txDetails)
      if (!signerAddr) {
        const error = 'could not find input address for memo tx'
        await this.adapters.processErrorDb.create(txid, {
          error,
          ts: Date.now()
        })
        logMemoTxResult({ txid, actions, success: false, error })
        return false
      }

      const processedAt = Date.now()

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

      const handlerError = await this.getProcessErrorMessage(txid)
      if (handlerError) {
        logMemoTxResult({ txid, actions, success: false, error: handlerError })
        await this.adapters.ptxDb.create(txid, { processedAt, blockHeight })
        return true
      }

      await this.adapters.ptxDb.create(txid, { processedAt, blockHeight })
      logMemoTxResult({ txid, actions, success: true })
      return true
    } catch (err) {
      logMemoTxResult({ txid, actions, success: false, error: err.message })
      console.error(`Error processing memo tx ${txid}:`, err.message)
      throw err
    }
  }

  async processMemoTxs (txids, blockHeight, seen) {
    const tasks = txids.map((txid) => async () => {
      await this.processMemoTx(txid, blockHeight, seen)
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
      const blockSeen = block.time * 1000
      await this.processMemoTxs(memoTxs, blockHeight, blockSeen)
    }

    return true
  }
}

export default IndexBlocks
