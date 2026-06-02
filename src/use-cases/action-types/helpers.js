/*
  Shared helpers for Memo action handlers.
*/

export async function logProcessError (adapters, txid, error) {
  try {
    await adapters.processErrorDb.create(txid, { error, ts: Date.now() })
  } catch (err) {
    console.error('Failed to log process error:', err.message)
  }
}

export function utf8FromPush (buf) {
  return buf.toString('utf8')
}

export function txHashFromPush (buf) {
  if (!buf || buf.length !== 32) return null
  return buf.toString('hex')
}

export function followKey (followerAddr, followeeAddr) {
  return `${followerAddr}:${followeeAddr}`
}

export function roomKey (roomName, txid) {
  return `${roomName}:${txid}`
}
