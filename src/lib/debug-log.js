/*
  Debug logging for Memo indexer (controlled by DEBUG_LEVEL).
*/

import config from '../../config/index.js'

export function getDebugLevel () {
  const level = config.debugLevel
  if (typeof level !== 'number' || Number.isNaN(level) || level < 0) {
    return 0
  }
  return level
}

/**
 * Level 1: per-Memo-tx line with action type(s) and outcome.
 */
export function logMemoTxResult ({ txid, actions = [], success, error, skipped }) {
  if (getDebugLevel() < 1) return

  const actionStr = actions.length ? actions.join(', ') : 'unknown'

  if (skipped) {
    console.log(`Memo tx ${txid} actions=[${actionStr}] skipped (already indexed)`)
    return
  }

  if (success) {
    console.log(`Memo tx ${txid} actions=[${actionStr}] ok`)
  } else {
    console.log(`Memo tx ${txid} actions=[${actionStr}] failed: ${error || 'unknown'}`)
  }
}
