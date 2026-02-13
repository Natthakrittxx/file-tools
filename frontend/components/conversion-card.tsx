"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ConversionCardProps {
  filename: string;
  sourceFormat: string;
  targetFormat: string;
  status: "idle" | "converting" | "completed" | "failed";
  progress: number;
  error: string | null;
  downloadUrl: string | null;
  onConvert: () => void;
  onReset: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConversionCard({
  filename,
  sourceFormat,
  targetFormat,
  status,
  progress,
  error,
  downloadUrl,
  onConvert,
  onReset,
}: ConversionCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          <span className="text-sm font-medium truncate">{filename}</span>
          <Badge variant="secondary" className="shrink-0">
            {sourceFormat.toUpperCase()}
          </Badge>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          <Badge variant="outline" className="shrink-0">
            {targetFormat.toUpperCase()}
          </Badge>
        </div>
      </div>

      {status === "converting" && (
        <Progress value={progress} className="h-2" />
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        {status === "idle" && (
          <Button onClick={onConvert} disabled={!targetFormat}>
            Convert
          </Button>
        )}
        {status === "converting" && (
          <Button disabled>
            Converting...
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
            Convert another file
          </Button>
        )}
      </div>
    </div>
  );
}
