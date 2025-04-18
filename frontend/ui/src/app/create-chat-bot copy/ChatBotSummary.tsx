import { CloudArrowUpIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface ChatBotSummaryProps {
  name: string;
  description: string;
  dataSources: string[];
  s3Files?: File[];
  webUrls?: string[];
}

export default function ChatBotSummary({
  name,
  description,
  dataSources,
  s3Files = [],
  webUrls = [],
}: ChatBotSummaryProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Review Your Chatbot</h3>

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Basic Information
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Name:</span>
              <p className="text-sm text-gray-900 dark:text-white">{name}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Description:</span>
              <p className="text-sm text-gray-900 dark:text-white">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Data Sources
          </h4>
          <div className="space-y-4">
            {dataSources.includes("Amazon S3") && (
              <div>
                <div className="flex items-center mb-2">
                  <CloudArrowUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm font-medium">Amazon S3</span>
                </div>
                {s3Files.length > 0 ? (
                  <ul className="ml-7 space-y-1">
                    {s3Files.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-900 dark:text-white"
                      >
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-7 text-sm text-gray-500 dark:text-gray-400">
                    No files selected
                  </p>
                )}
              </div>
            )}

            {dataSources.includes("Web Crawler") && (
              <div>
                <div className="flex items-center mb-2">
                  <GlobeAltIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm font-medium">Web Crawler</span>
                </div>
                {webUrls.length > 0 ? (
                  <ul className="ml-7 space-y-1">
                    {webUrls.map((url, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-900 dark:text-white"
                      >
                        {url}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-7 text-sm text-gray-500 dark:text-gray-400">
                    No URLs added
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
