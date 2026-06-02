/*
  Database backup/restore via psf-memo-db REST API.
*/

import axios from 'axios'
import config from '../../config/index.js'

class DbCtrl {
  constructor () {
    this.axios = axios
    this.config = config
    this.backupDb = this.backupDb.bind(this)
  }

  async backupDb (height, epoch) {
    await this.axios.post(`${this.config.psfMemoDbUrl}/level/backup`, { height, epoch })
    return true
  }
}

export default DbCtrl
