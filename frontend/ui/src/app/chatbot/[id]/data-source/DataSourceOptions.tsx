import { CloudArrowUpIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface DataSourceOptionsProps {
  onSelect: (source: string) => void;
}

export default function DataSourceOptions({
  onSelect,
}: DataSourceOptionsProps) {
  const sources = [
    { id: "s3", name: "Amazon S3", icon: CloudArrowUpIcon },
    { id: "web", name: "Web Crawler", icon: GlobeAltIcon },
  ];

  return (
    <div>
      <label
        htmlFor="dataSources"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Data Sources
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
        {sources.map(({ id, name, icon: Icon }) => (
          <div
            key={id}
            onClick={() => onSelect(id)}
            className="flex flex-col items-center justify-center p-6 h-24 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="flex items-center w-full">
              <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
