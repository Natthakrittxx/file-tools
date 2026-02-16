"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { ConversionHistory } from "@/components/conversion-history";
import { CompressionHistory } from "@/components/compression-history";
import { useConversionHistory } from "@/hooks/use-conversion-history";
import { useCompressionHistory } from "@/hooks/use-compression-history";

type HistoryType = "conversion" | "compression";

const HISTORY_OPTIONS: { label: string; value: HistoryType }[] = [
  { label: "Conversion History", value: "conversion" },
  { label: "Compression History", value: "compression" },
];

const SUBTITLES: Record<HistoryType, string> = {
  conversion: "View and download your recent conversions",
  compression: "View and download your recent compressions",
};

export default function HistoryPage() {
  const [historyType, setHistoryType] = useState<HistoryType>("conversion");
  const conversion = useConversionHistory();
  const compression = useCompressionHistory();

  return (
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-teal/10 p-2">
            <Clock className="h-5 w-5 text-teal" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">History</h1>
              <NativeSelect
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value as HistoryType)}
                className="w-auto"
              >
                {HISTORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <p className="text-sm text-muted-foreground">
              {SUBTITLES[historyType]}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          {historyType === "conversion" ? (
            <ConversionHistory
              history={conversion.history}
              loading={conversion.loading}
              onRefresh={conversion.refresh}
            />
          ) : (
            <CompressionHistory
              history={compression.history}
              loading={compression.loading}
              onRefresh={compression.refresh}
            />
          )}
        </div>
      </div>
    </main>
  );
}
