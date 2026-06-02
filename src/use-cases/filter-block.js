/*
  Filter block transactions for Memo OP_RETURN outputs.
*/

import PQueue from 'p-queue'
import pRetry from 'p-retry'

class FilterBlock {
  constructor (localConfig = {}) {
    if (!localConfig.adapters) {
      throw new Error('Adapters required for filter-block.js')
    }
    this.adapters = localConfig.adapters
    this.pQueue = new PQueue({ concurrency: 20 })
    this.pRetry = pRetry
    this.attempts = 5
    this.filterMemoTxs = this.filterMemoTxs.bind(this)
  }

  async retryWrapper (funcHandle, inputObj) {
    return this.pRetry(async () => funcHandle(inputObj), {
      retries: this.attempts,
      onFailedAttempt: (error) => {
        console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`)
      }
    })
  }

  async filterMemoTxs (txids) {
    const memoTxs = []
    const tasks = txids.map((txid) => async () => {
      const isMemo = await this.retryWrapper(
        this.adapters.transaction.isMemoTx.bind(this.adapters.transaction),
        txid
      )
      if (isMemo) memoTxs.push(txid)
    })

    await this.pQueue.addAll(tasks)
    return memoTxs
  }
}

export default FilterBlock
