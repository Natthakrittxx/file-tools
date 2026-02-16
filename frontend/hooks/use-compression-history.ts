"use client";

import { useState, useCallback, useEffect } from "react";
import { getCompressions } from "@/lib/api";
import type { CompressionResult } from "@/types";

export function useCompressionHistory() {
  const [history, setHistory] = useState<CompressionResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompressions();
      setHistory(data);
    } catch {
      // Silently fail - history is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, loading, refresh };
}
