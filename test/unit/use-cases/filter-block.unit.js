import { assert } from 'chai'
import sinon from 'sinon'
import FilterBlock from '../../../src/use-cases/filter-block.js'

describe('#FilterBlock', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    const adapters = {
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
})
