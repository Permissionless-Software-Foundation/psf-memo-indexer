import RetryQueue from '@chris.troutner/retry-queue'
import IndexBlocks from './index-blocks.js'
import State from './state.js'
import Utils from './utils.js'

class UseCases {
  constructor (localConfig = {}) {
    if (!localConfig.adapters) {
      throw new Error('Adapters required for use cases.')
    }
    this.adapters = localConfig.adapters
    this.indexBlocks = new IndexBlocks({ adapters: this.adapters })
    this.state = new State({ adapters: this.adapters })
    this.utils = new Utils()
    this.retryQueue = new RetryQueue()
    this.initUseCases = this.initUseCases.bind(this)
  }

  async initUseCases () {
    console.log('Use cases initialized.')
    return true
  }
}

export default UseCases
