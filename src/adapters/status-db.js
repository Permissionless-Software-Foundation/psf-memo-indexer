/*
  Adapter for indexer status in psf-memo-db.
*/

import axios from 'axios'
import RetryQueue from '@chris.troutner/retry-queue'
import config from '../../config/index.js'
import RPC from './rpc.js'

class StatusDb {
  constructor () {
    this.axios = axios
    this.config = config
    this.rpc = new RPC()
    this.retryQueue = new RetryQueue()
    this.getStatus = this.getStatus.bind(this)
    this.updateStatus = this.updateStatus.bind(this)
  }

  async getStatus () {
    try {
      const response = await this.axios.get(`${this.config.psfMemoDbUrl}/level/status/status`)
      return response.data
    } catch (err) {
      console.log('State not found. Creating fresh state.')

      if (this.config.exitOnMissingBackup) {
        console.log('EXIT_ON_MISSING_BACKUP set. Exiting.')
        process.exit(1)
      }

      const biggestBlockHeight = await this.retryQueue.addToQueue(this.rpc.getBlockCount, {})
      const start = this.config.startBlockHeight - 1
      const statusData = {
        startBlockHeight: start,
        syncedBlockHeight: start,
        chainBlockHeight: biggestBlockHeight
      }

      await this.axios.post(`${this.config.psfMemoDbUrl}/level/status`, {
        statusKey: 'status',
        statusData
      })

      return statusData
    }
  }

  async updateStatus (status) {
    const { startBlockHeight, syncedBlockHeight, chainBlockHeight } = status
    await this.axios.put(`${this.config.psfMemoDbUrl}/level/status`, {
      statusData: { startBlockHeight, syncedBlockHeight, chainBlockHeight }
    })
    return true
  }
}

export default StatusDb
