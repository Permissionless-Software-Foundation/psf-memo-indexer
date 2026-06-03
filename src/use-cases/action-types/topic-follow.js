import { utf8FromPush, logProcessError, roomKey } from './helpers.js'
import { PREFIX_TOPIC_UNFOLLOW } from '../../lib/memo-codes.js'

export async function handleTopicFollow (ctx) {
  const { adapters, txid, signerAddr, decoded, seen, blockHeight } = ctx
  const { pushDatas, prefix } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid topic follow push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const room = utf8FromPush(pushDatas[1])
  const unfollow = prefix[1] === PREFIX_TOPIC_UNFOLLOW[1]

  await adapters.roomDb.create(roomKey(room, signerAddr), {
    room,
    addr: signerAddr,
    unfollow,
    txid,
    seen,
    type: 'follow',
    blockHeight
  })
}
