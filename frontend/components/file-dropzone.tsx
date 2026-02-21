"use client";

import { useCallback } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ACCEPT_MAP } from "@/lib/conversion-matrix";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: Record<string, string[]>;
  helpText?: string;
}

export function FileDropzone({ onFileSelected, disabled, accept, helpText }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const error = rejections[0]?.errors[0];
    if (!error) return;
    if (error.code === "file-too-large") {
      toast.error("File is too large (max 50MB)");
    } else if (error.code === "file-invalid-type") {
      toast.error("Unsupported file type");
    } else {
      toast.error(error.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: accept || ACCEPT_MAP,
      maxSize: MAX_SIZE,
      multiple: false,
      disabled,
    });

  const rejection = fileRejections[0]?.errors[0];

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragAccept ? "border-green-500 bg-green-500/5" : ""}
        ${isDragReject ? "border-destructive bg-destructive/5" : ""}
        ${!isDragActive ? "border-muted-foreground/25 hover:border-primary/50" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        {isDragReject ? (
          <p className="text-sm text-destructive font-medium">Unsupported file type</p>
        ) : isDragAccept ? (
          <p className="text-sm text-green-600 font-medium">Drop to upload</p>
        ) : isDragActive ? (
          <p className="text-sm text-primary font-medium">Drop your file here</p>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              {helpText || "Supports JPG, PNG, GIF, SVG, PDF, DOCX, PPTX, TXT (max 50MB)"}
            </p>
          </>
        )}
        {rejection && (
          <p className="text-xs text-destructive mt-1">
            {rejection.code === "file-too-large"
              ? "File is too large (max 50MB)"
              : rejection.message}
          </p>
        )}
      </div>
    </div>
  );
}
