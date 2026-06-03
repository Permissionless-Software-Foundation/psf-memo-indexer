import { assert } from 'chai'
import sinon from 'sinon'
import FilterBlock from '../../../src/use-cases/filter-block.js'

describe('#FilterBlock', () => {
  let uut
  let sandbox
  let adapters

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    adapters = {
      transaction: {
        isMemoTx: sandbox.stub()
      }
    }
    adapters.transaction.isMemoTx.onCall(0).resolves(true)
    adapters.transaction.isMemoTx.onCall(1).resolves(false)
    adapters.transaction.isMemoTx.onCall(2).resolves(true)

    uut = new FilterBlock({ adapters })
  })

  afterEach(() => sandbox.restore())

  it('should filter memo txs from block tx list', async () => {
    const result = await uut.filterMemoTxs(['tx1', 'tx2', 'tx3'])
    assert.deepEqual(result, ['tx1', 'tx3'])
  })

  it('should preserve block tx order when filtering in parallel', async () => {
    adapters.transaction.isMemoTx.reset()
    adapters.transaction.isMemoTx.callsFake(async (txid) => {
      return txid === 'tx-a' || txid === 'tx-c' || txid === 'tx-e'
    })

    const blockOrder = ['tx-a', 'tx-b', 'tx-c', 'tx-d', 'tx-e']
    const result = await uut.filterMemoTxs(blockOrder)
    assert.deepEqual(result, ['tx-a', 'tx-c', 'tx-e'])
  })
})
