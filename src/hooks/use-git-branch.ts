import { useState, useEffect } from "react";
import { createGsdClient } from "@/services/gsd-client";

const client = createGsdClient();

/**
 * Reads the current git branch for a given project path by parsing .git/HEAD.
 * Returns null when no path is provided or the directory isn't a git repo.
 */
export function useGitBranch(projectPath: string | null): string | null {
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    if (!projectPath) {
      setBranch(null);
      return;
    }
    let cancelled = false;
    client.getGitBranch(projectPath).then((b) => {
      if (!cancelled) setBranch(b);
    }).catch(() => {
      if (!cancelled) setBranch(null);
    });
    return () => { cancelled = true; };
  }, [projectPath]);

  return branch;
}
