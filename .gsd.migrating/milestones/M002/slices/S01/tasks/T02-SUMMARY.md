---
id: T02
parent: S01
milestone: M002
provides:
  - GsdProcess async manager with spawn/send_command/stop/is_running
  - Tauri commands start_gsd_session, stop_gsd_session, send_gsd_command
  - GsdState managed state holding active process
  - gsd-event, gsd-process-exit, gsd-process-error Tauri event payloads
key_files:
  - src-tauri/src/gsd_process.rs
  - src-tauri/src/lib.rs
  - src-tauri/Cargo.toml
key_decisions:
  - Used mpsc channel for stdin writes to avoid Arc<Mutex> around ChildStdin — cleaner async pattern
  - Tauri v2 requires `tauri::Emitter` trait import for `.emit()` on AppHandle (not `tauri::Manager`)
  - Added tokio `time` feature for process stop timeout
patterns_established:
  - mpsc channel pattern for async stdin writes to child process
  - from_child() test helper to unit-test GsdProcess without Tauri AppHandle
  - Background polling task for process exit detection with Tauri event emission
observability_surfaces:
  - gsd-event Tauri event emitted for each JSONL line from child stdout
  - gsd-process-exit Tauri event with exit code and timestamp on process termination
  - gsd-process-error Tauri event with descriptive message on spawn/IO failure
  - is_running() method for synchronous process state checks
duration: 15m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Implement GsdProcess manager and register Tauri commands

**Added async GsdProcess manager with spawn/send/stop lifecycle, wired three Tauri commands with managed state, and 6 passing unit tests**

## What Happened

Built the core process manager and Tauri command layer:

1. **`gsd_process.rs`** — `GsdProcess` struct manages a `gsd --mode rpc` child process. `spawn()` creates the child with piped stdin/stdout/stderr, spawns background tokio tasks to read stdout via `JsonlFramer` (emitting `gsd-event` per JSONL line), and drains stderr to prevent pipe buffer deadlocks. `send_command()` serializes `RpcCommand` to JSONL and writes via an mpsc channel to stdin. `stop()` kills the child (platform-aware: SIGTERM→SIGKILL on Unix, kill() on Windows) with timeouts. `is_running()` uses `try_wait()` for non-blocking state checks. Includes `from_child()` test helper for unit testing without Tauri AppHandle. 6 unit tests cover spawn, send, stop, double-stop, send-to-stopped, and natural exit detection.

2. **`lib.rs`** — Added `GsdState` wrapping `Arc<Mutex<Option<GsdProcess>>>` as Tauri managed state. Three `#[tauri::command]` handlers: `start_gsd_session` (resolves binary, stops existing, spawns new, starts exit monitor task), `stop_gsd_session` (takes and stops process), `send_gsd_command` (deserializes JSON string to RpcCommand, sends to active process). All registered via `generate_handler!`.

3. **`Cargo.toml`** — Added `time` feature to tokio for process stop timeouts.

## Verification

- `cargo test` — 21 tests pass (15 from T01 + 6 new from T02)
- `cargo build` — compiles with only expected dead-code warnings (RpcEvent, parse_event unused until frontend layer)
- `grep -c "tauri::command"` returns 3 confirming all three commands registered

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd src-tauri && cargo test -- --nocapture` | 0 | ✅ pass | 11.2s |
| 2 | `cd src-tauri && cargo build` | 0 | ✅ pass | 44.2s |
| 3 | `grep -c "tauri::command" src-tauri/src/lib.rs` | 0 (output: 3) | ✅ pass | <1s |

## Slice Verification Status

All slice-level checks pass — this is the final task of S01:

- ✅ `cargo test` — 21 tests pass covering JSONL framing, RPC serialization, binary resolution, and process lifecycle
- ✅ `cargo build` — compiles without errors
- ✅ Tests in `gsd_rpc.rs` cover JSONL line parsing, partial line buffering, RpcCommand serialization, RpcEvent deserialization
- ✅ Tests in `gsd_resolve.rs` cover env var resolution, PATH fallback
- ✅ Tests in `gsd_process.rs` cover spawn, send command, stop process, send-to-stopped error, natural exit detection

## Diagnostics

- **Tauri events** — `gsd-event` emitted per JSONL stdout line, `gsd-process-exit` with exit code on termination, `gsd-process-error` on spawn/IO failure. Inspect via Tauri devtools event monitor.
- **Process state** — `is_running()` queries child process `try_wait()` for non-blocking liveness check. Available via `GsdState` managed state.
- **Exit monitor** — Background tokio task polls every 500ms, emits `gsd-process-exit` with code and timestamp when child terminates.
- **Binary resolution** — `resolve_gsd_binary()` error messages list all three tiers checked (env var, PATH, npm paths) with specific paths attempted.
- **Build verification** — `cd src-tauri && cargo test` runs all 21 tests; `cargo build` compiles with only expected dead-code warnings for unused `RpcEvent`/`parse_event`.

## Known Issues

- Dead-code warnings for `RpcEvent` and `parse_event` — expected until the frontend event handler layer consumes them.
- Process exit monitor in `start_gsd_session` uses polling (500ms interval) rather than `child.wait()` because the Child is behind a Mutex. Acceptable for this use case.

## Files Created/Modified

- `src-tauri/src/gsd_process.rs` — GsdProcess struct, spawn/send/stop/is_running, event payloads, 6 unit tests (NEW)
- `src-tauri/src/lib.rs` — GsdState, 3 Tauri commands, managed state registration (MODIFIED)
- `src-tauri/Cargo.toml` — Added tokio `time` feature (MODIFIED)
