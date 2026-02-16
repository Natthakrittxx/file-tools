"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile, getCompressionDownloadUrl } from "@/lib/api";
import type { CompressionResult } from "@/types";

interface CompressionHistoryProps {
  history: CompressionResult[];
  loading: boolean;
  onRefresh: () => void;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleDownload(item: CompressionResult) {
  try {
    const { download_url } = await getCompressionDownloadUrl(item.id);
    await downloadFile(download_url, item.original_filename);
  } catch {
    // ignore
  }
}

export function CompressionHistory({
  history,
  loading,
  onRefresh,
}: CompressionHistoryProps) {
  if (history.length === 0 && !loading) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No compression history yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Compressions</h3>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate max-w-[180px]">
                {item.original_filename}
              </span>
              <Badge variant="outline" className="shrink-0">
                {item.source_format.toUpperCase()}
              </Badge>
              <span className="text-muted-foreground shrink-0">
                {formatBytes(item.original_size_bytes)}
                {item.compressed_size_bytes != null && (
                  <> → {formatBytes(item.compressed_size_bytes)}</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.created_at && (
                <span className="text-xs text-muted-foreground">
                  {timeAgo(item.created_at)}
                </span>
              )}
              <Badge variant={statusVariant(item.status)}>
                {item.status}
              </Badge>
              {item.status === "completed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleDownload(item)}
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
