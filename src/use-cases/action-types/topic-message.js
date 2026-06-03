import { utf8FromPush, logProcessError, roomKey } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'
import { handlePost } from './post.js'

export async function handleTopicMessage (ctx) {
  const { adapters, txid, decoded, seen, blockHeight } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 3) {
    await logProcessError(adapters, txid, `invalid topic message push data count ${pushDatas.length}`, blockHeight)
    return
  }

  const room = utf8FromPush(pushDatas[1])
  const message = utf8FromPush(pushDatas[2])
  if ((room.length + message.length) > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'topic message too large', blockHeight)
    return
  }

  await handlePost({
    ...ctx,
    decoded: { ...decoded, pushDatas: [pushDatas[0], pushDatas[2]] }
  })

  await adapters.roomDb.create(roomKey(room, txid), { room, txid, seen, type: 'post', blockHeight })
}
