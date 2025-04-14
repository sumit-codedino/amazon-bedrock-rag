import { useState } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

interface WebCrawlerConfigProps {
  onUrlsChange: (urls: string[]) => void;
}

export default function WebCrawlerConfig({
  onUrlsChange,
}: WebCrawlerConfigProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

  const handleAddUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      const updatedUrls = [...urls, newUrl.trim()];
      setUrls(updatedUrls);
      onUrlsChange(updatedUrls);
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);
    onUrlsChange(updatedUrls);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Configure Web Crawler</h3>
      <div className="space-y-2">
        <label
          htmlFor="url-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Add URLs to crawl
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="url-input"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </div>

      {urls.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Selected URLs:</h4>
          <ul className="space-y-2">
            {urls.map((url, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center">
                  <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">{url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
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
