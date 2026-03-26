# S01: Rust process manager & JSONL bridge

**Goal:** Rust backend can spawn/stop a `gsd --mode rpc` child process, communicate via JSONL stdin/stdout, resolve the GSD binary, and expose Tauri commands for the frontend.
**Demo:** `cargo test` passes for JSONL line framing, RPC command/event serialization, GSD binary resolution, and process lifecycle (spawn → send → receive → stop). Tauri commands `start_gsd_session`, `stop_gsd_session`, `send_gsd_command` are registered and compilable.

## Must-Haves

- `gsd_rpc.rs` with `RpcCommand` and `RpcEvent` serde types matching the GSD JSONL protocol
- `gsd_rpc.rs` with `JsonlFramer` that handles line-buffered reading (partial lines, empty lines, UTF-8)
- `gsd_resolve.rs` with `resolve_gsd_binary()` checking GSD_BIN_PATH → PATH → common npm paths
- `gsd_process.rs` with `GsdProcess` struct: `spawn()`, `send_command()`, `stop()`, `is_running()`
- `lib.rs` registers Tauri commands: `start_gsd_session`, `stop_gsd_session`, `send_gsd_command`
- Tauri events emitted: `gsd-event`, `gsd-process-exit`, `gsd-process-error`
- Graceful shutdown: SIGTERM (or taskkill on Windows) → wait → force kill
- All Rust unit tests pass via `cargo test`

## Proof Level

- This slice proves: contract (Rust unit tests with mock processes, no real GSD binary needed)
- Real runtime required: no (tests use mock child processes)
- Human/UAT required: no

## Verification

- `cd src-tauri && cargo test` — all tests pass
- `cd src-tauri && cargo build` — compiles without errors (proves Tauri command registration is valid)
- Tests in `src-tauri/src/gsd_rpc.rs` cover: JSONL line parsing, partial line buffering, RpcCommand serialization, RpcEvent deserialization
- Tests in `src-tauri/src/gsd_resolve.rs` cover: env var resolution, PATH fallback
- Tests in `src-tauri/src/gsd_process.rs` cover: spawn mock process, send command, receive events, stop process, crash detection

## Observability / Diagnostics

- Runtime signals: `gsd-process-exit` event with exit code, `gsd-process-error` with error message string
- Inspection surfaces: `is_running()` method on GsdProcess, Tauri event payloads include timestamps
- Failure visibility: process spawn errors include the resolved binary path and OS error, crash detection reports exit code

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced: Tauri command registration in `lib.rs`, Tauri managed state for GsdProcess
- What remains before milestone is truly usable end-to-end: S02 (headless query, file watcher), S03 (React IPC wiring), S04 (stores), S05 (hooks), S06 (integration proof)

## Tasks

- [x] **T01: Implement RPC types, JSONL framer, and binary resolver** `est:2h`
  - Why: Foundation modules that T02's process manager depends on — serde types for the JSONL protocol, line framing logic, and binary resolution utility
  - Files: `src-tauri/Cargo.toml`, `src-tauri/src/gsd_rpc.rs`, `src-tauri/src/gsd_resolve.rs`
  - Do: Add serde/tokio/which deps to Cargo.toml. Implement RpcCommand enum and RpcEvent enum with serde Serialize/Deserialize. Implement JsonlFramer that buffers partial reads and yields complete JSONL lines. Implement resolve_gsd_binary() with 3-tier resolution. Write unit tests for all three.
  - Verify: `cd src-tauri && cargo test` — all gsd_rpc and gsd_resolve tests pass
  - Done when: RpcCommand serializes to valid JSONL, RpcEvent deserializes from JSONL lines, JsonlFramer handles partial/empty/multi lines, resolve_gsd_binary returns a PathBuf or error

- [x] **T02: Implement GsdProcess manager and register Tauri commands** `est:2h`
  - Why: The core process manager that spawns/manages gsd child processes, plus Tauri command wiring that S03 will invoke from React
  - Files: `src-tauri/src/gsd_process.rs`, `src-tauri/src/lib.rs`
  - Do: Implement GsdProcess with async spawn (tokio::process::Command), stdin writer, stdout reader using JsonlFramer, stop with graceful shutdown. Register start_gsd_session/stop_gsd_session/send_gsd_command as Tauri commands with managed state. Emit gsd-event/gsd-process-exit/gsd-process-error events. Write unit tests using a mock child process (echo-style binary or piped streams).
  - Verify: `cd src-tauri && cargo test && cargo build` — all tests pass and project compiles
  - Done when: GsdProcess can spawn a mock process, send JSONL commands, receive JSONL events, detect exit, and stop gracefully. Tauri commands compile and are registered.

## Files Likely Touched

- `src-tauri/Cargo.toml`
- `src-tauri/src/gsd_rpc.rs`
- `src-tauri/src/gsd_resolve.rs`
- `src-tauri/src/gsd_process.rs`
- `src-tauri/src/lib.rs`
