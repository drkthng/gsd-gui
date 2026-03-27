use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// RPC Command types (frontend → GSD process via stdin)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RpcCommand {
    Prompt { message: String },
    Steer { message: String },
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
    // -- Lifecycle --
    AgentStart {},
    AgentEnd {},
    TurnStart {},
    TurnEnd {},

    // -- Response envelope (reply to any RpcCommand) --
    Response {
        command: String,
        success: bool,
        data: Option<serde_json::Value>,
        error: Option<String>,
    },

    // -- Extension lifecycle --
    ExtensionsReady {},

    // -- Extension UI requests (variable fields by method) --
    ExtensionUiRequest {
        id: String,
        method: String,
        message: Option<String>,
        #[serde(rename = "notifyType")]
        notify_type: Option<String>,
        #[serde(rename = "statusKey")]
        status_key: Option<String>,
        payload: Option<serde_json::Value>,
    },

    // -- Error --
    Error { message: String },

    // -- Catch-all: message_update, message_start, message_end, etc. --
    #[serde(other)]
    Unknown,
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
            message: "hello".into(),
        };
        let json = serialize_command(&cmd).unwrap();
        assert!(json.ends_with('\n'));
        let v: serde_json::Value = serde_json::from_str(json.trim()).unwrap();
        assert_eq!(v["type"], "prompt");
        assert_eq!(v["message"], "hello");
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
        // Real GSD protocol: agent_start has no session_id field
        let line = r#"{"type":"agent_start"}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::AgentStart {});
    }

    #[test]
    fn test_parse_agent_start_with_extra_fields() {
        // GSD may add extra fields — they're ignored, not an error
        let line = r#"{"type":"agent_start","session_id":"abc","extra":"ignored"}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::AgentStart {});
    }

    #[test]
    fn test_parse_message_update_is_unknown() {
        // message_update (streaming delta) is handled in JS; Rust maps to Unknown
        let line = r#"{"type":"message_update","assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hi"},"message":{}}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::Unknown);
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
        // tool_execution_end is not in our enum — should parse as Unknown (not error)
        let line =
            r#"{"type":"tool_execution_end","tool":"bash","id":"t1","success":true}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::Unknown);
    }

    // -- Response envelope parsing --

    #[test]
    fn test_parse_response_success() {
        let line = r#"{"type":"response","command":"get_state","success":true,"data":{"model":{"id":"claude-opus-4-6"}}}"#;
        let evt = parse_event(line).unwrap();
        match evt {
            RpcEvent::Response {
                command,
                success,
                data,
                error,
            } => {
                assert_eq!(command, "get_state");
                assert!(success);
                assert!(data.is_some());
                assert!(error.is_none());
                let data = data.unwrap();
                assert_eq!(data["model"]["id"], "claude-opus-4-6");
            }
            other => panic!("expected Response, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_response_error() {
        let line = r#"{"type":"response","command":"prompt","success":false,"error":"Cannot read properties of undefined"}"#;
        let evt = parse_event(line).unwrap();
        match evt {
            RpcEvent::Response {
                command,
                success,
                data,
                error,
            } => {
                assert_eq!(command, "prompt");
                assert!(!success);
                assert!(data.is_none());
                assert_eq!(error.as_deref(), Some("Cannot read properties of undefined"));
            }
            other => panic!("expected Response, got {:?}", other),
        }
    }

    // -- Extensions ready --

    #[test]
    fn test_parse_extensions_ready() {
        let line = r#"{"type":"extensions_ready"}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::ExtensionsReady {});
    }

    // -- Extension UI request (notify method) --

    #[test]
    fn test_parse_extension_ui_request_notify() {
        let line = r#"{"type":"extension_ui_request","id":"550e8400-e29b-41d4-a716-446655440000","method":"notify","message":"Build complete","notifyType":"warning"}"#;
        let evt = parse_event(line).unwrap();
        match evt {
            RpcEvent::ExtensionUiRequest {
                id,
                method,
                message,
                notify_type,
                status_key,
                payload,
            } => {
                assert_eq!(id, "550e8400-e29b-41d4-a716-446655440000");
                assert_eq!(method, "notify");
                assert_eq!(message.as_deref(), Some("Build complete"));
                assert_eq!(notify_type.as_deref(), Some("warning"));
                assert!(status_key.is_none());
                assert!(payload.is_none());
            }
            other => panic!("expected ExtensionUiRequest, got {:?}", other),
        }
    }

    // -- Extension UI request (setStatus method) --

    #[test]
    fn test_parse_extension_ui_request_set_status() {
        let line = r#"{"type":"extension_ui_request","id":"a1b2c3","method":"setStatus","statusKey":"gsd-fast"}"#;
        let evt = parse_event(line).unwrap();
        match evt {
            RpcEvent::ExtensionUiRequest {
                id,
                method,
                message,
                notify_type,
                status_key,
                payload,
            } => {
                assert_eq!(id, "a1b2c3");
                assert_eq!(method, "setStatus");
                assert!(message.is_none());
                assert!(notify_type.is_none());
                assert_eq!(status_key.as_deref(), Some("gsd-fast"));
                assert!(payload.is_none());
            }
            other => panic!("expected ExtensionUiRequest, got {:?}", other),
        }
    }

    // -- Unknown event type catch-all --

    #[test]
    fn test_parse_unknown_event_type() {
        let line = r#"{"type":"some_future_event","data":123}"#;
        let evt = parse_event(line).unwrap();
        assert_eq!(evt, RpcEvent::Unknown);
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
