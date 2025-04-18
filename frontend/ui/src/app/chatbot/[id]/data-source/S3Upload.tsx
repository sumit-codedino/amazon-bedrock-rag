import { useState, useCallback, useRef } from "react";
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { generateSignedUrl } from "@/apis/generate-signed-url";
import { useAuth } from "@clerk/nextjs";

interface S3UploadProps {
  chatBotId: string;
}

interface File {
  name: string;
  isUploading: boolean;
  isUploaded: boolean;
  isError: boolean;
  error?: string;
  s3Url?: string;
  file?: globalThis.File;
}

export default function S3Upload({ chatBotId }: S3UploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      const newFileObjects: File[] = newFiles.map((file) => ({
        name: file.name,
        isUploading: true,
        isUploaded: false,
        isError: false,
        file: file,
      }));

      setFiles((prevFiles) => [...prevFiles, ...newFileObjects]);

      // Get auth token
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

      // Process files in batches of 10
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(newFiles.length / BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, newFiles.length);
        const batch = newFiles.slice(startIndex, endIndex);

        const batchPromises = batch.map(async (file, indexInBatch) => {
          const fileIndex = files.length + startIndex + indexInBatch;
          let retryCount = 0;
          let lastError: Error | null = null;

          while (retryCount < MAX_RETRIES) {
            try {
              // Get signed URL
              const response = await generateSignedUrl({
                fileName: file.name,
                chatBotId,
                token,
              });

              if (response.isError) {
                throw new Error(response.error);
              }

              const { signedUrl } = response;

              // Update file status
              setFiles((prevFiles) => {
                const updatedFiles = [...prevFiles];
                updatedFiles[fileIndex] = {
                  ...updatedFiles[fileIndex],
                  isUploading: false,
                  isUploaded: true,
                  s3Url: signedUrl,
                };
                return updatedFiles;
              });

              return; // Success, exit retry loop
            } catch (error) {
              lastError =
                error instanceof Error
                  ? error
                  : new Error("Unknown error occurred");
              retryCount++;

              if (retryCount < MAX_RETRIES) {
                // Wait before retrying
                await new Promise((resolve) =>
                  setTimeout(resolve, RETRY_DELAY * retryCount)
                );
                continue;
              }

              // Update file status with error after all retries failed
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
          // Wait for the current batch to complete
          await Promise.all(batchPromises);
        } catch (error) {
          console.error(`Batch ${batchIndex + 1} failed:`, error);
          // Continue with next batch even if current batch had errors
        }
      }
    },
    [chatBotId, files.length, getToken]
  );

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      // Clean up any ongoing uploads for this file
      if (updatedFiles[index].isUploading) {
        // You might want to abort any ongoing fetch requests here
        // if you're using AbortController
      }
      return updatedFiles.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isUploading: true,
        isUploaded: false,
        isError: false,
      }))
    );

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.s3Url || !file.file) {
          throw new Error(`Missing signed URL or file for ${file.name}`);
        }

        try {
          // Create a new request with proper headers
          const response = await fetch(file.s3Url, {
            method: "PUT",
            body: file.file,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload ${file.name}: ${errorText}`);
          }

          // Update file status to uploaded
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[i] = {
              ...updatedFiles[i],
              isUploading: false,
              isUploaded: true,
            };
            return updatedFiles;
          });
        } catch (error) {
          // Update file status with error
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[i] = {
              ...updatedFiles[i],
              isUploading: false,
              isError: true,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to upload file",
            };
            return updatedFiles;
          });
        }
      }
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
              PDF, DOCX, TXT files
            </p>
          </div>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
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
                    <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
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
