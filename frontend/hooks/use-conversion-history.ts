"use client";

import { useState, useCallback, useEffect } from "react";
import { getConversions } from "@/lib/api";
import type { ConversionResult } from "@/types";

export function useConversionHistory() {
  const [history, setHistory] = useState<ConversionResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversions();
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
