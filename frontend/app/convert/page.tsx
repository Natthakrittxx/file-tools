"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import dynamic from "next/dynamic";
import { FileDropzone } from "@/components/file-dropzone";
import { FormatSelector } from "@/components/format-selector";
import { ConversionCard } from "@/components/conversion-card";

const PdfPageSelector = dynamic(
  () => import("@/components/pdf-page-selector").then((m) => m.PdfPageSelector),
  { ssr: false },
);
import { useFileConversion } from "@/hooks/use-file-conversion";
import { useConversionHistory } from "@/hooks/use-conversion-history";

export default function ConvertPage() {
  const conversion = useFileConversion();
  const { refresh } = useConversionHistory();

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
    <main className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-teal/10 p-2">
            <ArrowLeftRight className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Convert a File</h1>
            <p className="text-sm text-muted-foreground">
              Upload a file and pick a target format to convert it
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
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
                  disabled={conversion.status === "converting" || conversion.status === "uploading"}
                />
              </div>
              {conversion.isPdfToImage && conversion.status === "idle" && (
                <PdfPageSelector
                  file={conversion.file!}
                  selectedPages={conversion.selectedPages}
                  onSelectionChange={conversion.setSelectedPages}
                />
              )}
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
                selectedPageCount={
                  conversion.isPdfToImage
                    ? conversion.selectedPages?.length ?? null
                    : undefined
                }
                uploadProgress={conversion.uploadProgress}
                conversionProgress={conversion.conversionProgress}
                progressMessage={conversion.progressMessage}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
