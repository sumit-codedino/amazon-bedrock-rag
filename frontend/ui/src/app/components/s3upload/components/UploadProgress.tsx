import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { File } from "../types";

interface UploadProgressProps {
  files: File[];
  isUploading: boolean;
  onUpload: () => void;
}

export default function UploadProgress({
  files,
  isUploading,
  onUpload,
}: UploadProgressProps) {
  if (files.length === 0) return null;

  // Filter out error files
  const validFiles = files.filter((file) => file.status !== "error");
  if (validFiles.length === 0) return null;

  const areAllFilesReady =
    validFiles.length > 0 &&
    validFiles.every((file) => file.status === "ready");
  const totalProgress =
    validFiles.reduce((acc, file) => acc + (file.uploadProgress || 0), 0) /
    validFiles.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onUpload}
          disabled={!areAllFilesReady || isUploading}
          className={`px-4 py-2 rounded-md text-white ${
            isUploading || !areAllFilesReady
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
  );
}
