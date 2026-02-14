"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Minimize2 } from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { TargetSizeInput } from "@/components/target-size-input";
import { CompressionCard } from "@/components/compression-card";
import { useFileCompression } from "@/hooks/use-file-compression";

const COMPRESSION_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

export default function CompressPage() {
  const compression = useFileCompression();

  useEffect(() => {
    if (compression.status === "completed") {
      toast.success("File compressed successfully!");
    }
    if (compression.status === "failed" && compression.error) {
      toast.error(compression.error);
    }
  }, [compression.status, compression.error]);

  return (
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-teal/10 p-2">
            <Minimize2 className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compress a File</h1>
            <p className="text-sm text-muted-foreground">
              Reduce file size while preserving quality
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          {!compression.file ? (
            <FileDropzone
              onFileSelected={compression.setFile}
              accept={COMPRESSION_ACCEPT}
              helpText="Supports JPG, PNG, PDF (max 50MB)"
            />
          ) : !compression.sourceFormat ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                This file type is not supported for compression. Please upload a
                JPG, PNG, or PDF file.
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
                compressedSizeBytes={
                  compression.result?.compressed_size_bytes ?? null
                }
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
        </div>
      </div>
    </main>
  );
}
