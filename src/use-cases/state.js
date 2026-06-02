import RetryQueue from '@chris.troutner/retry-queue'

class State {
  constructor (localConfig = {}) {
    if (!localConfig.adapters) {
      throw new Error('Adapters required for state.js')
    }
    this.adapters = localConfig.adapters
    this.retryQueue = new RetryQueue()
    this.getStatus = this.getStatus.bind(this)
    this.updateIndexedBlockHeight = this.updateIndexedBlockHeight.bind(this)
  }

  async getStatus () {
    return this.adapters.statusDb.getStatus()
  }

  async updateIndexedBlockHeight (inObj = {}) {
    const { lastIndexedBlockHeight } = inObj
    const status = await this.adapters.statusDb.getStatus()

    if (status.syncedBlockHeight !== (lastIndexedBlockHeight - 1)) {
      throw new Error(
        `Expected synced block height ${lastIndexedBlockHeight - 1}, got ${status.syncedBlockHeight}`
      )
    }

    status.syncedBlockHeight = lastIndexedBlockHeight
    await this.adapters.statusDb.updateStatus(status)
    return lastIndexedBlockHeight + 1
  }
}

export default State
