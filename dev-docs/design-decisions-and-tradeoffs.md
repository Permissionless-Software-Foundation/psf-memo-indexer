# Design Decisions and Tradeoffs

This document records **why** the Memo indexer stack looks the way it does, including deliberate limitations and comparisons to adjacent systems.

## 1. Mirror the SLP indexer architecture

**Decision:** Two processes (block + TX), separate `psf-memo-db`, Clean Architecture folders, axios DB adapters, ZMQ + RPC, epoch zip backups, Express `/tx-start` gate.

**Reason:** PSF already operates `psf-slp-indexer-g2` + `psf-slp-db` in production. Reusing the pattern reduces training cost, Docker layout, and incident playbooks.

**Tradeoff:** Memo does not need SLP’s DAG ordering or UTXO graph, so some SLP machinery is absent—but the **process and deployment** model stays parallel.

| Aspect | SLP stack | Memo stack |
|--------|-----------|------------|
| DB port | 5020 | 5021 |
| TX REST port | 5454 | 5455 |
| Parser | `slp-parser` + Lokad ID | `memo-parser` + `0x6d` prefix |
| DB entities | tokens, utxos, addrs | posts, likes, follows, … |

## 2. Separate database service (not embedded LevelDB)

**Decision:** Indexer never opens LevelDB files directly.

**Pros:**

- Aligns with psf-slp-db backup/restore workflow
- Avoids multi-process file lock issues
- Clear boundary for future read replicas or query services

**Cons:**

- HTTP latency on every write
- More moving parts in development (three processes)

**Alternative rejected:** Single Node process with embedded LevelDB—simpler locally but diverges from PSF production norms.

## 3. Scope limited to Go indexer “core social” handlers

**Decision:** v1 implements the handlers in [memo/index/node/obj/op_return/main.go](https://github.com/memocash/index/blob/master/node/obj/op_return/main.go) (`GetHandlers`), not the full [memo-protocol.md](../../memo-protocol.md) table.

**Included:** name, post, reply, like, profile, profile pic, follow/unfollow, topic message, topic follow/unfollow.

**Excluded (v1):**

- Polls, mute, send money
- MIP-0009 token sale actions (`0x6d30`–`0x6d32`)
- SLP handler present in Go’s registry (`slp_tokenHandler`)
- Planned actions (`0x6d08`, `0x6d0b`, …)

**Reason:** Ship a useful social subgraph first; token and poll logic add validation and cross-tx dependencies.

**Risk:** Indexer state diverges from memo.sv for excluded actions until handlers are added.

## 4. Parallel processing within blocks (no DAG sort)

**Decision:** Filter and process Memo txs concurrently within a block using `p-queue`. Default concurrency is 20 for both phases (`FILTER_CONCURRENCY`, `MEMO_TX_CONCURRENCY`). Filter results are reordered to match block tx order before processing starts.

**SLP context:** SEND transactions may spend token outputs created earlier in the same block; DAG sort orders them correctly and writes must stay serial when UTXO state overlaps.

**Memo context:** Social actions do not consume each other’s UTXOs in a token graph. Most handler writes are keyed by `txid` and are independent across transactions. Parallel `processMemoTx` is safe for typical blocks.

**Soft ordering:** Likes that reference a post in the same block may compute `tip = 0` if the post handler has not finished yet. Replies still persist parent/child links and post bodies regardless of completion order. Profile/follow handlers keyed by address can race if the same signer emits multiple updates in one block (rare).

**Within a single tx:** Multiple Memo `OP_RETURN` outputs in one transaction are still dispatched sequentially inside `processMemoTx`.

**Tradeoff:** Higher throughput vs. HTTP contention on `psf-memo-db`. Lower `MEMO_TX_CONCURRENCY` if the DB service becomes the bottleneck.

**Alternative rejected:** Full serial processing—simple but leaves RPC/DB latency on the table during IBD when blocks contain many unrelated Memo txs.

## 5. Scan all transaction outputs for OP_RETURN

**Decision:** `findMemoOutputs` checks every `vout`, not only `vout[0]`.

**Reason:** Go `node/obj/saver/op_return.go` iterates all outputs; Memo has no protocol rule fixing OP_RETURN to the first output.

**Cost:** Slightly more script parsing per tx during filter and process.

## 6. Custom script pushdata parser (with selective bch-js)

**Decision:** `parseScriptPushDatas` implements Bitcoin push opcode walking in JavaScript; `@psf/bch-js` is used for signer address extraction from inputs.

**Reason:** Unit tests must run without a full node; decompile behavior must be predictable for standard `OP_RETURN` Memo txs.

**Tradeoff:** Non-standard scripts may parse differently than `btcd`—edge cases go to `processErrors`.

## 7. Signer = first decodable input address

**Decision:** Walk `vin` until `Script.getAddressFromScriptSig` succeeds.

**Matches:** Go indexer behavior when building `parse.OpReturn.Addr`.

**Limitation:** Multi-input txs with multiple signers attribute the action to the first resolved address only—consistent with reference indexer, not necessarily with user intent for complex txs.

## 8. Idempotency at transaction level only

**Decision:** `ptxs` store marks completed txs; handlers may write multiple LevelDB keys per tx without a cross-store transaction.

**Go indexer:** Uses richer `db.Save([]db.Object{...})` batches.

**Failure mode:** Crash mid-handler could leave partial writes; re-run skips entire tx if `ptx` was written— or duplicates sub-objects if ptx write failed last.

**Mitigation path:** Write ptx last (current code writes ptx after handlers—good) or add DB batch API.

## 9. Process errors are non-fatal

**Decision:** Invalid pushdata counts or oversize fields log to `processErrors` and return; they do not stop the block.

**Reason:** Chain history contains malformed or experimental Memo txs; one bad tx must not halt IBD.

**Ops note:** Monitor `processErrors` growth for parser bugs vs true invalid chain data.

## 10. Start block 525000

**Decision:** Default `START_BLOCK_HEIGHT=525000` from Go `BeginningOfMemoHeight`.

**Tradeoff:** Earlier Memo experiments exist on-chain but are excluded unless the operator lowers the height and reindexes from genesis of Memo data.

## 11. psf-memo-db: thin controller, no GraphQL

**Decision:** Level routes call LevelDB directly; no Mongoose, no GraphQL.

**Go memo/index** exposes GraphQL with attach resolvers loading from sharded DB—the read path is a separate product layer.

**PSF stack** stops at indexed storage + REST CRUD for writers. Read APIs are the integrator’s responsibility.

**Future:** A `memo-query.js` adapter (like `slp-query.js`) could encapsulate common reads without pulling in full GraphQL.

## 12. Mempool vs confirmed indexing

**Decision:** TX indexer uses `blockHeight = tip + 1` for unconfirmed txs; block indexer re-processes confirmed blocks.

**Nuance:** A mempool tx may be indexed twice (mempool + block) but `ptx` idempotency prevents duplicate handler effects.

**Edge case:** Tx never confirms—remains indexed with provisional height; may be acceptable for social UX or require GC policy later.

## 13. Docker layout under `production/docker`

**Decision:** Dockerfiles live in `psf-memo-indexer/production/docker/{memo-db,block-indexer,tx-indexer}/`, not repo roots—matching psf-slp-indexer-g2.

**Reason:** Single compose file orchestrates three services; build contexts point at `psf-memo-db` sibling repo and indexer root.

## 14. JavaScript vs extending the Go indexer

**Decision:** New JS implementation rather than operating memocash/index directly.

**Pros for PSF:**

- Same language and patterns as SLP indexer maintenance
- No CGO / Go toolchain requirement for PSF deployers
- Independent release cycle from memocash

**Cons:**

- Two implementations to keep in sync with protocol changes
- Go indexer has sharding, GraphQL, and mature handlers PSF omitted

**When to prefer Go:** Full memo.sv parity, production-scale sharded cluster, SLP-in-Memo token indexing.

**When to prefer PSF JS:** Unified ops with psf-slp-indexer-g2, custom downstream consumers of LevelDB REST.

## 15. Testing strategy

**Decision:** Unit tests with mocks for RPC, DB, and parser fixtures (Go `post_test.go` tx hex)—no mandatory e2e full node in CI.

**Tradeoff:** Integration bugs (RPC format changes, ZMQ topic names) need manual or staged e2e tests.

**Recommended e2e smoke:** Index block ≥ 525000 containing a known Memo post from [memo-protocol.md](../../memo-protocol.md) explorer links; verify `GET /level/post/:txid`.

## Decision log (quick reference)

| Topic | Choice |
|-------|--------|
| Architecture pattern | Clean Architecture |
| Chain interface | RPC + ZMQ |
| Storage | psf-memo-db REST + LevelDB |
| Processes | 2 indexers + 1 DB |
| Protocol breadth | Go `GetHandlers` subset |
| Ordering | Block order, no DAG |
| OP_RETURN location | Any output |
| Auth on DB API | None (v1) |
| Read API | Out of scope (v1) |

## Open questions for future contributors

1. **Handler parity:** Which excluded memo-protocol actions are required next (polls vs token sale)?
2. **Query layer:** Should PSF add `memo-query` REST on psf-memo-db or a separate service?
3. **Reorg handling:** v1 does not unwind reorgs; is depth-0 BCH acceptable for social indexing?
4. **Address indexing:** Should posts be secondary-indexed by `addr` for feed APIs?
5. **Alignment with Go:** Should reply/like tip logic match Go’s satoshi aggregation exactly (output script types beyond P2PKH)?

Document updates belong in this `dev-docs/` folder when decisions change.
