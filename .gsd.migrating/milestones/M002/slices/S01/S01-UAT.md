# S01 UAT: Rust process manager & JSONL bridge

**Preconditions:**
- Working directory: `src-tauri/`
- MSVC toolchain env vars set (see K017) — or run from a VS Developer Command Prompt
- Rust toolchain installed with `cargo` on PATH

---

## TC-01: All unit tests pass

**Steps:**
1. `cd src-tauri && cargo test`

**Expected:**
- Exit code 0
- Output shows `test result: ok. 21 passed; 0 failed`
- No test failures or panics

---

## TC-02: Project compiles without errors

**Steps:**
1. `cd src-tauri && cargo build`

**Expected:**
- Exit code 0
- Only warnings (dead-code for `RpcEvent`, `parse_event`, `wait_for_exit`) — no errors
- Binary produced in `target/debug/`

---

## TC-03: RpcCommand serialization matches JSONL protocol

**Steps:**
1. Run `cargo test test_serialize_prompt_command -- --nocapture`
2. Run `cargo test test_serialize_abort_command -- --nocapture`
3. Run `cargo test test_serialize_set_model_command -- --nocapture`

**Expected:**
- Prompt command serializes with `"type": "prompt"` and `"text"` field
- Abort command serializes with `"type": "abort"`
- SetModel command serializes with `"type": "set_model"` and `"model"` field
- All use snake_case naming (not camelCase)

---

## TC-04: RpcEvent deserialization handles all event types

**Steps:**
1. Run `cargo test test_parse_agent_start_event -- --nocapture`
2. Run `cargo test test_parse_assistant_message_event -- --nocapture`
3. Run `cargo test test_parse_error_event -- --nocapture`
4. Run `cargo test test_parse_tool_execution_end_event -- --nocapture`

**Expected:**
- Each JSON string with `"type": "agent_start"`, `"assistant_message"`, `"error"`, `"tool_execution_end"` deserializes to the correct RpcEvent variant
- Unknown fields are ignored (forward-compatible)

---

## TC-05: JsonlFramer handles partial and multi-line input

**Steps:**
1. Run `cargo test test_framer_partial_lines -- --nocapture`
2. Run `cargo test test_framer_multiple_lines -- --nocapture`
3. Run `cargo test test_framer_empty_lines_skipped -- --nocapture`
4. Run `cargo test test_framer_crlf_handling -- --nocapture`

**Expected:**
- Partial line pushed → `next_line()` returns None
- Remainder of line pushed → `next_line()` returns complete line
- Two lines in one push → `next_line()` returns each sequentially
- Empty lines between content lines are skipped
- `\r\n` line endings handled same as `\n`

---

## TC-06: Binary resolver checks 3 tiers

**Steps:**
1. Run `cargo test test_resolve_from_env_var -- --nocapture`
2. Run `cargo test test_resolve_env_var_missing_file -- --nocapture`
3. Run `cargo test test_resolve_returns_error_when_not_found -- --nocapture`

**Expected:**
- When `GSD_BIN_PATH` points to existing file → returns that path
- When `GSD_BIN_PATH` points to nonexistent file → falls through to next tier
- When all tiers fail → returns error listing all checked paths

---

## TC-07: GsdProcess lifecycle — spawn, send, stop

**Steps:**
1. Run `cargo test test_spawn_and_is_running -- --nocapture`
2. Run `cargo test test_send_command_writes_to_stdin -- --nocapture`
3. Run `cargo test test_stop_kills_process -- --nocapture`

**Expected:**
- After spawn → `is_running()` returns true
- `send_command()` writes serialized JSONL to child stdin (no error)
- After `stop()` → `is_running()` returns false

---

## TC-08: GsdProcess edge cases

**Steps:**
1. Run `cargo test test_stop_already_stopped_is_ok -- --nocapture`
2. Run `cargo test test_send_to_stopped_process_errors -- --nocapture`
3. Run `cargo test test_is_running_false_after_process_exits -- --nocapture`

**Expected:**
- Calling `stop()` on already-stopped process → Ok (idempotent, no panic)
- Calling `send_command()` on stopped process → returns error
- After child process exits naturally → `is_running()` returns false

---

## TC-09: Tauri commands are registered

**Steps:**
1. `grep -c "tauri::command" src-tauri/src/lib.rs`
2. `grep "generate_handler" src-tauri/src/lib.rs`

**Expected:**
- Count is 3 (start_gsd_session, stop_gsd_session, send_gsd_command)
- `generate_handler!` includes all three command names

---

## TC-10: Tauri event types are defined

**Steps:**
1. `grep -r "gsd-event\|gsd-process-exit\|gsd-process-error" src-tauri/src/`

**Expected:**
- All three event names appear in `gsd_process.rs` or `lib.rs`
- Event payloads include timestamp or exit code as appropriate

---

## Edge Cases

- **Windows line endings**: TC-05 CRLF test ensures `\r\n` from Windows child processes doesn't corrupt JSON parsing
- **Double stop**: TC-08 ensures stop is idempotent — important for shutdown sequences where multiple paths may call stop
- **Zombie prevention**: stderr is drained in a background task to prevent pipe buffer deadlocks that would hang the child process
