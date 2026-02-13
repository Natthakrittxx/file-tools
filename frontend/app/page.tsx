"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { FileDropzone } from "@/components/file-dropzone";
import { FormatSelector } from "@/components/format-selector";
import { ConversionCard } from "@/components/conversion-card";
import { ConversionHistory } from "@/components/conversion-history";
import { useFileConversion } from "@/hooks/use-file-conversion";
import { useConversionHistory } from "@/hooks/use-conversion-history";

export default function Home() {
  const conversion = useFileConversion();
  const { history, loading, refresh } = useConversionHistory();

  useEffect(() => {
    if (conversion.status === "completed") {
      toast.success("File converted successfully!");
      refresh();
    }
    if (conversion.status === "failed" && conversion.error) {
      toast.error(conversion.error);
    }
  }, [conversion.status, conversion.error, refresh]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Convert a File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!conversion.file ? (
                <FileDropzone onFileSelected={conversion.setFile} />
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Format</label>
                    <FormatSelector
                      targets={conversion.availableTargets}
                      value={conversion.targetFormat}
                      onChange={conversion.setTargetFormat}
                      disabled={conversion.status === "converting"}
                    />
                  </div>
                  <ConversionCard
                    filename={conversion.file.name}
                    sourceFormat={conversion.sourceFormat || ""}
                    targetFormat={conversion.targetFormat || ""}
                    status={conversion.status}
                    progress={conversion.progress}
                    error={conversion.error}
                    downloadUrl={conversion.downloadUrl}
                    onConvert={conversion.convert}
                    onReset={conversion.reset}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ConversionHistory
                history={history}
                loading={loading}
                onRefresh={refresh}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
