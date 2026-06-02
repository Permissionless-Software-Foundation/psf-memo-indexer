import { utf8FromPush, logProcessError } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handlePost (ctx) {
  const { adapters, txid, signerAddr, decoded, seen } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid post push data count ${pushDatas.length}`)
    return
  }

  const text = utf8FromPush(pushDatas[1])
  if (!text.length) {
    await logProcessError(adapters, txid, 'empty post')
    return
  }
  if (text.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'post too large')
    return
  }

  const postData = { addr: signerAddr, text, seen }
  try {
    await adapters.postDb.get(txid)
  } catch (err) {
    await adapters.postDb.create(txid, postData)
  }
}
