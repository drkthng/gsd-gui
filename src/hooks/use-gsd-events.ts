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
      unlisteners.push(unGsdEvent);

      // Process exit
      const unExit = await client.onProcessExit((payload: GsdExitPayload) => {
        useGsdStore.getState().handleProcessExit(payload);
      });
      unlisteners.push(unExit);

      // Process error
      const unError = await client.onProcessError((payload: GsdErrorPayload) => {
        useGsdStore.getState().handleProcessError(payload);
      });
      unlisteners.push(unError);

      // File changes — invalidate query cache so useGsdState refetches
      const unFileChanged = await client.onFileChanged((_payload: GsdFileChangedPayload) => {
        queryClient.invalidateQueries({ queryKey: ["gsd-state"] });
      });
      unlisteners.push(unFileChanged);
    }

    subscribe();

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [queryClient]);
}
