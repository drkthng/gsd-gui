---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T02: Implement GsdProcess manager and register Tauri commands

**Slice:** S01 — Rust process manager & JSONL bridge
**Milestone:** M002

## Description

Build the core async process manager that spawns `gsd --mode rpc` child processes and wires it into Tauri commands. GsdProcess manages stdin/stdout pipes, uses JsonlFramer from T01 for line framing, and emits Tauri events for each JSONL line, process exit, and errors. The Tauri commands (`start_gsd_session`, `stop_gsd_session`, `send_gsd_command`) are registered in lib.rs and use Tauri managed state to hold the active process.

## Steps

1. **Create `src-tauri/src/gsd_process.rs`** — The async process manager:
   - `GsdProcess` struct holding:
     - `child: Option<tokio::process::Child>` (or wrapped in Arc<Mutex> for shared access)
     - `stdin_writer: Option<tokio::process::ChildStdin>`
     - A shutdown flag or channel
   - `pub async fn spawn(binary_path: &Path, project_path: &str, app_handle: tauri::AppHandle) -> Result<Self, String>`:
     - Uses `tokio::process::Command` to spawn `binary_path --mode rpc --project project_path`
     - Sets `stdin(Stdio::piped())`, `stdout(Stdio::piped())`, `stderr(Stdio::piped())`
     - Spawns a tokio task to read stdout line-by-line using `JsonlFramer`, emitting `gsd-event` Tauri events for each complete JSONL line
     - Spawns a task to monitor process exit, emitting `gsd-process-exit` with the exit code
     - On spawn failure, emits `gsd-process-error`
   - `pub async fn send_command(&mut self, cmd: &RpcCommand) -> Result<(), String>`:
     - Uses `serialize_command()` from gsd_rpc.rs
     - Writes the serialized JSON + newline to stdin
   - `pub async fn stop(&mut self) -> Result<(), String>`:
     - Sends kill signal to child process (on Windows: `child.kill()`, on Unix: SIGTERM then wait then SIGKILL)
     - Waits for the child to exit with a timeout
     - Cleans up stdin/stdout handles
   - `pub fn is_running(&self) -> bool` — checks if child process is still alive

2. **Create Tauri state and commands in `src-tauri/src/lib.rs`**:
   - Define a `GsdState` struct wrapping `Arc<Mutex<Option<GsdProcess>>>` (or `tokio::sync::Mutex`)
   - Register it as Tauri managed state
   - `#[tauri::command] async fn start_gsd_session(project_path: String, state: State<GsdState>, app: AppHandle) -> Result<(), String>`:
     - Calls `resolve_gsd_binary()` from gsd_resolve.rs
     - Stops any existing process
     - Calls `GsdProcess::spawn()` with resolved binary, project path, and app handle
     - Stores in managed state
   - `#[tauri::command] async fn stop_gsd_session(state: State<GsdState>) -> Result<(), String>`:
     - Takes the process from state, calls `stop()`
   - `#[tauri::command] async fn send_gsd_command(command: String, state: State<GsdState>) -> Result<(), String>`:
     - Deserializes the command string into RpcCommand
     - Calls `send_command()` on the active process
     - Returns error if no process is running
   - Register all three commands with `.invoke_handler(tauri::generate_handler![start_gsd_session, stop_gsd_session, send_gsd_command])`

3. **Write unit tests in `gsd_process.rs`** (in `#[cfg(test)] mod tests`):
   - Tests should use a mock child process approach — spawn a simple echo program or use piped streams directly
   - `test_spawn_and_is_running` — spawn a long-running process (e.g., `cat` on Unix, `findstr` on Windows, or a cross-platform approach using a Rust helper), verify is_running() returns true
   - `test_send_command_writes_to_stdin` — spawn a process, send a command, verify it doesn't error
   - `test_stop_kills_process` — spawn, stop, verify is_running() returns false
   - `test_send_to_stopped_process_errors` — stop a process, try send_command, expect error
   - Note: Full integration tests with Tauri AppHandle are difficult in unit tests — the Tauri command layer is verified by `cargo build` compiling. Focus unit tests on GsdProcess logic.

4. **Verify compilation and tests**:
   - `cd src-tauri && cargo test` — all tests pass (T01 tests + T02 tests)
   - `cd src-tauri && cargo build` — compiles with Tauri commands registered

5. **Cross-platform considerations** (document in code comments):
   - Windows: no SIGTERM, use `child.kill()` directly
   - Unix: try SIGTERM first, wait 5s, then SIGKILL
   - Process spawning uses `tokio::process::Command` which handles platform differences
   - stdin/stdout pipes work the same on both platforms via tokio

## Must-Haves

- [ ] GsdProcess::spawn() creates child with piped stdin/stdout
- [ ] GsdProcess::send_command() serializes RpcCommand and writes to stdin
- [ ] GsdProcess::stop() kills the child process and cleans up
- [ ] GsdProcess::is_running() reflects actual process state
- [ ] stdout reader task emits `gsd-event` Tauri events for each JSONL line
- [ ] Process exit emits `gsd-process-exit` event with exit code
- [ ] Spawn/IO errors emit `gsd-process-error` event
- [ ] Tauri commands start_gsd_session, stop_gsd_session, send_gsd_command are registered
- [ ] Managed state holds the active GsdProcess
- [ ] `cargo test` passes all T01 + T02 tests
- [ ] `cargo build` compiles successfully

## Verification

- `cd src-tauri && cargo test -- --nocapture 2>&1 | tail -30` — all tests pass
- `cd src-tauri && cargo build 2>&1 | tail -5` — compiles without errors
- `grep -c "tauri::command" src-tauri/src/lib.rs` returns 3 (three commands registered)

## Observability Impact

- Signals added: `gsd-event` (every JSONL line from child stdout), `gsd-process-exit` (exit code on process termination), `gsd-process-error` (spawn/IO error strings)
- How a future agent inspects this: call `is_running()` on GsdProcess, listen for Tauri events
- Failure state exposed: spawn errors include resolved binary path + OS error message, exit events include exit code

## Inputs

- `src-tauri/src/gsd_rpc.rs` — RpcCommand, RpcEvent types, JsonlFramer, serialize_command, parse_event (from T01)
- `src-tauri/src/gsd_resolve.rs` — resolve_gsd_binary() (from T01)
- `src-tauri/src/lib.rs` — existing lib.rs with mod declarations from T01
- `src-tauri/Cargo.toml` — dependencies already added in T01

## Expected Output

- `src-tauri/src/gsd_process.rs` — GsdProcess struct with spawn/send/stop/is_running, 4+ unit tests
- `src-tauri/src/lib.rs` — updated with Tauri commands, managed state, mod gsd_process declaration
