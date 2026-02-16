"use client";

import { useState, useCallback } from "react";
import { convertFile, getDownloadUrl } from "@/lib/api";
import { detectFormat, getTargetFormats } from "@/lib/conversion-matrix";
import type { FileFormat, ConversionResponse } from "@/types";

interface ConversionState {
  file: File | null;
  sourceFormat: FileFormat | null;
  targetFormat: FileFormat | null;
  availableTargets: FileFormat[];
  selectedPages: number[] | null;
  status: "idle" | "converting" | "completed" | "failed";
  result: ConversionResponse | null;
  downloadUrl: string | null;
  error: string | null;
  progress: number;
}

const initialState: ConversionState = {
  file: null,
  sourceFormat: null,
  targetFormat: null,
  availableTargets: [],
  selectedPages: null,
  status: "idle",
  result: null,
  downloadUrl: null,
  error: null,
  progress: 0,
};

export function useFileConversion() {
  const [state, setState] = useState<ConversionState>(initialState);

  const setFile = useCallback((file: File | null) => {
    if (!file) {
      setState(initialState);
      return;
    }

    const format = detectFormat(file.name);
    const targets = format ? getTargetFormats(format) : [];

    setState({
      ...initialState,
      file,
      sourceFormat: format,
      availableTargets: targets,
      targetFormat: targets.length === 1 ? targets[0] : null,
    });
  }, []);

  const setTargetFormat = useCallback((format: FileFormat) => {
    setState((prev) => ({ ...prev, targetFormat: format, selectedPages: null }));
  }, []);

  const setSelectedPages = useCallback((pages: number[] | null) => {
    setState((prev) => ({ ...prev, selectedPages: pages }));
  }, []);

  const convert = useCallback(async () => {
    if (!state.file || !state.targetFormat) return;

    setState((prev) => ({
      ...prev,
      status: "converting",
      error: null,
      progress: 20,
    }));

    try {
      setState((prev) => ({ ...prev, progress: 50 }));

      const result = await convertFile(
        state.file!,
        state.targetFormat!,
        state.selectedPages ?? undefined,
      );

      if (result.status === "failed") {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: result.error_message || "Conversion failed",
          result,
          progress: 0,
        }));
        return;
      }

      setState((prev) => ({ ...prev, progress: 80, result }));

      const { download_url } = await getDownloadUrl(result.id);

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
  }, [state.file, state.targetFormat, state.selectedPages]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const isPdfToImage =
    state.sourceFormat === "pdf" &&
    state.targetFormat !== null &&
    ["jpg", "png", "gif"].includes(state.targetFormat);

  return {
    ...state,
    isPdfToImage,
    setFile,
    setTargetFormat,
    setSelectedPages,
    convert,
    reset,
  };
}
