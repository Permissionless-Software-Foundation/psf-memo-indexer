import { assert } from 'chai'
import {
  decodeMemoOpReturn,
  parseScriptPushDatas,
  isMemoScript
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
})
