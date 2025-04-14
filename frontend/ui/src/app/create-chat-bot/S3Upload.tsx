import { useState, useCallback } from "react";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

interface S3UploadProps {
  onFilesChange: (files: File[]) => void;
}

export default function S3Upload({ onFilesChange }: S3UploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

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
                <span className="text-sm">{file.name}</span>
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
        </div>
      )}
    </div>
  );
}
