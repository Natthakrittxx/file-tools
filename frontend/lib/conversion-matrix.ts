import type { FileFormat } from "@/types";

export const CONVERSION_MATRIX: Record<FileFormat, FileFormat[]> = {
  jpg: ["png", "gif"],
  png: ["jpg", "gif"],
  gif: ["jpg", "png"],
  svg: ["png", "jpg", "gif", "pdf"],
  pdf: ["jpg", "png", "gif", "docx"],
  docx: ["pdf", "txt"],
  pptx: ["pdf"],
  txt: ["docx", "pdf"],
};

export const ACCEPTED_EXTENSIONS: Record<FileFormat, string> = {
  jpg: ".jpg,.jpeg",
  png: ".png",
  gif: ".gif",
  svg: ".svg",
  pdf: ".pdf",
  docx: ".docx",
  pptx: ".pptx",
  txt: ".txt",
};

const ALL_ACCEPTED = Object.values(ACCEPTED_EXTENSIONS).join(",");

export const ACCEPT_MAP: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
};

export function detectFormat(filename: string): FileFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext && ext in CONVERSION_MATRIX) return ext as FileFormat;
  return null;
}

export function getTargetFormats(source: FileFormat): FileFormat[] {
  return CONVERSION_MATRIX[source] || [];
}
