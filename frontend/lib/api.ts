import type {
  CompressionResponse,
  ConversionResponse,
  ConversionResult,
  DownloadResponse,
  FileFormat,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, body.detail || "Request failed");
  }
  return response.json();
}

export async function convertFile(
  file: File,
  targetFormat: FileFormat,
): Promise<ConversionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/convert?target_format=${targetFormat}`,
    { method: "POST", body: formData },
  );

  return handleResponse<ConversionResponse>(response);
}

export async function getConversions(
  limit = 20,
): Promise<ConversionResult[]> {
  const response = await fetch(`${API_BASE}/conversions?limit=${limit}`);
  return handleResponse<ConversionResult[]>(response);
}

export async function getDownloadUrl(
  conversionId: string,
): Promise<DownloadResponse> {
  const response = await fetch(`${API_BASE}/download/${conversionId}`);
  return handleResponse<DownloadResponse>(response);
}

export async function compressFile(
  file: File,
  targetSizeBytes: number,
): Promise<CompressionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_size_bytes", String(targetSizeBytes));

  const response = await fetch(`${API_BASE}/compress`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<CompressionResponse>(response);
}

export async function getCompressionDownloadUrl(
  compressionId: string,
): Promise<DownloadResponse> {
  const response = await fetch(`${API_BASE}/download/compression/${compressionId}`);
  return handleResponse<DownloadResponse>(response);
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}
