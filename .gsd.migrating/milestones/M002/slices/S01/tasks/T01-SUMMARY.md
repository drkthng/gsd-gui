---
id: T01
parent: S01
milestone: M002
provides:
  - RpcCommand and RpcEvent serde types for GSD JSONL protocol
  - JsonlFramer for buffered line-oriented stdin/stdout parsing
  - resolve_gsd_binary() 3-tier binary resolution
  - tokio and which dependencies in Cargo.toml
key_files:
  - src-tauri/src/gsd_rpc.rs
  - src-tauri/src/gsd_resolve.rs
  - src-tauri/Cargo.toml
  - src-tauri/src/lib.rs
key_decisions:
  - Used VS2022 BuildTools toolchain instead of VS 18 (incomplete install missing headers)
  - Created placeholder icon files so tauri-build script passes
patterns_established:
  - serde tag="type" rename_all="snake_case" for RPC enums matching GSD JSONL protocol
  - JsonlFramer push/next_line pattern for async byte-stream line framing
  - 3-tier binary resolution: env var → which → platform-specific npm paths
observability_surfaces:
  - resolve_gsd_binary() returns descriptive error listing all paths checked on failure
duration: 25m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T01: Implement RPC types, JSONL framer, and binary resolver

**Added RpcCommand/RpcEvent serde types, JsonlFramer for JSONL line buffering, and 3-tier gsd binary resolver with 15 passing unit tests**

## What Happened

Created three foundation modules that T02's process manager depends on:

1. **`gsd_rpc.rs`** — RpcCommand enum (9 variants: Prompt, Steer, Abort, GetState, SetModel, GetAvailableModels, GetSessionStats, GetMessages, NewSession) and RpcEvent enum (8 variants: AgentStart, AgentEnd, AssistantMessage, ToolExecutionStart, ToolExecutionEnd, ExtensionUiRequest, SessionStateChanged, Error). Both use `#[serde(tag = "type", rename_all = "snake_case")]`. Also includes `JsonlFramer` struct that buffers partial reads and yields complete lines, plus `serialize_command()` and `parse_event()` helpers.

2. **`gsd_resolve.rs`** — `resolve_gsd_binary()` checks GSD_BIN_PATH env var → `which::which("gsd")` → platform-specific npm global paths (Windows: `%APPDATA%\npm\gsd.cmd`, Unix: `/usr/local/bin/gsd`, `~/.npm-global/bin/gsd`). Returns descriptive error on failure.

3. **`Cargo.toml`** — Added `tokio` (process, io-util, sync, rt-multi-thread, macros), `which = "7"`. Bumped `rust-version` to `"1.77"`.

4. **`lib.rs`** — Added `mod gsd_rpc;` and `mod gsd_resolve;` declarations.

Also created placeholder icon files (`src-tauri/icons/`) required by tauri-build's build script.

## Verification

- `cargo test` — 15 tests pass (12 in gsd_rpc, 3 in gsd_resolve)
- `cargo build` — compiles without errors (dead_code warnings expected since modules aren't consumed by lib.rs::run() yet)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd src-tauri && cargo test` | 0 | ✅ pass | 11.8s |
| 2 | `cd src-tauri && cargo build` | 0 | ✅ pass | 13.3s |

## Diagnostics

- `resolve_gsd_binary()` error messages list all three tiers checked with specific paths, useful for debugging missing binary issues
- Dead-code warnings in `cargo build` are expected until T02 wires these modules into the Tauri command handlers

## Deviations

- **MSVC toolchain**: The VS 18 install at `C:\Program Files\Microsoft Visual Studio\18\` has incomplete libraries (no `include/` dir). Used VS2022 BuildTools at `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\` instead. Requires setting INCLUDE, LIB, and PATH env vars for compilation.
- **Placeholder icons**: Created minimal PNG/ICO files in `src-tauri/icons/` because tauri-build's build script fails without them. These should be replaced with real icons later.
- **Test fix for `test_resolve_returns_error_when_not_found`**: Had to also override APPDATA in the test because `gsd.cmd` exists at `%APPDATA%\npm\gsd.cmd` on this machine, so the npm-global-path tier 3 found it even with empty PATH.

## Known Issues

- Dead-code warnings for all public items in gsd_rpc and gsd_resolve — resolved when T02 uses them.
- MSVC environment requires manual env var setup (INCLUDE/LIB/PATH) — not an issue for CI but affects local dev without a VS Developer Command Prompt.

## Files Created/Modified

- `src-tauri/Cargo.toml` — Added tokio, which dependencies; bumped rust-version to 1.77
- `src-tauri/src/gsd_rpc.rs` — RpcCommand, RpcEvent enums, JsonlFramer, serialize/parse helpers, 12 unit tests
- `src-tauri/src/gsd_resolve.rs` — resolve_gsd_binary() with 3-tier resolution, 3 unit tests
- `src-tauri/src/lib.rs` — Added mod declarations for gsd_rpc and gsd_resolve
- `src-tauri/icons/` — Placeholder icon files (32x32.png, 128x128.png, 128x128@2x.png, icon.ico, icon.icns)
