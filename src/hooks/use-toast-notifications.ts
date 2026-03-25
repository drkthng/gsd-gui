import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * Subscribes to GSD store state changes and fires sonner toasts for:
 * - Errors (sessionState === "error" with error message)
 * - Session disconnected unexpectedly
 * - Task completion (agent_end after streaming)
 *
 * Must be called once inside the AppShell (after Toaster is mounted in App).
 */
export function useToastNotifications() {
  const error = useGsdStore((s) => s.error);
  const sessionState = useGsdStore((s) => s.sessionState);
  const isStreaming = useGsdStore((s) => s.isStreaming);

  const prevErrorRef = useRef<string | null>(null);
  const prevSessionStateRef = useRef(sessionState);
  const prevIsStreamingRef = useRef(isStreaming);

  useEffect(() => {
    // Error toast — only fire when error changes to a new non-null value
    if (error && error !== prevErrorRef.current) {
      toast.error("Error", { description: error });
    }
    prevErrorRef.current = error;
  }, [error]);

  useEffect(() => {
    // Task/agent completion toast — streaming just ended
    if (prevIsStreamingRef.current && !isStreaming && sessionState === "connected") {
      toast.success("Agent finished", { description: "Task completed successfully" });
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, sessionState]);

  useEffect(() => {
    // Unexpected disconnect toast
    if (
      prevSessionStateRef.current === "connected" &&
      sessionState === "disconnected"
    ) {
      toast.warning("Disconnected", { description: "GSD session ended" });
    }
    prevSessionStateRef.current = sessionState;
  }, [sessionState]);
}
