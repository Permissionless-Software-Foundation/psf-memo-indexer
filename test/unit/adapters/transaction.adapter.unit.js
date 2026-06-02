import { assert } from 'chai'
import sinon from 'sinon'
import Transaction from '../../../src/adapters/transaction.js'

describe('#Transaction', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new Transaction()
  })

  afterEach(() => sandbox.restore())

  it('should detect memo tx', async () => {
    sandbox.stub(uut, 'getTxData').resolves({
      vout: [{
        scriptPubKey: {
          hex: '6a026d020474657374'
        }
      }],
      vin: []
    })

    const result = await uut.isMemoTx('testtx')
    assert.equal(result, true)
  })
})
