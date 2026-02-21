"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { convertFileWithProgress, getDownloadUrl, SSE_BASE } from "@/lib/api";
import { detectFormat, getTargetFormats } from "@/lib/conversion-matrix";
import type { FileFormat, ConversionResponse, SSEProgress } from "@/types";

interface ConversionState {
  file: File | null;
  sourceFormat: FileFormat | null;
  targetFormat: FileFormat | null;
  availableTargets: FileFormat[];
  selectedPages: number[] | null;
  status: "idle" | "uploading" | "converting" | "completed" | "failed";
  result: ConversionResponse | null;
  taskId: string | null;
  downloadUrl: string | null;
  error: string | null;
  progress: number;
  uploadProgress: number;
  conversionProgress: number;
  progressMessage: string;
}

const initialState: ConversionState = {
  file: null,
  sourceFormat: null,
  targetFormat: null,
  availableTargets: [],
  selectedPages: null,
  status: "idle",
  result: null,
  taskId: null,
  downloadUrl: null,
  error: null,
  progress: 0,
  uploadProgress: 0,
  conversionProgress: 0,
  progressMessage: "",
};

const MAX_SSE_RETRIES = 3;

export function useFileConversion() {
  const [state, setState] = useState<ConversionState>(initialState);
  const abortRef = useRef<(() => void) | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      abortRef.current?.();
    };
  }, []);

  // SSE listener: when taskId is set and status is "converting", open EventSource
  useEffect(() => {
    if (!state.taskId || state.status !== "converting") return;

    const taskId = state.taskId;
    let retries = 0;
    let es: EventSource | null = null;

    function connect() {
      if (typeof EventSource === "undefined") {
        // Fallback: poll for completion
        const interval = setInterval(async () => {
          try {
            const { download_url } = await getDownloadUrl(taskId);
            clearInterval(interval);
            setState((prev) => ({
              ...prev,
              status: "completed",
              downloadUrl: download_url,
              progress: 100,
              conversionProgress: 100,
              progressMessage: "Conversion complete",
            }));
          } catch {
            // Still processing, keep polling
          }
        }, 2000);
        return;
      }

      es = new EventSource(`${SSE_BASE}/progress/${taskId}`);
      eventSourceRef.current = es;

      es.onmessage = async (event) => {
        const data: SSEProgress = JSON.parse(event.data);
        retries = 0; // Reset retries on successful message

        if (data.phase === "completed") {
          es?.close();
          try {
            const { download_url } = await getDownloadUrl(taskId);
            setState((prev) => ({
              ...prev,
              status: "completed",
              downloadUrl: download_url,
              progress: 100,
              conversionProgress: 100,
              progressMessage: "Conversion complete",
            }));
          } catch (err) {
            setState((prev) => ({
              ...prev,
              status: "failed",
              error: err instanceof Error ? err.message : "Failed to get download URL",
              progress: 0,
            }));
          }
          return;
        }

        if (data.phase === "failed") {
          es?.close();
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: data.error || "Conversion failed",
            progress: 0,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          conversionProgress: data.progress,
          progressMessage: data.message,
          // Overall progress: uploading_original = 0-20, converting = 20-80, uploading_result = 80-95
          progress:
            data.phase === "uploading_original"
              ? Math.round(data.progress * 0.2)
              : data.phase === "converting"
                ? 20 + Math.round(data.progress * 0.6)
                : 80 + Math.round(data.progress * 0.15),
        }));
      };

      es.addEventListener("error", () => {
        es?.close();
        if (retries < MAX_SSE_RETRIES) {
          retries++;
          const delay = retries * 1000;
          setTimeout(connect, delay);
        } else {
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: "Connection lost. Please try again.",
            progress: 0,
          }));
        }
      });

      es.addEventListener("timeout", () => {
        es?.close();
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: "Conversion timed out. Please try again.",
          progress: 0,
        }));
      });
    }

    connect();

    return () => {
      es?.close();
      eventSourceRef.current = null;
    };
  }, [state.taskId, state.status]);

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
      status: "uploading",
      error: null,
      progress: 0,
      uploadProgress: 0,
      conversionProgress: 0,
      progressMessage: "Uploading file...",
    }));

    try {
      const { promise, abort } = convertFileWithProgress(
        state.file!,
        state.targetFormat!,
        (percent) => {
          setState((prev) => ({
            ...prev,
            uploadProgress: percent,
            progress: Math.round(percent * 0.15), // Upload is 0-15% of overall
            progressMessage: `Uploading... ${percent}%`,
          }));
        },
        state.selectedPages ?? undefined,
      );
      abortRef.current = abort;

      const result = await promise;
      abortRef.current = null;

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

      // Switch to SSE-driven converting phase
      setState((prev) => ({
        ...prev,
        status: "converting",
        result,
        taskId: result.id,
        uploadProgress: 100,
        progress: 15,
        progressMessage: "Processing...",
      }));
    } catch (err) {
      abortRef.current = null;
      setState((prev) => ({
        ...prev,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        progress: 0,
      }));
    }
  }, [state.file, state.targetFormat, state.selectedPages]);

  const reset = useCallback(() => {
    eventSourceRef.current?.close();
    abortRef.current?.();
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
