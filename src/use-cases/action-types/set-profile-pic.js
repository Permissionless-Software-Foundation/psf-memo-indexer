import { utf8FromPush, logProcessError } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handleSetProfilePic (ctx) {
  const { adapters, txid, signerAddr, decoded, seen } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid profile pic push data count ${pushDatas.length}`)
    return
  }

  const url = utf8FromPush(pushDatas[1])
  if (url.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'profile pic url too large')
    return
  }

  await adapters.profilePicDb.create(signerAddr, { url, txid, seen, addr: signerAddr })
}
