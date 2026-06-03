import { assert } from 'chai'
import sinon from 'sinon'
import { handlePost } from '../../../../src/use-cases/action-types/post.js'
import { PREFIX_POST } from '../../../../src/lib/memo-codes.js'

describe('#handlePost', () => {
  it('should save a post to the database', async () => {
    const create = sinon.stub().resolves({ success: true })
    const get = sinon.stub().rejects(new Error('not found'))

    const adapters = {
      postDb: { create, get },
      processErrorDb: { create: sinon.stub() }
    }

    const message = Buffer.from('hello memo')
    await handlePost({
      adapters,
      txid: 'abc123',
      signerAddr: 'bitcoincash:qptest',
      seen: 1000,
      blockHeight: 600100,
      decoded: {
        action: 'post',
        prefix: PREFIX_POST,
        pushDatas: [PREFIX_POST, message]
      }
    })

    assert.equal(create.callCount, 1)
    assert.equal(create.firstCall.args[0], 'abc123')
    assert.equal(create.firstCall.args[1].text, 'hello memo')
    assert.equal(create.firstCall.args[1].blockHeight, 600100)
  })
})
