"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CompressionCardProps {
  filename: string;
  sourceFormat: string;
  originalSizeBytes: number;
  compressedSizeBytes: number | null;
  status: "idle" | "compressing" | "completed" | "failed";
  progress: number;
  error: string | null;
  downloadUrl: string | null;
  onCompress: () => void;
  onReset: () => void;
  canCompress: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompressionCard({
  filename,
  sourceFormat,
  originalSizeBytes,
  compressedSizeBytes,
  status,
  progress,
  error,
  downloadUrl,
  onCompress,
  onReset,
  canCompress,
}: CompressionCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          <span className="text-sm font-medium truncate">{filename}</span>
          <Badge variant="secondary" className="shrink-0">
            {sourceFormat.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatBytes(originalSizeBytes)}
          </span>
        </div>
      </div>

      {status === "compressing" && (
        <Progress value={progress} className="h-2" />
      )}

      {status === "completed" && compressedSizeBytes != null && (
        <p className="text-sm text-muted-foreground">
          Compressed: {formatBytes(compressedSizeBytes)}{" "}
          ({Math.round((1 - compressedSizeBytes / originalSizeBytes) * 100)}% reduction)
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        {status === "idle" && (
          <Button onClick={onCompress} disabled={!canCompress}>
            Compress
          </Button>
        )}
        {status === "compressing" && (
          <Button disabled>
            Compressing...
          </Button>
        )}
        {status === "completed" && downloadUrl && (
          <Button asChild>
            <a href={downloadUrl} download>
              Download
            </a>
          </Button>
        )}
        {(status === "completed" || status === "failed") && (
          <Button variant="outline" onClick={onReset}>
            Compress another file
          </Button>
        )}
      </div>
    </div>
  );
}
