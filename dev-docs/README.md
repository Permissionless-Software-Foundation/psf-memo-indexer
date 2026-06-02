# Memo Indexer Developer Documentation

This directory documents the architecture, operation, and design rationale for the Permissionless Software Foundation Memo indexing stack:

| Repository | Role |
|------------|------|
| [psf-memo-db](../../psf-memo-db) | LevelDB persistence exposed as a REST API |
| [psf-memo-indexer](../) | Block and mempool indexer (this repo) |

Protocol reference: [memo-protocol.md](../../memo-protocol.md). Reference implementation: [memo/index](../../index) (Go).

## Reading order

1. **[Overview](./overview.md)** — Why these services exist and what they produce
2. **[Architecture](./architecture.md)** — Components, processes, Clean Architecture layout, data flow
3. **[Theory of operation](./theory-of-operation.md)** — IBD, ZMQ, parsing, indexing pipeline step-by-step
4. **[psf-memo-db](./psf-memo-db.md)** — Database service design and REST contract
5. **[Design decisions and tradeoffs](./design-decisions-and-tradeoffs.md)** — Comparisons to SLP and the Go indexer, scope limits, future work

## Related material

- Production deployment: [production/docker](../production/docker/)
- SLP analogue: [psf-slp-indexer-g2](https://github.com/Permissionless-Software-Foundation/psf-slp-indexer-g2) and [psf-slp-db](https://github.com/Permissionless-Software-Foundation/psf-slp-db)
- Clean Architecture primer: [Chris Troutner — Clean Architecture](https://christroutner.github.io/trouts-blog/blog/clean-architecture)
