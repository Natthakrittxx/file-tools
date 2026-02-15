"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile, getDownloadUrl } from "@/lib/api";
import type { ConversionResult } from "@/types";

interface ConversionHistoryProps {
  history: ConversionResult[];
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

async function handleDownload(item: ConversionResult) {
  try {
    const { download_url } = await getDownloadUrl(item.id);
    const basename = item.original_filename.replace(/\.[^.]+$/, "");
    await downloadFile(download_url, `${basename}.${item.target_format}`);
  } catch {
    // ignore
  }
}

export function ConversionHistory({
  history,
  loading,
  onRefresh,
}: ConversionHistoryProps) {
  if (history.length === 0 && !loading) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No conversion history yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Conversions</h3>
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
              <span className="text-muted-foreground shrink-0">
                {item.source_format.toUpperCase()} → {item.target_format.toUpperCase()}
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
