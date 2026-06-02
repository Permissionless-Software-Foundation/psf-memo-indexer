/*
  Generic axios client for psf-memo-db /level CRUD routes.
*/

import axios from 'axios'
import config from '../../config/index.js'

export function createEntityDb (route, idField, dataField) {
  return {
    async get (key) {
      const response = await axios.get(`${config.psfMemoDbUrl}/level/${route}/${key}`)
      return response.data
    },
    async create (key, data) {
      const body = { [idField]: key, [dataField]: data }
      const response = await axios.post(`${config.psfMemoDbUrl}/level/${route}`, body)
      return response.data
    },
    async update (key, data) {
      const response = await axios.put(`${config.psfMemoDbUrl}/level/${route}/${key}`, {
        [dataField]: data
      })
      return response.data
    },
    async delete (key) {
      const response = await axios.delete(`${config.psfMemoDbUrl}/level/${route}/${key}`)
      return response.data
    }
  }
}
