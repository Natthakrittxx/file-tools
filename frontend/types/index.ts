export type FileFormat =
  | "jpg"
  | "png"
  | "gif"
  | "svg"
  | "pdf"
  | "docx"
  | "pptx"
  | "txt";

export type ConversionStatus = "pending" | "processing" | "completed" | "failed";

export interface ConversionResponse {
  id: string;
  status: ConversionStatus;
  original_filename: string;
  source_format: string;
  target_format: string;
  error_message?: string | null;
}

export interface ConversionResult {
  id: string;
  original_filename: string;
  source_format: string;
  target_format: string;
  status: string;
  error_message?: string | null;
  original_storage_path?: string | null;
  converted_storage_path?: string | null;
  file_size_bytes?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DownloadResponse {
  download_url: string;
}
