"use client";

import { useState, useMemo } from "react";
import { Document, Thumbnail, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfPageSelectorProps {
  file: File;
  selectedPages: number[] | null;
  onSelectionChange: (pages: number[] | null) => void;
}

export function PdfPageSelector({
  file,
  selectedPages,
  onSelectionChange,
}: PdfPageSelectorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);

  const allSelected = selectedPages === null || selectedPages.length === numPages;

  function togglePage(index: number) {
    if (selectedPages === null) {
      // Currently all selected — deselect this one
      const all = Array.from({ length: numPages }, (_, i) => i);
      onSelectionChange(all.filter((i) => i !== index));
    } else if (selectedPages.includes(index)) {
      onSelectionChange(selectedPages.filter((i) => i !== index));
    } else {
      const next = [...selectedPages, index].sort((a, b) => a - b);
      if (next.length === numPages) {
        onSelectionChange(null);
      } else {
        onSelectionChange(next);
      }
    }
  }

  function selectAll() {
    onSelectionChange(null);
  }

  function deselectAll() {
    onSelectionChange([]);
  }

  const selectedCount = selectedPages === null ? numPages : selectedPages.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Select Pages{numPages > 0 && ` (${selectedCount} of ${numPages} selected)`}
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deselectAll}
            disabled={selectedCount === 0}
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-3">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onItemClick={() => {}}
          loading={
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading PDF preview...
            </p>
          }
        >
          {numPages > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: numPages }, (_, i) => {
                const isSelected =
                  selectedPages === null || selectedPages.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => togglePage(i)}
                    className={`relative rounded-md border-2 p-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-teal bg-teal/5"
                        : "border-transparent opacity-40 hover:opacity-70"
                    }`}
                  >
                    <Thumbnail
                      pageNumber={i + 1}
                      width={120}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 rounded-full bg-teal p-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <p className="mt-1 text-xs text-center text-muted-foreground">
                      Page {i + 1}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}
