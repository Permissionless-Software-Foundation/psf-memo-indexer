import { logProcessError } from './helpers.js'
import { PK_HASH_LENGTH, PREFIX_UNFOLLOW } from '../../lib/memo-codes.js'

export async function handleFollow (ctx) {
  const { adapters, txid, signerAddr, decoded, seen } = ctx
  const { pushDatas, prefix } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid follow push data count ${pushDatas.length}`)
    return
  }

  if (pushDatas[1].length !== PK_HASH_LENGTH) {
    await logProcessError(adapters, txid, 'follow pk hash wrong size')
    return
  }

  const unfollow = prefix[1] === PREFIX_UNFOLLOW[1]
  const followeePkHash = pushDatas[1].toString('hex')

  const key = `${signerAddr}:${followeePkHash}`
  await adapters.followDb.create(key, {
    followerAddr: signerAddr,
    followeePkHash,
    unfollow,
    txid,
    seen
  })
}
