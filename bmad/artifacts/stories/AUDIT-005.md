# AUDIT-005

- source: audit
- created: 20260306T194957

## Description

Added immutability guards to AssetManager initialization and related stores to prevent accidental mutations of shared example model data.

Changes made:

- Use `structuredClone(exampleModel.assets)` when creating runtime asset stores (seen in SequenceOrchestrator and routes/app) to avoid sharing references to the example model.
- AssetManager consumes the store from context (ASSET_STORE_KEY) and no longer initializes shared mutable data directly.

## Status

- ✅ Implemented and validated (store initializations use structuredClone)
- Completed: 2026-03-07
