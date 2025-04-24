import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { setS3DataSourceId } from "@/app/store/slices/userSlice";
import { createDataSource } from "@/apis/create-data-source";
import { startIngestion } from "@/apis/start-ingestion";
import FileUploader from "./components/FileUploader";
import FileList from "./components/FileList";
import UploadProgress from "./components/UploadProgress";
import { File } from "./types";

interface S3UploadProps {
  chatBotId: string;
  userId: string;
  token: string;
  setError: (error: string) => void;
}

export default function S3Upload({
  chatBotId,
  userId,
  token,
  setError,
}: S3UploadProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const s3DataSourceId = useAppSelector((state) => state.user.s3DataSourceId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = async () => {
    if (!token) {
      throw new Error("Authentication required");
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const uploadPromises = files.map(async (file, index) => {
        if (file.status === "error") {
          return;
        }
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

      let dataSourceId = s3DataSourceId;
      if (!dataSourceId) {
        const response = await createDataSource({
          chatBotId,
          dataSourceType: "s3",
          userId: userId || "",
          token,
        });
        if (response.isError) {
          throw new Error(response.error);
        }
        dataSourceId = response.dataSourceId || "";
        dispatch(setS3DataSourceId(dataSourceId));
      }

      await startIngestion({
        userId: userId || "",
        dataSourceId: dataSourceId,
        dataSourceType: "s3",
        token,
      });

      router.push(`/chatbot/${chatBotId}/chat`);
    } catch (error) {
      console.error("Upload error:", error);
      // Handle error appropriately
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Upload Files</h3>
      <FileUploader
        onFilesSelected={setFiles}
        chatBotId={chatBotId}
        token={token}
        existingFiles={files}
      />
      <FileList
        files={files}
        onRemoveFile={(index) => {
          setFiles((prev) => prev.filter((_, i) => i !== index));
        }}
      />
      <UploadProgress
        files={files}
        isUploading={isUploading}
        onUpload={handleUpload}
      />
    </div>
  );
}
