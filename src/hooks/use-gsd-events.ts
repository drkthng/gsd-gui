import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createGsdClient } from "@/services/gsd-client";
import { useGsdStore } from "@/stores/gsd-store";
import type { RpcEvent, GsdEventPayload, GsdExitPayload, GsdErrorPayload, GsdFileChangedPayload } from "@/lib/types";

const client = createGsdClient();

/**
 * Hook that subscribes to all Tauri event streams and routes them to the
 * appropriate Zustand store actions. Also invalidates TanStack Query cache
 * when file changes are detected.
 *
 * Mount this once near the app root.
 */
export function useGsdEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    let cancelled = false;

    async function subscribe() {
      // GSD stdout events — parse JSONL and route to store
      const unGsdEvent = await client.onGsdEvent((payload: GsdEventPayload) => {
        try {
          const event = JSON.parse(payload.raw) as RpcEvent;
          useGsdStore.getState().handleGsdEvent(event);
        } catch {
          // Ignore non-JSON lines (e.g. stderr leakage)
        }
      });
      if (cancelled) { unGsdEvent(); return; }
      unlisteners.push(unGsdEvent);

      // Process exit
      const unExit = await client.onProcessExit((payload: GsdExitPayload) => {
        useGsdStore.getState().handleProcessExit(payload);
      });
      if (cancelled) { unExit(); unlisteners.forEach((fn) => fn()); return; }
      unlisteners.push(unExit);

      // Process error
      const unError = await client.onProcessError((payload: GsdErrorPayload) => {
        useGsdStore.getState().handleProcessError(payload);
      });
      if (cancelled) { unError(); unlisteners.forEach((fn) => fn()); return; }
      unlisteners.push(unError);

      // File changes — invalidate query cache so useGsdState refetches
      const unFileChanged = await client.onFileChanged((_payload: GsdFileChangedPayload) => {
        queryClient.invalidateQueries({ queryKey: ["gsd-state"] });
      });
      if (cancelled) { unFileChanged(); unlisteners.forEach((fn) => fn()); return; }
      unlisteners.push(unFileChanged);
    }

    subscribe();

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [queryClient]);
}
