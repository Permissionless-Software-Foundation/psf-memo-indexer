import { utf8FromPush, logProcessError, normalizeTwoPushMemoDatas } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handleSetProfilePic (ctx) {
  const { adapters, txid, signerAddr, decoded, seen, blockHeight } = ctx
  const pushDatas = normalizeTwoPushMemoDatas(decoded.pushDatas)

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid profile pic push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const url = utf8FromPush(pushDatas[1])
  if (!url.length) {
    await logProcessError(adapters, txid, 'empty profile pic url', blockHeight)
    return
  }
  if (url.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'profile pic url too large', blockHeight)
    return
  }

  await adapters.profilePicDb.create(signerAddr, { url, txid, seen, addr: signerAddr, blockHeight })
}
