import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { File } from "../types";

interface FileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

export default function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) return null;

  const getStatusIcon = (file: File) => {
    switch (file.status) {
      case "generating-url":
        return (
          <div className="flex items-center space-x-2">
            <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-xs">Generating URL...</span>
          </div>
        );
      case "ready":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "uploading":
        return (
          <div className="flex items-center space-x-2">
            <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-xs">
              {Math.round(file.uploadProgress || 0)}%
            </span>
          </div>
        );
      case "uploaded":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "error":
        return (
          <div className="group relative">
            <XCircleIcon className="w-4 h-4 text-red-500" />
            <div className="absolute left-0 top-0 hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded">
              {file.error}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
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
              {getStatusIcon(file)}
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
