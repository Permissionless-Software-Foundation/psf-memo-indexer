import { assert } from 'chai'
import sinon from 'sinon'
import IndexBlocks from '../../../src/use-cases/index-blocks.js'

describe('#IndexBlocks', () => {
  let uut
  let sandbox
  let adapters

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    adapters = {
      ptxDb: {
        get: sandbox.stub().rejects(new Error('not found')),
        create: sandbox.stub().resolves({ success: true })
      },
      processErrorDb: { create: sandbox.stub().resolves({ success: true }) },
      transaction: {
        get: sandbox.stub().resolves({
          txid: 'tx1',
          vin: [{ txid: 'prev', vout: 0, scriptSig: { hex: '471044...' } }],
          vout: [{
            scriptPubKey: {
              hex: '6a046d020102',
              addresses: ['bitcoincash:qptest']
            }
          }]
        })
      },
      rpc: {
        getBlockHash: sandbox.stub().resolves('block-hash-1'),
        getBlock: sandbox.stub().resolves({ tx: [], time: 1500000000 })
      },
      filterBlock: {
        filterMemoTxs: sandbox.stub().resolves([])
      }
    }
    uut = new IndexBlocks({ adapters })
    uut.retryQueue = {
      addToQueue: sandbox.stub().callsFake(async (fn, arg) => {
        if (fn === adapters.rpc.getBlockHash) return adapters.rpc.getBlockHash(arg)
        if (fn === adapters.rpc.getBlock) return adapters.rpc.getBlock(arg)
        throw new Error('Unexpected addToQueue call')
      })
    }
    uut.filterBlock = adapters.filterBlock
  })

  afterEach(() => sandbox.restore())

  describe('#processMemoTxs', () => {
    it('should process all memo txs in parallel', async () => {
      const processMemoTx = sandbox.stub(uut, 'processMemoTx').resolves(true)
      const blockSeen = 1500000000000

      await uut.processMemoTxs(['tx-a', 'tx-b', 'tx-c'], 600000, blockSeen)

      assert.equal(processMemoTx.callCount, 3)
      assert.deepEqual(
        processMemoTx.getCalls().map((call) => call.args[0]).sort(),
        ['tx-a', 'tx-b', 'tx-c']
      )
      processMemoTx.getCalls().forEach((call) => {
        assert.equal(call.args[1], 600000)
        assert.equal(call.args[2], blockSeen)
      })
    })

    it('should fail the block if any memo tx fails', async () => {
      sandbox.stub(uut, 'processMemoTx')
        .onFirstCall().resolves(true)
        .onSecondCall().rejects(new Error('db error'))
        .onThirdCall().resolves(true)

      try {
        await uut.processMemoTxs(['tx-a', 'tx-b', 'tx-c'], 600000, 1500000000000)
        assert.fail('Expected processMemoTxs to throw')
      } catch (err) {
        assert.include(err.message, 'db error')
      }
    })
  })

  describe('#processBlock', () => {
    it('should pass block.time in milliseconds to processMemoTxs', async () => {
      const processMemoTxs = sandbox.stub(uut, 'processMemoTxs').resolves(true)
      adapters.filterBlock.filterMemoTxs.resolves(['tx-a', 'tx-b'])

      await uut.processBlock(600000)

      assert.equal(processMemoTxs.callCount, 1)
      assert.deepEqual(processMemoTxs.firstCall.args, [['tx-a', 'tx-b'], 600000, 1500000000000])
    })
  })
})
