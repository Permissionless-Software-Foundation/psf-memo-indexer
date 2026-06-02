import { utf8FromPush, logProcessError } from './helpers.js'
import { MAX_POST_SIZE } from '../../lib/memo-codes.js'

export async function handleSetProfile (ctx) {
  const { adapters, txid, signerAddr, decoded, seen } = ctx
  const { pushDatas } = decoded

  if (pushDatas.length !== 2) {
    await logProcessError(adapters, txid, `invalid profile push data count ${pushDatas.length}`)
    return
  }

  const text = utf8FromPush(pushDatas[1])
  if (text.length > MAX_POST_SIZE) {
    await logProcessError(adapters, txid, 'profile too large')
    return
  }

  await adapters.profileDb.create(signerAddr, { text, txid, seen, addr: signerAddr })
}
