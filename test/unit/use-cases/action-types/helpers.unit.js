import { assert } from 'chai'
import sinon from 'sinon'
import {
  normalizeTwoPushMemoDatas,
  stripLeadingEmptyPushes,
  logProcessError
} from '../../../../src/use-cases/action-types/helpers.js'
import { PREFIX_SET_PROFILE_PIC, PREFIX_POST } from '../../../../src/lib/memo-codes.js'

describe('#action-types/helpers', () => {
  describe('#normalizeTwoPushMemoDatas', () => {
    it('should pass through standard two-push encoding', () => {
      const prefix = PREFIX_SET_PROFILE_PIC
      const url = Buffer.from('https://example.com/pic.png', 'utf8')
      const normalized = normalizeTwoPushMemoDatas([prefix, url])
      assert.equal(normalized.length, 2)
      assert.equal(normalized[1].toString('utf8'), 'https://example.com/pic.png')
    })

    it('should split single-push prefix+payload (profile pic on-chain format)', () => {
      const url = Buffer.from('-hash-or-url-bytes', 'utf8')
      const combined = Buffer.concat([PREFIX_SET_PROFILE_PIC, url])
      const normalized = normalizeTwoPushMemoDatas([combined])
      assert.equal(normalized.length, 2)
      assert.deepEqual(normalized[0], PREFIX_SET_PROFILE_PIC)
      assert.deepEqual(normalized[1], url)
    })

    it('should handle user sample: one push with 0x6d0a prefix and 18-byte payload', () => {
      const combined = Buffer.from(
        '6d0a2da40232abb64740e8abeef1f102bdc92ed5',
        'hex'
      )
      const normalized = normalizeTwoPushMemoDatas([combined])
      assert.equal(normalized.length, 2)
      assert.equal(normalized[0][1], 0x0a)
      assert.equal(normalized[1].length, 18)
    })

    it('should strip leading empty push before normalizing', () => {
      const message = Buffer.from('hello', 'utf8')
      const combined = Buffer.concat([PREFIX_POST, message])
      const normalized = normalizeTwoPushMemoDatas([Buffer.alloc(0), combined])
      assert.equal(normalized.length, 2)
      assert.equal(normalized[1].toString('utf8'), 'hello')
    })
  })

  describe('#stripLeadingEmptyPushes', () => {
    it('should remove only leading empty pushes', () => {
      const payload = Buffer.from([0xab])
      const result = stripLeadingEmptyPushes([Buffer.alloc(0), payload])
      assert.equal(result.length, 1)
      assert.deepEqual(result[0], payload)
    })
  })

  describe('#logProcessError', () => {
    it('should store blockHeight on process error records', async () => {
      const create = sinon.stub().resolves()
      const adapters = { processErrorDb: { create } }

      await logProcessError(adapters, 'tx1', 'bad data', 600100)

      assert.equal(create.callCount, 1)
      assert.equal(create.firstCall.args[0], 'tx1')
      assert.equal(create.firstCall.args[1].error, 'bad data')
      assert.equal(create.firstCall.args[1].blockHeight, 600100)
    })
  })
})
