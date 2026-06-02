/*
  Top-level adapters index.
*/

import StatusDb from './status-db.js'
import RPC from './rpc.js'
import Transaction from './transaction.js'
import ZMQ from './zmq.js'
import TxIndexerAdapter from './tx-indexer.js'
import DbCtrl from './backup-db.js'
import { createEntityDb } from './entity-db.js'

class Adapters {
  constructor (localConfig = {}) {
    this.statusDb = new StatusDb()
    this.rpc = new RPC()
    this.transaction = new Transaction(localConfig)
    this.zmq = new ZMQ()
    this.txIndexerAdapter = new TxIndexerAdapter()
    this.dbCtrl = new DbCtrl()

    this.postDb = createEntityDb('post', 'txid', 'postData')
    this.postParentDb = createEntityDb('postparent', 'txid', 'parentData')
    this.postChildDb = createEntityDb('postchild', 'txid', 'childData')
    this.likeDb = createEntityDb('like', 'txid', 'likeData')
    this.nameDb = createEntityDb('name', 'addr', 'nameData')
    this.profileDb = createEntityDb('profile', 'addr', 'profileData')
    this.profilePicDb = createEntityDb('profilepic', 'addr', 'profilePicData')
    this.followDb = createEntityDb('follow', 'key', 'followData')
    this.roomDb = createEntityDb('room', 'key', 'roomData')
    this.processErrorDb = createEntityDb('processerror', 'txid', 'errorData')
    this.ptxDb = createEntityDb('ptx', 'txid', 'ptxData')

    this.initAdapters = this.initAdapters.bind(this)
  }

  async initAdapters () {
    console.log('Adapter libraries initialized.')
    return true
  }
}

export default Adapters
