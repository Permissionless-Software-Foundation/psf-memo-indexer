import { utf8FromPush, txHashFromPush, logProcessError } from './helpers.js'
import { MAX_REPLY_SIZE } from '../../lib/memo-codes.js'
import { handlePost } from './post.js'

export async function handleReply (ctx) {
  const { adapters, txid, decoded, blockHeight } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 3) {
    await logProcessError(adapters, txid, `invalid reply push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const parentTxid = txHashFromPush(pushDatas[1])
  if (!parentTxid) {
    await logProcessError(adapters, txid, 'invalid parent tx hash for reply', blockHeight)
    return
  }

  const text = utf8FromPush(pushDatas[2])
  if (text.length > MAX_REPLY_SIZE) {
    await logProcessError(adapters, txid, 'reply too large', blockHeight)
    return
  }

  await adapters.postParentDb.create(txid, { parentTxid, childTxid: txid, blockHeight })
  await adapters.postChildDb.create(parentTxid, { parentTxid, childTxid: txid, blockHeight })

  await handlePost({ ...ctx, decoded: { ...decoded, pushDatas: [pushDatas[0], pushDatas[2]] } })
}
