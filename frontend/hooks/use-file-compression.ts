"use client";

import { useState, useCallback } from "react";
import { compressFile, getCompressionDownloadUrl } from "@/lib/api";
import type { CompressibleFormat, CompressionResponse } from "@/types";

const COMPRESSIBLE_FORMATS: CompressibleFormat[] = ["jpg", "png", "pdf"];
const MIN_BYTES: Record<CompressibleFormat, number> = {
  jpg: 1024,
  png: 1024,
  pdf: 10240,
};

function detectCompressibleFormat(filename: string): CompressibleFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "pdf") return "pdf";
  return null;
}

interface CompressionState {
  file: File | null;
  sourceFormat: CompressibleFormat | null;
  targetSizeBytes: number;
  targetSizeNumeric: number;
  targetSizeUnit: "KB" | "MB";
  status: "idle" | "compressing" | "completed" | "failed";
  result: CompressionResponse | null;
  downloadUrl: string | null;
  error: string | null;
  progress: number;
}

const initialState: CompressionState = {
  file: null,
  sourceFormat: null,
  targetSizeBytes: 0,
  targetSizeNumeric: 0,
  targetSizeUnit: "KB",
  status: "idle",
  result: null,
  downloadUrl: null,
  error: null,
  progress: 0,
};

export function useFileCompression() {
  const [state, setState] = useState<CompressionState>(initialState);

  const setFile = useCallback((file: File | null) => {
    if (!file) {
      setState(initialState);
      return;
    }

    const format = detectCompressibleFormat(file.name);

    // Default target: 50% of original
    const halfSize = Math.round(file.size / 2);
    let unit: "KB" | "MB" = "KB";
    let numeric: number;
    if (halfSize >= 1024 * 1024) {
      unit = "MB";
      numeric = parseFloat((halfSize / (1024 * 1024)).toFixed(1));
    } else {
      numeric = parseFloat((halfSize / 1024).toFixed(1));
    }

    setState({
      ...initialState,
      file,
      sourceFormat: format,
      targetSizeBytes: halfSize,
      targetSizeNumeric: numeric,
      targetSizeUnit: unit,
    });
  }, []);

  const setTargetSizeBytes = useCallback((bytes: number) => {
    setState((prev) => ({ ...prev, targetSizeBytes: bytes }));
  }, []);

  const setTargetSizeNumeric = useCallback((num: number) => {
    setState((prev) => ({ ...prev, targetSizeNumeric: num }));
  }, []);

  const setTargetSizeUnit = useCallback((unit: "KB" | "MB") => {
    setState((prev) => {
      // Recalculate numeric value when switching units
      const bytes = prev.targetSizeBytes;
      const numeric = unit === "KB"
        ? parseFloat((bytes / 1024).toFixed(1))
        : parseFloat((bytes / (1024 * 1024)).toFixed(1));
      return { ...prev, targetSizeUnit: unit, targetSizeNumeric: numeric };
    });
  }, []);

  const canCompress = useCallback((): boolean => {
    if (!state.file || !state.sourceFormat) return false;
    if (state.targetSizeBytes <= 0) return false;
    const minBytes = MIN_BYTES[state.sourceFormat];
    if (state.targetSizeBytes < minBytes) return false;
    if (state.targetSizeBytes >= state.file.size) return false;
    return true;
  }, [state.file, state.sourceFormat, state.targetSizeBytes]);

  const compress = useCallback(async () => {
    if (!state.file || !state.sourceFormat || !canCompress()) return;

    setState((prev) => ({
      ...prev,
      status: "compressing",
      error: null,
      progress: 20,
    }));

    try {
      setState((prev) => ({ ...prev, progress: 50 }));

      const result = await compressFile(state.file!, state.targetSizeBytes);

      if (result.status === "failed") {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: result.error_message || "Compression failed",
          result,
          progress: 0,
        }));
        return;
      }

      setState((prev) => ({ ...prev, progress: 80, result }));

      const { download_url } = await getCompressionDownloadUrl(result.id);

      setState((prev) => ({
        ...prev,
        status: "completed",
        downloadUrl: download_url,
        progress: 100,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        progress: 0,
      }));
    }
  }, [state.file, state.sourceFormat, state.targetSizeBytes, canCompress]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const minBytes = state.sourceFormat ? MIN_BYTES[state.sourceFormat] : 1024;

  return {
    ...state,
    minBytes,
    canCompress: canCompress(),
    setFile,
    setTargetSizeBytes,
    setTargetSizeNumeric,
    setTargetSizeUnit,
    compress,
    reset,
    compressibleFormats: COMPRESSIBLE_FORMATS,
  };
}
