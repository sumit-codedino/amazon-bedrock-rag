import { CloudArrowUpIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface DataSourceOptionsProps {
  selectedSources: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataSourceOptions({
  selectedSources,
  onChange,
}: DataSourceOptionsProps) {
  const sources = [
    { name: "Amazon S3", icon: CloudArrowUpIcon },
    { name: "Web Crawler", icon: GlobeAltIcon },
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
        {sources.map(({ name, icon: Icon }) => (
          <div
            key={name}
            className="flex flex-col items-center justify-center p-6 h-24 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="flex items-center w-full">
              <input
                type="checkbox"
                id={name}
                name="dataSources"
                value={name}
                checked={selectedSources.includes(name)}
                onChange={onChange}
                className="mr-3"
              />
              <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" />
              <label
                htmlFor={name}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {name}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
