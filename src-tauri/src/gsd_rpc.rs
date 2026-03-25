use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// RPC Command types (frontend → GSD process via stdin)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RpcCommand {
    Prompt { text: String },
    Steer { text: String },
    Abort,
    GetState,
    SetModel { model: String },
    GetAvailableModels,
    GetSessionStats,
    GetMessages,
    NewSession,
}

// ---------------------------------------------------------------------------
// RPC Event types (GSD process → frontend via stdout)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RpcEvent {
    AgentStart { session_id: String },
    AgentEnd { session_id: String },
    AssistantMessage { content: String, done: bool },
    ToolExecutionStart { tool: String, id: String },
    ToolExecutionEnd { tool: String, id: String, success: bool },
    ExtensionUiRequest {
        request_id: String,
        kind: String,
        payload: serde_json::Value,
    },
    SessionStateChanged { payload: serde_json::Value },
    Error { message: String },
}

// ---------------------------------------------------------------------------
// JSONL line framer — buffers partial reads, yields complete lines
// ---------------------------------------------------------------------------

pub struct JsonlFramer {
    buffer: String,
}

impl JsonlFramer {
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
        }
    }

    /// Append a raw byte chunk (lossy UTF-8 conversion) to the internal buffer.
    pub fn push(&mut self, chunk: &[u8]) {
        self.buffer.push_str(&String::from_utf8_lossy(chunk));
    }

    /// Extract the next complete line from the buffer, skipping empty lines.
    /// Returns `None` when no complete line is available yet.
    pub fn next_line(&mut self) -> Option<String> {
        loop {
            let newline_pos = self.buffer.find('\n')?;
            let mut line: String = self.buffer.drain(..=newline_pos).collect();
            // Remove trailing \n
            line.pop();
            // Remove trailing \r if present (CRLF)
            if line.ends_with('\r') {
                line.pop();
            }
            // Skip empty lines
            if line.is_empty() {
                continue;
            }
            return Some(line);
        }
    }
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

/// Serialize an RpcCommand to a JSONL string (JSON + trailing newline).
pub fn serialize_command(cmd: &RpcCommand) -> Result<String, serde_json::Error> {
    let mut json = serde_json::to_string(cmd)?;
    json.push('\n');
    Ok(json)
}

/// Parse a single JSONL line into an RpcEvent.
pub fn parse_event(line: &str) -> Result<RpcEvent, serde_json::Error> {
    serde_json::from_str(line)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // -- Command serialization --

    #[test]
    fn test_serialize_prompt_command() {
        let cmd = RpcCommand::Prompt {
            text: "hello".into(),
        };
        let json = serialize_command(&cmd).unwrap();
        assert!(json.ends_with('\n'));
        let v: serde_json::Value = serde_json::from_str(json.trim()).unwrap();
        assert_eq!(v["type"], "prompt");
        assert_eq!(v["text"], "hello");
    }

    #[test]
    fn test_serialize_abort_command() {
        let cmd = RpcCommand::Abort;
        let json = serialize_command(&cmd).unwrap();
        assert!(json.ends_with('\n'));
        let v: serde_json::Value = serde_json::from_str(json.trim()).unwrap();
        assert_eq!(v["type"], "abort");
    }

    #[test]
    fn test_serialize_set_model_command() {
        let cmd = RpcCommand::SetModel {
            model: "claude-3".into(),
        };
        let json = serialize_command(&cmd).unwrap();
        let v: serde_json::Value = serde_json::from_str(json.trim()).unwrap();
        assert_eq!(v["type"], "set_model");
        assert_eq!(v["model"], "claude-3");
    }

    // -- Event parsing --

    #[test]
    fn test_parse_agent_start_event() {
        let line = r#"{"type":"agent_start","session_id":"abc"}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(
            evt,
            RpcEvent::AgentStart {
                session_id: "abc".into()
            }
        );
    }

    #[test]
    fn test_parse_assistant_message_event() {
        let line = r#"{"type":"assistant_message","content":"hi","done":false}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(
            evt,
            RpcEvent::AssistantMessage {
                content: "hi".into(),
                done: false,
            }
        );
    }

    #[test]
    fn test_parse_error_event() {
        let line = r#"{"type":"error","message":"something broke"}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(
            evt,
            RpcEvent::Error {
                message: "something broke".into()
            }
        );
    }

    #[test]
    fn test_parse_tool_execution_end_event() {
        let line =
            r#"{"type":"tool_execution_end","tool":"bash","id":"t1","success":true}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(
            evt,
            RpcEvent::ToolExecutionEnd {
                tool: "bash".into(),
                id: "t1".into(),
                success: true,
            }
        );
    }

    // -- JSONL framer --

    #[test]
    fn test_framer_complete_line() {
        let mut f = JsonlFramer::new();
        f.push(b"{\"type\":\"abort\"}\n");
        assert_eq!(f.next_line(), Some(r#"{"type":"abort"}"#.into()));
        assert_eq!(f.next_line(), None);
    }

    #[test]
    fn test_framer_partial_lines() {
        let mut f = JsonlFramer::new();
        f.push(b"{\"type\":");
        assert_eq!(f.next_line(), None);
        f.push(b"\"abort\"}\n");
        assert_eq!(f.next_line(), Some(r#"{"type":"abort"}"#.into()));
    }

    #[test]
    fn test_framer_multiple_lines() {
        let mut f = JsonlFramer::new();
        f.push(b"line1\nline2\nline3\n");
        assert_eq!(f.next_line(), Some("line1".into()));
        assert_eq!(f.next_line(), Some("line2".into()));
        assert_eq!(f.next_line(), Some("line3".into()));
        assert_eq!(f.next_line(), None);
    }

    #[test]
    fn test_framer_empty_lines_skipped() {
        let mut f = JsonlFramer::new();
        f.push(b"\n\n");
        assert_eq!(f.next_line(), None);
    }

    #[test]
    fn test_framer_crlf_handling() {
        let mut f = JsonlFramer::new();
        f.push(b"data\r\n");
        assert_eq!(f.next_line(), Some("data".into()));
    }
}
