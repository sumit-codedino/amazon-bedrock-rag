"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DataSourceOptions from "./DataSourceOptions";
import S3Upload from "./S3Upload";
import WebCrawlerConfig from "./WebCrawlerConfig";

export default function DataSourcePage() {
  const { id } = useParams();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleSourceSelect = (source: string) => {
    setSelectedSource(source);
  };

  console.log(id);

  const renderDataSourceComponent = () => {
    switch (selectedSource) {
      case "s3":
        return <S3Upload chatBotId={id as string} />;
      case "web":
        return <WebCrawlerConfig chatBotId={id as string} />;
      default:
        return <DataSourceOptions onSelect={handleSourceSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Add Data Source
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose a data source to add to your chatbot
          </p>
        </div>

        {renderDataSourceComponent()}
      </div>
    </div>
  );
}
