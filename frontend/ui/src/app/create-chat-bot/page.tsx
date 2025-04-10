"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

interface ChatbotFormData {
  name: string;
  description: string;
  dataSources: string[];
}

const defaultFormData: ChatbotFormData = {
  name: "",
  description: "",
  dataSources: [],
};

export default function CreateChatbotPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [formData, setFormData] = useState<ChatbotFormData>(defaultFormData);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create chatbot
    console.log("Form submitted:", formData);
    router.push("/chatbots");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "temperature" || name === "maxTokens" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const newDataSources = checked
        ? [...prev.dataSources, value]
        : prev.dataSources.filter((source) => source !== value);
      return { ...prev, dataSources: newDataSources };
    });
  };

  const renderDataSourceOptions = () => (
    <div>
      <label
        htmlFor="dataSources"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Data Sources
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          "Amazon S3",
          "Web Crawler",
          "Custom",
          "Confluence",
          "Salesforce",
          "Sharepoint",
        ].map((source) => (
          <div
            key={source}
            className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <input
              type="checkbox"
              id={source}
              name="dataSources"
              value={source}
              checked={formData.dataSources.includes(source)}
              onChange={handleCheckboxChange}
              className="mr-3"
            />
            <label
              htmlFor={source}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {source}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Create New Chatbot
          </h1>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter chatbot name"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter chatbot description"
                />
              </div>

              {renderDataSourceOptions()}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/chatbots")}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Chatbot
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
