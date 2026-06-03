import { txHashFromPush, logProcessError } from './helpers.js'
import { TX_HASH_LENGTH } from '../../lib/memo-codes.js'

export async function handleLike (ctx) {
  const { adapters, txid, signerAddr, decoded, seen, txDetails, blockHeight } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid like push data count ${pushDatas.length}`, blockHeight)
    return
  }

  if (pushDatas[1].length !== TX_HASH_LENGTH) {
    await logProcessError(adapters, txid, 'like post tx hash wrong size', blockHeight)
    return
  }

  const postTxid = txHashFromPush(pushDatas[1])
  let tip = 0

  try {
    const post = await adapters.postDb.get(postTxid)
    if (post && post.addr !== signerAddr) {
      for (const vout of txDetails.vout) {
        const addrs = vout.scriptPubKey && vout.scriptPubKey.addresses
        if (addrs && addrs[0] === post.addr) {
          tip += Math.round(vout.value * 1e8)
        }
      }
    }
  } catch (err) {
    // post may not exist yet
  }

  const likeData = {
    addr: signerAddr,
    postTxid,
    seen,
    tip,
    blockHeight
  }
  await adapters.likeDb.create(txid, likeData)
}
