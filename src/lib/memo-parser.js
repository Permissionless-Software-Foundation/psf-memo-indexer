/*
  Parse Memo OP_RETURN scripts and extract signer addresses from transactions.
*/

import BCHJS from '@psf/bch-js'
import {
  isMemoPrefix,
  getActionFromPrefix,
  CODE_PREFIX
} from './memo-codes.js'

let bchjs
function getBchjs () {
  if (!bchjs) {
    bchjs = new BCHJS({
      restURL: process.env.RESTURL || 'https://api.fullstack.cash/v5/'
    })
  }
  return bchjs
}

/**
 * Parse push data chunks from a script hex string.
 */
export function parseScriptPushDatas (scriptHex) {
  if (!scriptHex || typeof scriptHex !== 'string') return []

  const buf = Buffer.from(scriptHex, 'hex')
  const pushDatas = []
  let i = 0

  while (i < buf.length) {
    const op = buf[i]

    if (op === 0x00) {
      pushDatas.push(Buffer.alloc(0))
      i++
      continue
    }

    if (op >= 0x01 && op <= 0x4b) {
      const len = op
      pushDatas.push(buf.slice(i + 1, i + 1 + len))
      i += 1 + len
      continue
    }

    if (op === 0x4c) {
      const len = buf[i + 1]
      pushDatas.push(buf.slice(i + 2, i + 2 + len))
      i += 2 + len
      continue
    }

    if (op === 0x4d) {
      const len = buf.readUInt16LE(i + 1)
      pushDatas.push(buf.slice(i + 3, i + 3 + len))
      i += 3 + len
      continue
    }

    if (op === 0x4e) {
      const len = buf.readUInt32LE(i + 1)
      pushDatas.push(buf.slice(i + 5, i + 5 + len))
      i += 5 + len
      continue
    }

    // Skip opcode (OP_RETURN 0x6a, etc.)
    i++
  }

  return pushDatas
}

/**
 * Decode Memo OP_RETURN from a scriptPubKey hex string.
 */
export function decodeMemoOpReturn (scriptHex) {
  const pushDatas = parseScriptPushDatas(scriptHex)
  if (!pushDatas.length) return null

  // OP_RETURN scripts: first push may be after OP_RETURN opcode parsing;
  // find first memo prefix in pushes
  for (const data of pushDatas) {
    if (!isMemoPrefix(data)) continue
    const action = getActionFromPrefix(data)
    if (!action) continue
    return { action, prefix: data, pushDatas }
  }

  return null
}

export function isMemoScript (scriptHex) {
  return decodeMemoOpReturn(scriptHex) !== null
}

export function findMemoOutputs (txDetails) {
  const matches = []
  if (!txDetails || !txDetails.vout) return matches

  for (let i = 0; i < txDetails.vout.length; i++) {
    const vout = txDetails.vout[i]
    const hex = vout.scriptPubKey && vout.scriptPubKey.hex
    const decoded = decodeMemoOpReturn(hex)
    if (decoded) {
      matches.push({ voutIndex: i, ...decoded })
    }
  }
  return matches
}

export function getSignerAddress (txDetails) {
  if (!txDetails || !txDetails.vin) return null

  for (const vin of txDetails.vin) {
    if (!vin.scriptSig || !vin.scriptSig.hex) continue
    try {
      const scriptBuf = Buffer.from(vin.scriptSig.hex, 'hex')
      const addr = getBchjs().Script.getAddressFromScriptSig(scriptBuf)
      if (addr) return addr
    } catch (err) {
      continue
    }
  }
  return null
}

export function getPkHashFromAddress (address) {
  try {
    const decoded = getBchjs().Address.decode(address)
    return Buffer.from(decoded.hash)
  } catch (err) {
    return null
  }
}

export function prefixToHex (prefixBuf) {
  return prefixBuf.toString('hex')
}

export { CODE_PREFIX, isMemoPrefix }
