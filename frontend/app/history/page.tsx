"use client";

import { Clock } from "lucide-react";
import { ConversionHistory } from "@/components/conversion-history";
import { useConversionHistory } from "@/hooks/use-conversion-history";

export default function HistoryPage() {
  const { history, loading, refresh } = useConversionHistory();

  return (
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-teal/10 p-2">
            <Clock className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conversion History</h1>
            <p className="text-sm text-muted-foreground">
              View and download your recent conversions
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <ConversionHistory
            history={history}
            loading={loading}
            onRefresh={refresh}
          />
        </div>
      </div>
    </main>
  );
}
