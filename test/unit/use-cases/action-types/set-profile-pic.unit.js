import { assert } from 'chai'
import sinon from 'sinon'
import { handleSetProfilePic } from '../../../../src/use-cases/action-types/set-profile-pic.js'
import { PREFIX_SET_PROFILE_PIC } from '../../../../src/lib/memo-codes.js'

describe('#handleSetProfilePic', () => {
  let adapters

  beforeEach(() => {
    adapters = {
      profilePicDb: { create: sinon.stub().resolves() },
      processErrorDb: { create: sinon.stub().resolves() }
    }
  })

  it('should index profile pic from single-push OP_RETURN', async () => {
    const urlBytes = Buffer.from('https://memo.cash/img/abc', 'utf8')
    const combined = Buffer.concat([PREFIX_SET_PROFILE_PIC, urlBytes])

    await handleSetProfilePic({
      adapters,
      txid: 'abc123',
      signerAddr: 'bitcoincash:qptest',
      seen: 12345,
      blockHeight: 600200,
      decoded: { pushDatas: [combined] }
    })

    assert.equal(adapters.processErrorDb.create.callCount, 0)
    assert.equal(adapters.profilePicDb.create.callCount, 1)
    const [addr, data] = adapters.profilePicDb.create.firstCall.args
    assert.equal(addr, 'bitcoincash:qptest')
    assert.equal(data.url, 'https://memo.cash/img/abc')
    assert.equal(data.blockHeight, 600200)
  })
})
