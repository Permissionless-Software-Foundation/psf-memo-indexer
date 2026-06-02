import { utf8FromPush, logProcessError } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handleSetName (ctx) {
  const { adapters, txid, signerAddr, decoded, seen } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid set name push data count ${pushDatas.length}`)
    return
  }

  const name = utf8FromPush(pushDatas[1])
  if (name.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'set name too large')
    return
  }

  await adapters.nameDb.create(signerAddr, { name, txid, seen, addr: signerAddr })
}
