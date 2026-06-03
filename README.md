# psf-memo-indexer

Indexes [Memo protocol](https://memo.cash) transactions on Bitcoin Cash. Architecture mirrors [psf-slp-indexer-g2](https://github.com/Permissionless-Software-Foundation/psf-slp-indexer-g2).

## Overview

Two processes:

- **Block indexer** — IBD from block 525000, then ZMQ new-block processing
- **TX indexer** — mempool transactions via ZMQ after IBD signals `/tx-start`

Data is stored in [psf-memo-db](../psf-memo-db) via REST.

## Developer documentation

Architecture, theory of operation, and design tradeoffs: [dev-docs/](./dev-docs/README.md).

## Requirements

- node ^20
- npm ^10
- BCH full node (RPC + ZMQ)
- Running psf-memo-db

## Installation

```bash
cd psf-memo-indexer
npm install
cp .env-example .env
```

## Usage

Start the database:

```bash
cd ../psf-memo-db && npm start
```

Block indexer:

```bash
npm run block-indexer
```

TX indexer (separate terminal):

```bash
npm run tx-indexer
```

## Configuration

See `.env-example`. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PSF_MEMO_DB_URL` | `http://localhost:5021` | psf-memo-db URL |
| `START_BLOCK_HEIGHT` | `525000` | First block to index |
| `RPC_IP` / `RPC_PORT` | `172.17.0.1` / `8332` | Full node RPC |
| `ZMQ_PORT` | `28332` | Full node ZMQ |
| `TX_REST_API_PORT` | `5455` | TX indexer control API |
| `FILTER_CONCURRENCY` | `20` | Parallel Memo tx detection per block |
| `MEMO_TX_CONCURRENCY` | `20` | Parallel Memo tx processing per block |

## Tests

```bash
npm test
```

## Production (Docker)

Docker files live under [production/docker](./production/docker), matching [psf-slp-indexer-g2](https://github.com/Permissionless-Software-Foundation/psf-slp-indexer-g2):

```bash
cd production/docker
cp block-indexer/.env-example block-indexer/.env
cp tx-indexer/.env-example tx-indexer/.env
cp memo-db/.env-example memo-db/.env
docker-compose build
docker-compose up -d
```

Services: `memo-db` (port 5021), `block-indexer`, `tx-indexer` (port 5455).

## License

GPL v3
