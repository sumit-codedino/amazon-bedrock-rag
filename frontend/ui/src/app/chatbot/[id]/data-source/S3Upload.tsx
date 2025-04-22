import { useState, useCallback, useRef, useEffect } from "react";
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { generateSignedUrl } from "@/apis/generate-signed-url";
import { useAuth } from "@clerk/nextjs";
import { createDataSource } from "@/apis/create-data-source";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { setS3DataSourceId } from "@/app/store/slices/userSlice";
import { useRouter } from "next/navigation";
import { startIngestion } from "@/apis/start-ingestion";

interface S3UploadProps {
  chatBotId: string;
}

interface File {
  name: string;
  size: number;
  isUploading: boolean;
  isUploaded: boolean;
  isError: boolean;
  error?: string;
  s3Url?: string;
  file?: globalThis.File;
  uploadProgress?: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt"];
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export default function S3Upload({ chatBotId }: S3UploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken, userId } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const s3DataSourceId = useAppSelector((state) => state.user.s3DataSourceId);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Token is not available");
      }
      setToken(token);
    };
    fetchToken();
  }, [getToken]);

  const validateFile = (file: globalThis.File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      return `Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(
        ", "
      )}`;
    }
    return null;
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);

      // Validate files first
      const validFiles = newFiles.filter((file) => {
        const error = validateFile(file);
        if (error) {
          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              isUploading: false,
              isUploaded: false,
              isError: true,
              error,
            },
          ]);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const newFileObjects: File[] = validFiles.map((file) => ({
        name: file.name,
        size: file.size,
        isUploading: true,
        isUploaded: false,
        isError: false,
        file: file,
        uploadProgress: 0,
      }));

      setFiles((prevFiles) => [...prevFiles, ...newFileObjects]);

      const token = await getToken();
      if (!token) {
        setFiles((prevFiles) =>
          prevFiles.map((file) => ({
            ...file,
            isUploading: false,
            isError: true,
            error: "Authentication required",
          }))
        );
        return;
      }

      // Process files in batches
      for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE);
        await processBatch(batch, i, token);
      }
    },
    [chatBotId, getToken]
  );

  const processBatch = async (
    batch: globalThis.File[],
    startIndex: number,
    token: string
  ) => {
    const batchPromises = batch.map(async (file, indexInBatch) => {
      const fileIndex = files.length + startIndex + indexInBatch;
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount < MAX_RETRIES) {
        try {
          const response = await generateSignedUrl({
            fileName: file.name,
            chatBotId,
            token,
          });

          if (response.isError) {
            throw new Error(response.error);
          }

          const { signedUrl } = response;

          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              s3Url: signedUrl,
              uploadProgress: 100,
              isUploading: false,
              isUploaded: true,
            };
            return updatedFiles;
          });

          return;
        } catch (error) {
          lastError =
            error instanceof Error
              ? error
              : new Error("Unknown error occurred");
          retryCount++;

          if (retryCount < MAX_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * retryCount)
            );
            continue;
          }

          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              isUploading: false,
              isError: true,
              error:
                lastError?.message ||
                "Failed to upload file after multiple attempts",
            };
            return updatedFiles;
          });
        }
      }
    });

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Batch processing error:", error);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      if (updatedFiles[index].isUploading && abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
      }
      return updatedFiles.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (!token) {
      throw new Error("Authentication required");
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const uploadPromises = files.map(async (file, index) => {
        if (!file.s3Url || !file.file) {
          throw new Error(`Missing signed URL or file for ${file.name}`);
        }

        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              setFiles((prev) => {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  uploadProgress: progress,
                };
                return updated;
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(
                new Error(`Failed to upload ${file.name}: ${xhr.statusText}`)
              );
            }
          };

          xhr.onerror = () =>
            reject(new Error(`Failed to upload ${file.name}`));
          xhr.ontimeout = () =>
            reject(new Error(`Upload timeout for ${file.name}`));

          if (!file.s3Url) {
            reject(new Error(`Missing signed URL for ${file.name}`));
            return;
          }

          xhr.open("PUT", file.s3Url);
          xhr.send(file.file);
        });
      });

      await Promise.all(uploadPromises);

      if (!s3DataSourceId) {
        const response = await createDataSource({
          chatBotId,
          dataSourceType: "s3",
          userId: userId || "",
          token,
        });
        if (response.isError) {
          throw new Error(response.error);
        }
        dispatch(setS3DataSourceId(response.dataSourceId || ""));
      }

      await startIngestion({
        userId: userId || "",
        dataSourceId: s3DataSourceId || "",
        dataSourceType: "s3",
        token,
      });

      router.push(`/chatbot/${chatBotId}/chat`);
    } catch (error) {
      console.error("Upload error:", error);
      // Handle error appropriately
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isAnyFileUploading = files.some((file) => file.isUploading);
  const isAnyFileError = files.some((file) => file.isError);
  const areAllFilesReady =
    files.length > 0 && files.every((file) => file.isUploaded);
  const totalProgress =
    files.reduce((acc, file) => acc + (file.uploadProgress || 0), 0) /
    files.length;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Upload Files to S3</h3>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <CloudArrowUpIcon className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF, DOCX, TXT files (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
            </p>
          </div>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept={SUPPORTED_FILE_TYPES.join(",")}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{file.name}</span>
                  {file.isUploading && (
                    <div className="flex items-center space-x-2">
                      <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-xs">
                        {Math.round(file.uploadProgress || 0)}%
                      </span>
                    </div>
                  )}
                  {file.isUploaded && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                  {file.isError && (
                    <div className="group relative">
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                      <div className="absolute left-0 top-0 hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded">
                        {file.error}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!areAllFilesReady || isAnyFileError || isUploading}
              className={`px-4 py-2 rounded-md text-white ${
                isUploading || !areAllFilesReady || isAnyFileError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                "Upload Files"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
