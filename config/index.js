import 'dotenv/config'

export default {
  psfMemoDbUrl: process.env.PSF_MEMO_DB_URL || 'http://localhost:5021',

  rpcIp: process.env.RPC_IP || '172.17.0.1',
  rpcPort: process.env.RPC_PORT || '8332',
  zmqPort: process.env.ZMQ_PORT || '28332',
  rpcUser: process.env.RPC_USER || 'bitcoin',
  rpcPass: process.env.RPC_PASS || 'password',

  txRestApiPort: process.env.TX_REST_API_PORT ? parseInt(process.env.TX_REST_API_PORT) : 5455,
  txRestApiIp: process.env.TX_REST_API_IP || 'localhost',
  seenTxMax: process.env.SEEN_TX_MAX ? parseInt(process.env.SEEN_TX_MAX) : 100000,
  zmqTxQueueMax: process.env.ZMQ_TX_QUEUE_MAX ? parseInt(process.env.ZMQ_TX_QUEUE_MAX) : 50000,
  zmqBlockQueueMax: process.env.ZMQ_BLOCK_QUEUE_MAX ? parseInt(process.env.ZMQ_BLOCK_QUEUE_MAX) : 1000,
  txCacheMax: process.env.TX_CACHE_MAX ? parseInt(process.env.TX_CACHE_MAX) : 100000,

  filterConcurrency: process.env.FILTER_CONCURRENCY
    ? parseInt(process.env.FILTER_CONCURRENCY)
    : 20,
  memoTxConcurrency: process.env.MEMO_TX_CONCURRENCY
    ? parseInt(process.env.MEMO_TX_CONCURRENCY)
    : 20,

  startBlockHeight: process.env.START_BLOCK_HEIGHT
    ? parseInt(process.env.START_BLOCK_HEIGHT)
    : 525000,

  exitOnMissingBackup: process.env.EXIT_ON_MISSING_BACKUP === 'true',

  debugLevel: process.env.DEBUG_LEVEL !== undefined
    ? parseInt(process.env.DEBUG_LEVEL, 10)
    : 0
}
