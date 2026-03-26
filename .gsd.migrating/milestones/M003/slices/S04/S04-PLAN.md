# S04: Chat View & Message Input

**Goal:** Replace placeholder ChatPage with functional chat interface — message list with markdown rendering, streaming indicator, auto-scroll, message input with send/newline behavior.

**Proof Level:** unit + integration — components render from gsd-store, input triggers actions

## Success Criteria

- ChatMessage renders user and assistant messages with correct styling
- Assistant messages render markdown (bold, lists, code blocks)
- Streaming indicator shows when isStreaming
- Auto-scroll to bottom on new messages
- MessageInput: Enter sends, Shift+Enter inserts newline, disabled while streaming
- ChatView composes message list + input and reads from gsd-store

## Tasks

- [ ] **T01: ChatMessage + ChatView components** `est:40min`
- [ ] **T02: MessageInput component + ChatPage rewrite** `est:30min`
