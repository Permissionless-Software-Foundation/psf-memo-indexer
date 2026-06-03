import { assert } from 'chai'
import {
  decodeMemoOpReturn,
  parseScriptPushDatas,
  isMemoScript,
  getSignerAddress,
  getAddressFromUnlockScriptHex
} from '../../../src/lib/memo-parser.js'
import { CODE_POST, CODE_PREFIX } from '../../../src/lib/memo-codes.js'

// OP_RETURN post from Go post_test.go: 6d02 + "Post message"
const POST_OP_RETURN_HEX = '6a026d020c506f7374206d657373616765'

describe('#memo-parser', () => {
  describe('#parseScriptPushDatas', () => {
    it('should parse OP_RETURN push data', () => {
      const pushDatas = parseScriptPushDatas(POST_OP_RETURN_HEX)
      assert.equal(pushDatas.length, 2)
      assert.equal(pushDatas[0][0], CODE_PREFIX)
      assert.equal(pushDatas[0][1], CODE_POST)
      assert.equal(pushDatas[1].toString('utf8'), 'Post message')
    })
  })

  describe('#decodeMemoOpReturn', () => {
    it('should decode a memo post script', () => {
      const decoded = decodeMemoOpReturn(POST_OP_RETURN_HEX)
      assert.equal(decoded.action, 'post')
      assert.equal(decoded.pushDatas[1].toString('utf8'), 'Post message')
    })

    it('should return null for non-memo script', () => {
      const decoded = decodeMemoOpReturn('76a91400')
      assert.equal(decoded, null)
    })
  })

  describe('#isMemoScript', () => {
    it('should detect memo script', () => {
      assert.equal(isMemoScript(POST_OP_RETURN_HEX), true)
    })
  })

  describe('#getAddressFromUnlockScriptHex', () => {
    const SCRIPT_SIG_1 =
      '483045022100e15e18048b78e744fe8e440eb2687b5d4eb7009140d5e71950d4351c6e3bf2ef022031b0dab7326846a58e16f6a753e0d011514f827d2adacde63912daa3f85636c5412103833927b98fab40d5f857214d802ba42ea21087105b81e9bff57bf2486c9ff171'
    const SCRIPT_SIG_2 =
      '483045022100aa35ee315859b63f92e7878304364635943b28b2334dfd796a51cb2e0b284fe3022033e852b7c965f36c7d6eecc577b01218d611450c80e75af1fd41e76cfc7af81c4121035c5970c98aa4543271348bb18de4fb04122af87555fc4411c376493cc85594c3'

    it('should derive cash address from real memo tx scriptSig', () => {
      const addr = getAddressFromUnlockScriptHex(SCRIPT_SIG_1)
      assert.isString(addr)
      assert.include(addr, 'bitcoincash:')
      assert.equal(
        addr,
        'bitcoincash:qzd7s66p0mh97s2tqkrwacx4dazwataul5m9f9yw68'
      )
    })

    it('should derive cash address from second sample scriptSig', () => {
      const addr = getAddressFromUnlockScriptHex(SCRIPT_SIG_2)
      assert.equal(
        addr,
        'bitcoincash:qrnr8q2ndfmzgfehz5txel9jpq3lrwhvt5f270fnd4'
      )
    })
  })

  describe('#getSignerAddress', () => {
    const SCRIPT_SIG_1 =
      '483045022100e15e18048b78e744fe8e440eb2687b5d4eb7009140d5e71950d4351c6e3bf2ef022031b0dab7326846a58e16f6a753e0d011514f827d2adacde63912daa3f85636c5412103833927b98fab40d5f857214d802ba42ea21087105b81e9bff57bf2486c9ff171'

    it('should return signer from txDetails with vin scriptSig', () => {
      const txDetails = {
        vin: [{ scriptSig: { hex: SCRIPT_SIG_1 } }]
      }
      const addr = getSignerAddress(txDetails)
      assert.equal(
        addr,
        'bitcoincash:qzd7s66p0mh97s2tqkrwacx4dazwataul5m9f9yw68'
      )
    })

    it('should return null when no vin', () => {
      assert.equal(getSignerAddress({}), null)
    })
  })
})
