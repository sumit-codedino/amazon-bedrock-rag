import { useCallback, useRef } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { generateSignedUrl } from "@/apis/generate-signed-url";
import { File } from "../types";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  chatBotId: string;
  token: string;
  existingFiles: File[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt"];

export default function FileUploader({
  onFilesSelected,
  chatBotId,
  token,
  existingFiles,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: globalThis.File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      console.log(
        `File ${file.name} rejected: Size ${file.size} exceeds ${MAX_FILE_SIZE} bytes limit`
      );
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      console.log(
        `File ${
          file.name
        } rejected: Unsupported file type ${fileExtension}. Supported types: ${SUPPORTED_FILE_TYPES.join(
          ", "
        )}`
      );
      return `Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(
        ", "
      )}`;
    }
    console.log(
      `File ${file.name} accepted: Size ${file.size} bytes, Type ${fileExtension}`
    );
    return null;
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      const updatedFiles = [...existingFiles];

      // Validate files first
      const validFiles = newFiles.filter((file) => {
        const error = validateFile(file);
        if (error) {
          updatedFiles.push({
            name: file.name,
            size: file.size,
            status: "error",
            error,
          });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        onFilesSelected(updatedFiles);
        return;
      }

      // Set initial state for valid files
      const initialFiles: File[] = validFiles.map((file) => ({
        name: file.name,
        size: file.size,
        status: "generating-url",
        file: file,
        uploadProgress: 0,
      }));

      // Add initial files to the list
      const filesWithInitialState = [...updatedFiles, ...initialFiles];
      onFilesSelected(filesWithInitialState);

      // Generate signed URLs for valid files
      const filesWithUrls: File[] = await Promise.all(
        validFiles.map(async (file) => {
          try {
            const response = await generateSignedUrl({
              fileName: file.name,
              chatBotId,
              token,
            });

            if (response.isError) {
              return {
                name: file.name,
                size: file.size,
                status: "error",
                error: response.error || "Failed to generate signed URL",
              };
            }

            return {
              name: file.name,
              size: file.size,
              status: "ready",
              file: file,
              s3Url: response.signedUrl,
              uploadProgress: 0,
            };
          } catch (error) {
            return {
              name: file.name,
              size: file.size,
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            };
          }
        })
      );

      // Update the files with their final state
      const finalFiles = [...updatedFiles];
      filesWithUrls.forEach((file) => {
        finalFiles.push(file);
      });

      onFilesSelected(finalFiles);
    },
    [onFilesSelected, chatBotId, token, existingFiles]
  );

  return (
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
  );
}
