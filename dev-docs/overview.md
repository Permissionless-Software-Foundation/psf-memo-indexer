# Overview: Why the Memo Indexer Exists

## The problem

The [Memo protocol](https://memo.cash) encodes social actions—posts, replies, likes, follows, profiles, topics—in **Bitcoin Cash transactions** using `OP_RETURN` outputs. Wallets and explorers can read individual transactions from a full node, but useful applications need:

- A **queryable history** of who posted what, when, and in reply to which parent transaction
- **Derived indexes** (follow graph, likes per post, topic membership) without re-scanning the entire chain on every API request
- **Consistent interpretation** of Memo action bytes (`0x6d` prefix + action code) across services

Scanning the blockchain on demand for every user request does not scale. The Memo indexer exists to **materialize** protocol state into local databases so other apps (APIs, analytics, mirrors) can read indexed data quickly.

## What this stack does

Two cooperating Node.js services mirror the proven PSF pattern used for SLP tokens:

```text
BCH full node (RPC + ZMQ)
        │
        ▼
┌───────────────────────┐     HTTP REST      ┌─────────────────┐
│  psf-memo-indexer     │ ─────────────────► │  psf-memo-db    │
│  (2 processes)        │   /level/*         │  (LevelDB)      │
└───────────────────────┘                    └─────────────────┘
        │                                              │
        │                                              ▼
        │                                    Query / backup APIs
        ▼
   Memo OP_RETURN txs
   from blocks + mempool
```

**psf-memo-indexer** watches the chain, detects Memo transactions, validates action payloads, and writes structured records.

**psf-memo-db** owns storage. It exposes CRUD over multiple LevelDB instances so the indexer (and future tools) do not open database files directly—avoiding lock contention and allowing backup/restore as a separate concern.

## What v1 indexes

The JavaScript indexer intentionally matches the **core social handlers** registered in the reference Go indexer’s `op_return` package—not the full Memo protocol spec:

| Indexed in v1 | Not indexed in v1 |
|---------------|-------------------|
| Set name (`0x6d01`) | Polls (`0x6d10`–`0x6d14`) |
| Post (`0x6d02`) | Mute / unmute |
| Reply (`0x6d03`) | Send money (`0x6d24`) |
| Like (`0x6d04`) | Token sale MIP-0009 actions |
| Set profile (`0x6d05`) | SLP / Bitcom OP_RETURN in Go indexer |
| Follow / unfollow (`0x6d06` / `0x6d07`) | Planned spec actions (`0x6d08`, `0x6d0b`, …) |
| Set profile picture (`0x6d0a`) | |
| Topic message / follow / unfollow (`0x6d0c`–`0x6d0e`) | |

See [design-decisions-and-tradeoffs.md](./design-decisions-and-tradeoffs.md) for rationale.

## Start height

Indexing begins at block **525000** (`BeginningOfMemoHeight` in the Go reference). Earlier blocks are skipped because Memo activity before that height is negligible for practical deployments.

## Who consumes the output

This repository does **not** ship a GraphQL or public REST API for end users—that exists in the separate [memo/index](https://github.com/memocash/index) Go project. PSF’s stack is an **indexer + DB layer** intended for:

- PSF infrastructure that wants Memo data beside SLP indexing patterns
- Custom services that call `psf-memo-db` REST endpoints
- Future query layers (e.g. a slim `memo-query` module) without reimplementing chain scanning

## Operational summary

| Process | Entry point | When it runs |
|---------|-------------|--------------|
| Block indexer | `psf-memo-block-indexer.js` | IBD from `START_BLOCK_HEIGHT` to chain tip; then ZMQ `rawblock` |
| TX indexer | `psf-memo-tx-indexer.js` | After block indexer calls `GET /tx-start`; then ZMQ `rawtx` |
| Database | `psf-memo-db` `index.js` | Must be running before indexers start |

Typical development:

```bash
# Terminal 1
cd psf-memo-db && npm start

# Terminal 2
cd psf-memo-indexer && npm run block-indexer

# Terminal 3
cd psf-memo-indexer && npm run tx-indexer
```

Production uses [production/docker](../production/docker/) with the same three logical services.
