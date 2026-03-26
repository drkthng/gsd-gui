---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T01: Implement RPC types, JSONL framer, and binary resolver

**Slice:** S01 — Rust process manager & JSONL bridge
**Milestone:** M002

## Description

Create the foundation Rust modules that the process manager (T02) depends on. This includes:
- Serde-serializable RPC command and event types matching the GSD JSONL protocol
- A JSONL line framer that buffers partial reads from a byte stream and yields complete lines
- A binary resolver that finds the `gsd` executable through a 3-tier resolution chain

All three modules are pure utility code with no Tauri runtime dependency, making them straightforward to unit test.

## Steps

1. **Update `src-tauri/Cargo.toml`** — Add dependencies needed by S01:
   - `tokio = { version = "1", features = ["process", "io-util", "sync", "rt-multi-thread", "macros"] }` (for async process I/O in T02, but add now so both tasks share one Cargo.toml change)
   - `which = "7"` (for binary resolution on PATH)
   - Keep existing: `serde`, `serde_json`, `tauri`, `tauri-build`
   - Set `rust-version = "1.77"` (minimum for the dependency versions we need; the existing `1.60` is too old for Tauri 2)

2. **Create `src-tauri/src/gsd_rpc.rs`** — RPC types and JSONL framer:
   - `RpcCommand` enum with serde `#[serde(tag = "type", rename_all = "snake_case")]`:
     - `Prompt { text: String }`
     - `Steer { text: String }`
     - `Abort`
     - `GetState`
     - `SetModel { model: String }`
     - `GetAvailableModels`
     - `GetSessionStats`
     - `GetMessages`
     - `NewSession`
   - `RpcEvent` enum with serde `#[serde(tag = "type", rename_all = "snake_case")]`:
     - `AgentStart { session_id: String }`
     - `AgentEnd { session_id: String }`
     - `AssistantMessage { content: String, done: bool }`
     - `ToolExecutionStart { tool: String, id: String }`
     - `ToolExecutionEnd { tool: String, id: String, success: bool }`
     - `ExtensionUiRequest { request_id: String, kind: String, payload: serde_json::Value }`
     - `SessionStateChanged { payload: serde_json::Value }`
     - `Error { message: String }`
   - `JsonlFramer` struct:
     - Holds an internal `String` buffer
     - `fn push(&mut self, chunk: &[u8])` — appends UTF-8 (lossy) data to buffer
     - `fn next_line(&mut self) -> Option<String>` — extracts the next complete line (up to `\n`), trimming `\r\n`, skipping empty lines
     - Does NOT do JSON parsing — just line framing
   - `pub fn serialize_command(cmd: &RpcCommand) -> Result<String, serde_json::Error>` — serializes to JSON + appends `\n`
   - `pub fn parse_event(line: &str) -> Result<RpcEvent, serde_json::Error>` — deserializes a JSONL line
   - Unit tests (in `#[cfg(test)] mod tests`):
     - `test_serialize_prompt_command` — serializes Prompt, asserts valid JSON with `"type":"prompt"`
     - `test_serialize_abort_command` — serializes Abort, asserts `"type":"abort"`
     - `test_parse_agent_start_event` — parses `{"type":"agent_start","session_id":"abc"}`
     - `test_parse_assistant_message_event` — parses streaming message event
     - `test_parse_error_event` — parses error event
     - `test_framer_complete_line` — push a full line, get it back
     - `test_framer_partial_lines` — push partial data, get nothing, push rest, get line
     - `test_framer_multiple_lines` — push 3 lines at once, get them one by one
     - `test_framer_empty_lines_skipped` — push `\n\n`, get nothing
     - `test_framer_crlf_handling` — push `data\r\n`, get `data` without `\r`

3. **Create `src-tauri/src/gsd_resolve.rs`** — Binary resolution:
   - `pub fn resolve_gsd_binary() -> Result<std::path::PathBuf, String>`:
     1. Check `GSD_BIN_PATH` env var → if set and file exists, return it
     2. Use `which::which("gsd")` → if found, return it
     3. Check common npm global paths:
        - Windows: `%APPDATA%\npm\gsd.cmd`
        - Unix: `/usr/local/bin/gsd`, `~/.npm-global/bin/gsd`
     4. Return error with a helpful message listing what was checked
   - Unit tests:
     - `test_resolve_from_env_var` — set `GSD_BIN_PATH` env var to a temp file, assert it resolves
     - `test_resolve_env_var_missing_file` — set env var to nonexistent path, assert falls through (or errors)
     - `test_resolve_returns_error_when_not_found` — with no binary available, assert descriptive error message

4. **Wire modules into `src-tauri/src/lib.rs`** — Add `mod gsd_rpc;` and `mod gsd_resolve;` declarations. Don't change the Tauri builder yet — T02 does that.

5. **Verify** — Run `cd src-tauri && cargo test` and confirm all new tests pass, and `cargo build` compiles cleanly.

## Must-Haves

- [ ] RpcCommand enum covers at least: Prompt, Steer, Abort, GetState, SetModel, NewSession
- [ ] RpcEvent enum covers at least: AgentStart, AgentEnd, AssistantMessage, ToolExecutionStart, ToolExecutionEnd, Error
- [ ] Both enums use `#[serde(tag = "type")]` with snake_case renaming
- [ ] JsonlFramer correctly handles partial lines, multi-line pushes, empty lines, and CRLF
- [ ] serialize_command appends newline for JSONL protocol
- [ ] resolve_gsd_binary checks GSD_BIN_PATH env → which → common npm paths in order
- [ ] At least 10 unit tests across the two modules
- [ ] `cargo test` passes, `cargo build` compiles

## Verification

- `cd src-tauri && cargo test -- --nocapture 2>&1 | tail -20` — shows all tests passing
- `cd src-tauri && cargo build 2>&1 | tail -5` — compiles without errors

## Inputs

- `src-tauri/Cargo.toml` — existing dependency file to extend
- `src-tauri/src/lib.rs` — existing lib.rs to add module declarations

## Expected Output

- `src-tauri/Cargo.toml` — updated with tokio, which dependencies
- `src-tauri/src/gsd_rpc.rs` — RpcCommand, RpcEvent, JsonlFramer, serialize_command, parse_event, 10+ tests
- `src-tauri/src/gsd_resolve.rs` — resolve_gsd_binary with 3-tier resolution, 3+ tests
- `src-tauri/src/lib.rs` — updated with mod declarations for gsd_rpc and gsd_resolve
