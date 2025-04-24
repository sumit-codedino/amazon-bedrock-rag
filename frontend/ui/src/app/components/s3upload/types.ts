export interface File {
  name: string;
  size: number;
  status:
    | "idle"
    | "generating-url"
    | "ready"
    | "uploading"
    | "uploaded"
    | "error";
  error?: string;
  s3Url?: string;
  file?: globalThis.File;
  uploadProgress?: number;
}
