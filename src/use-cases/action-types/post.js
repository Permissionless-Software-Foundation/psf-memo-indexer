import { utf8FromPush, logProcessError, normalizeTwoPushMemoDatas } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handlePost (ctx) {
  const { adapters, txid, signerAddr, decoded, seen, blockHeight } = ctx
  const pushDatas = normalizeTwoPushMemoDatas(decoded.pushDatas)

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid post push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const text = utf8FromPush(pushDatas[1])
  if (!text.length) {
    await logProcessError(adapters, txid, 'empty post', blockHeight)
    return
  }
  if (text.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'post too large', blockHeight)
    return
  }

  const postData = { addr: signerAddr, text, seen, blockHeight }
  try {
    await adapters.postDb.get(txid)
  } catch (err) {
    await adapters.postDb.create(txid, postData)
  }
}
