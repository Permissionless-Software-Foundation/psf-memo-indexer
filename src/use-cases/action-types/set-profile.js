import { utf8FromPush, logProcessError, normalizeTwoPushMemoDatas } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handleSetProfile (ctx) {
  const { adapters, txid, signerAddr, decoded, seen, blockHeight } = ctx
  const pushDatas = normalizeTwoPushMemoDatas(decoded.pushDatas)

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid profile push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const text = utf8FromPush(pushDatas[1])
  if (text.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'profile too large', blockHeight)
    return
  }

  await adapters.profileDb.create(signerAddr, { text, txid, seen, addr: signerAddr, blockHeight })
}
