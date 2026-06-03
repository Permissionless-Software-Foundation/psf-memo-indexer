/*
  Shared helpers for Memo action handlers.
*/

import { isMemoPrefix } from '../../lib/memo-codes.js'

export async function logProcessError (adapters, txid, error, blockHeight) {
  try {
    await adapters.processErrorDb.create(txid, { error, ts: Date.now(), blockHeight })
  } catch (err) {
    console.error('Failed to log process error:', err.message)
  }
}

export function utf8FromPush (buf) {
  return buf.toString('utf8')
}

/**
 * Drop leading empty pushes (btcd txscript.PushedData compatibility).
 */
export function stripLeadingEmptyPushes (pushDatas) {
  let datas = pushDatas
  while (datas.length > 1 && datas[0] && datas[0].length === 0) {
    datas = datas.slice(1)
  }
  return datas
}

/**
 * Normalize Memo actions that use prefix + payload as two script pushes.
 * Some wallets encode both in a single push (0x6dXX + data); split for handlers.
 */
export function normalizeTwoPushMemoDatas (pushDatas) {
  const datas = stripLeadingEmptyPushes(pushDatas)

  if (datas.length === 2) {
    return datas
  }

  if (datas.length === 1 && isMemoPrefix(datas[0]) && datas[0].length > 2) {
    return [datas[0].subarray(0, 2), datas[0].subarray(2)]
  }

  return datas
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
