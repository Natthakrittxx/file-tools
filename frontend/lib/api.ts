import type {
  CompressionResponse,
  CompressionResult,
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
  selectedPages?: number[],
): Promise<ConversionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (selectedPages !== undefined) {
    formData.append("selected_pages", JSON.stringify(selectedPages));
  }

  const response = await fetch(
    `${API_BASE}/convert?target_format=${targetFormat}`,
    { method: "POST", body: formData },
  );

  return handleResponse<ConversionResponse>(response);
}

export function convertFileWithProgress(
  file: File,
  targetFormat: FileFormat,
  onUploadProgress: (percent: number) => void,
  selectedPages?: number[],
): { promise: Promise<ConversionResponse>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);
  if (selectedPages !== undefined) {
    formData.append("selected_pages", JSON.stringify(selectedPages));
  }

  const promise = new Promise<ConversionResponse>((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as ConversionResponse);
        } else {
          reject(new ApiError(xhr.status, data.detail || "Request failed"));
        }
      } catch {
        reject(new ApiError(xhr.status, "Invalid response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.open("POST", `${API_BASE}/convert?target_format=${targetFormat}`);
    xhr.timeout = 300000; // 5 minutes
    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

export const SSE_BASE = API_BASE;

export async function getConversions(
  limit = 20,
): Promise<ConversionResult[]> {
  const response = await fetch(`${API_BASE}/conversions?limit=${limit}`);
  return handleResponse<ConversionResult[]>(response);
}

export async function getCompressions(
  limit = 20,
): Promise<CompressionResult[]> {
  const response = await fetch(`${API_BASE}/compressions?limit=${limit}`);
  return handleResponse<CompressionResult[]>(response);
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
