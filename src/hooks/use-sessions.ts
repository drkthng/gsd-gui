import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import type { SessionInfo } from "@/lib/types";

const client = createGsdClient();
const PAGE_SIZE = 10;

export interface UseSessionsResult {
  sessions: SessionInfo[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  loadAll: () => void;
  refetch: () => void;
}

export function useSessions(): UseSessionsResult {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  // Initial load: newest PAGE_SIZE sessions
  const fetchInitial = useCallback(async (projectPath: string) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);
    setSessions([]);
    setTotal(0);
    try {
      const { sessions: data, total: t } = await client.listSessions(projectPath, 0, PAGE_SIZE);
      if (gen !== fetchGenRef.current) return;
      setSessions(data);
      setTotal(t);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (gen === fetchGenRef.current) setIsLoading(false);
    }
  }, []);

  // Load next PAGE_SIZE (appends)
  const loadMore = useCallback(async () => {
    if (!activeProject) return;
    const gen = ++fetchGenRef.current;
    setIsLoadingMore(true);
    try {
      const { sessions: data, total: t } = await client.listSessions(
        activeProject.path,
        sessions.length,
        PAGE_SIZE,
      );
      if (gen !== fetchGenRef.current) return;
      setSessions((prev) => [...prev, ...data]);
      setTotal(t);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (gen === fetchGenRef.current) setIsLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject, sessions.length]);

  // Load all remaining sessions
  const loadAll = useCallback(async () => {
    if (!activeProject) return;
    const gen = ++fetchGenRef.current;
    setIsLoadingMore(true);
    try {
      const { sessions: data, total: t } = await client.listSessions(activeProject.path, 0, 0);
      if (gen !== fetchGenRef.current) return;
      setSessions(data);
      setTotal(t);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (gen === fetchGenRef.current) setIsLoadingMore(false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) {
      setSessions([]);
      setTotal(0);
      setError(null);
      setIsLoading(false);
      return;
    }
    fetchInitial(activeProject.path);
  }, [activeProject, fetchInitial]);

  const refetch = useCallback(() => {
    if (activeProject) fetchInitial(activeProject.path);
  }, [activeProject, fetchInitial]);

  return {
    sessions,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore: sessions.length < total,
    loadMore,
    loadAll,
    refetch,
  };
}
