"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import S3Upload from "../../../components/s3upload/index";
import WebCrawlerConfig from "./webCrawlerConfig";
import ChatbotHeader from "../ChatBotHeader";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/app/store/store";

type DataSourceType = "s3" | "web";

export default function DataSourcePage() {
  const token = useAppSelector((state) => state.user.token);
  const userId = useAppSelector((state) => state.user.userId);
  const { id } = useParams();
  const [selectedSource, setSelectedSource] = useState<DataSourceType>("s3");
  const [error, setError] = useState<string | null>(null);

  const handleSourceChange = (source: DataSourceType) => {
    setSelectedSource(source);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ChatbotHeader chatbotName="Data Source" chatbotId={id as string} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="space-y-6">
              {error && (
                <div className="p-4 text-red-700 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Select Data Source Type
                </h2>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dataSource"
                      value="s3"
                      checked={selectedSource === "s3"}
                      onChange={() => handleSourceChange("s3")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      File Upload
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dataSource"
                      value="web"
                      checked={selectedSource === "web"}
                      onChange={() => handleSourceChange("web")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Web Crawler
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                {selectedSource === "s3" ? (
                  <S3Upload
                    chatBotId={id as string}
                    userId={userId || ""}
                    token={token || ""}
                    setError={setError}
                  />
                ) : (
                  <WebCrawlerConfig
                    chatBotId={id as string}
                    userId={userId || ""}
                    token={token || ""}
                    setError={setError}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
