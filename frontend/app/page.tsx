"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { FileDropzone } from "@/components/file-dropzone";
import { FormatSelector } from "@/components/format-selector";
import { ConversionCard } from "@/components/conversion-card";
import { ConversionHistory } from "@/components/conversion-history";
import { CompressionCard } from "@/components/compression-card";
import { TargetSizeInput } from "@/components/target-size-input";
import { useFileConversion } from "@/hooks/use-file-conversion";
import { useConversionHistory } from "@/hooks/use-conversion-history";
import { useFileCompression } from "@/hooks/use-file-compression";

const COMPRESSION_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

export default function Home() {
  const conversion = useFileConversion();
  const compression = useFileCompression();
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

  useEffect(() => {
    if (compression.status === "completed") {
      toast.success("File compressed successfully!");
    }
    if (compression.status === "failed" && compression.error) {
      toast.error(compression.error);
    }
  }, [compression.status, compression.error]);

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
            <CardHeader>
              <CardTitle>Compress a File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!compression.file ? (
                <FileDropzone
                  onFileSelected={compression.setFile}
                  accept={COMPRESSION_ACCEPT}
                  helpText="Supports JPG, PNG, PDF (max 50MB)"
                />
              ) : !compression.sourceFormat ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">
                    This file type is not supported for compression. Please upload a JPG, PNG, or PDF file.
                  </p>
                  <button
                    onClick={compression.reset}
                    className="text-sm text-primary underline"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <>
                  <TargetSizeInput
                    value={compression.targetSizeNumeric}
                    unit={compression.targetSizeUnit}
                    originalSizeBytes={compression.file.size}
                    minBytes={compression.minBytes}
                    onValueChange={compression.setTargetSizeBytes}
                    onUnitChange={compression.setTargetSizeUnit}
                    onNumericChange={compression.setTargetSizeNumeric}
                    disabled={compression.status === "compressing"}
                  />
                  <CompressionCard
                    filename={compression.file.name}
                    sourceFormat={compression.sourceFormat}
                    originalSizeBytes={compression.file.size}
                    compressedSizeBytes={compression.result?.compressed_size_bytes ?? null}
                    status={compression.status}
                    progress={compression.progress}
                    error={compression.error}
                    downloadUrl={compression.downloadUrl}
                    onCompress={compression.compress}
                    onReset={compression.reset}
                    canCompress={compression.canCompress}
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
