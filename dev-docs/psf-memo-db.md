# psf-memo-db Architecture

`psf-memo-db` is the persistence layer for the Memo indexer. It is structurally modeled on [psf-slp-db](https://github.com/Permissionless-Software-Foundation/psf-slp-db): multiple LevelDB instances behind a Koa REST API, with no business logic beyond backup and restore.

## Why a separate service

| Concern | How separation helps |
|---------|----------------------|
| File locking | Only one process opens LevelDB files; indexers use HTTP |
| Parallelism | Multiple indexer workers could share one DB API (future) |
| Backups | Close all DBs, zip, reopen—without stopping indexer logic in the same process |
| Operational familiarity | PSF already runs `psf-slp-db` beside `psf-slp-indexer-g2` |

**Tradeoff:** Every write is an HTTP round trip. Local indexing pays latency versus embedded LevelDB, but gains operational consistency with the SLP stack.

## Server bootstrap

Mirrors `psf-slp-db/bin/server.js`:

```text
index.js
  └── bin/server.js
        ├── Koa + middleware (logger, bodyparser 100mb, CORS, error handler)
        ├── controllers.initAdapters()  → level-db.openDbs()
        ├── controllers.initUseCases()  → no-op start
        ├── controllers.attachRESTControllers()
        └── app.listen(PORT)  // default 5021
```

**Intentionally omitted** from psf-slp-db: MongoDB, Passport auth, IPFS/Helia, wallet, usage tracking, `/slp` query routes. `noMongo: true` and `useIpfs: false` in config.

## LevelDB instances

Opened in `src/adapters/level-db.js`:

```javascript
leveldb/current/{name}  // valueEncoding: 'json'
```

| Instance | Cache hint | Indexer writes |
|----------|------------|----------------|
| `status` | 64 MB | Block height sync state |
| `posts` | 512 MB | Post and reply bodies |
| `postParents` | 64 MB | Reply → parent link |
| `postChildren` | 64 MB | Parent → children |
| `likes` | 64 MB | Like events |
| `names` | 64 MB | Display names |
| `profiles` | 64 MB | Profile text |
| `profilePics` | 64 MB | Avatar URLs |
| `follows` | 64 MB | Follow graph edges |
| `rooms` | 64 MB | Topic posts and follows |
| `processErrors` | 64 MB | Skipped / invalid txs |
| `ptxs` | 64 MB | Processed tx markers |

Posts receive a larger cache because they are the highest-volume social object.

## REST API shape

All routes are under `/level` with a consistent CRUD pattern generated from `ENTITY_CONFIG` in `crud-handlers.js`:

| Method | Path pattern | Body (create) |
|--------|--------------|---------------|
| `POST` | `/level/{entity}` | `{ <idField>, <dataField> }` |
| `GET` | `/level/{entity}/:key` | — |
| `PUT` | `/level/{entity}/:key` | `{ <dataField> }` |
| `DELETE` | `/level/{entity}/:key` | — |

### Entity route names

| Route | idField | dataField | Example key |
|-------|---------|-----------|-------------|
| `post` | `txid` | `postData` | transaction id |
| `postparent` | `txid` | `parentData` | child txid |
| `postchild` | `txid` | `childData` | parent txid |
| `like` | `txid` | `likeData` | like txid |
| `name` | `addr` | `nameData` | cash address |
| `profile` | `addr` | `profileData` | cash address |
| `profilepic` | `addr` | `profilePicData` | cash address |
| `follow` | `key` | `followData` | `follower:followeePkHash` |
| `room` | `key` | `roomData` | composite |
| `processerror` | `txid` | `errorData` | txid |
| `ptx` | `txid` | `ptxData` | txid |

### Read routes (query use cases)

| Method | Path | Query params |
|--------|------|----------------|
| `GET` | `/profile/recent` | `limit` (default 100, max 100), `offset` (default 0) |

Returns profiles sorted by **block height** (newest first), using each profile’s `txid` to look up `blockHeight` in `ptxs`. Tie-breaker: `seen` timestamp descending.

Response shape:

```json
{
  "profiles": [
    { "addr": "bitcoincash:q...", "text": "...", "txid": "...", "seen": 123, "blockHeight": 600000 }
  ],
  "pagination": { "limit": 100, "offset": 0, "total": 42, "hasMore": false }
}
```

Implementation: `profile-query` adapter (LevelDB scan) → `list-recent-profiles` use case → `/profile` REST controller.

**Tradeoff:** Full scan of `profiles` on each request; suitable for moderate corpus sizes. A height-indexed store would be needed for very large archives.

### Status (special case)

Matches SLP status semantics:

- `GET /level/status/:statusKey`
- `POST /level/status` with `{ statusKey, statusData }`
- `PUT /level/status` with `{ statusData }` — key is always `status`
- `DELETE /level/status/:statusKey`

Indexer expects `statusKey = status` containing:

```json
{
  "startBlockHeight": 524999,
  "syncedBlockHeight": 800000,
  "chainBlockHeight": 800001
}
```

### Backup and restore

- `POST /level/backup` — body `{ height, epoch }` → zip `leveldb/current` to `leveldb/zips/memo-indexer-{height}.zip`
- `POST /level/restore` — body `{ height }` → unzip matching archive and `process.exit(0)`

Implemented in `src/adapters/db-backup.js`.

### Health

`GET /health` → `{ status: 'ok' }` for load balancers and compose checks.

## Indexer adapter mapping

The indexer uses `src/adapters/entity-db.js`:

```javascript
createEntityDb('post', 'txid', 'postData')
// → POST http://localhost:5021/level/post
```

`status-db.js` uses dedicated status endpoints rather than the generic factory.

## Data modeling notes

**Not normalized like SQL.** LevelDB stores are document keyed for fast lookup by txid or address, similar to the Go `db/item/memo` objects but without sharding.

**No secondary indexes in v1.** Queries like “all posts by address” may require scanning or a future `memo-query` adapter—out of scope for the indexer write path.

**JSON values** keep debugging simple; binary serialization would save space but break parity with psf-slp-db tooling.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5021` | REST listen (SLP uses 5020) |
| `SVC_ENV` | `development` | Config profile |
| `BACKUP_QTY` | `3` | Retained zip backups |
| `EXIT_ON_MISSING_BACKUP` | `false` | Fail restore if zip missing |

## Testing

Unit tests cover:

- `bin/server.js` startup with stubbed controllers
- Level controller status and post CRUD with mocked LevelDB

Run: `npm test` in the `psf-memo-db` directory.

## Production

Docker build context is the `psf-memo-db` repo root; Dockerfile lives in [psf-memo-indexer/production/docker/memo-db/](../production/docker/memo-db/). See [architecture.md](./architecture.md#deployment-topology).
