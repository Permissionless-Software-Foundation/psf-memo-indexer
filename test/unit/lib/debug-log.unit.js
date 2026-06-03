import { assert } from 'chai'
import sinon from 'sinon'
import config from '../../../config/index.js'
import { getDebugLevel, logMemoTxResult } from '../../../src/lib/debug-log.js'

describe('#debug-log', () => {
  let sandbox
  let originalDebugLevel

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    originalDebugLevel = config.debugLevel
    sandbox.stub(console, 'log')
  })

  afterEach(() => {
    config.debugLevel = originalDebugLevel
    sandbox.restore()
  })

  describe('#getDebugLevel', () => {
    it('should default invalid levels to 0', () => {
      config.debugLevel = NaN
      assert.equal(getDebugLevel(), 0)
    })
  })

  describe('#logMemoTxResult', () => {
    it('should not log when debug level is 0', () => {
      config.debugLevel = 0
      logMemoTxResult({
        txid: 'abc',
        actions: ['post'],
        success: true
      })
      assert.equal(console.log.callCount, 0)
    })

    it('should log ok with actions at level 1', () => {
      config.debugLevel = 1
      logMemoTxResult({
        txid: 'abc',
        actions: ['post'],
        success: true
      })
      assert.include(console.log.firstCall.args[0], 'actions=[post]')
      assert.include(console.log.firstCall.args[0], 'ok')
    })

    it('should log failure with process error at level 1', () => {
      config.debugLevel = 1
      logMemoTxResult({
        txid: 'abc',
        actions: ['like'],
        success: false,
        error: 'invalid like push data count 1'
      })
      assert.include(console.log.firstCall.args[0], 'failed:')
      assert.include(console.log.firstCall.args[0], 'invalid like')
    })
  })
})
