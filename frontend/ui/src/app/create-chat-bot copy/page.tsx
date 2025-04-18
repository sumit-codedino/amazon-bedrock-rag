"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import DataSourceOptions from "./DataSourceOptions";
import TextInput from "./TextInput";
import S3Upload from "./S3Upload";
import WebCrawlerConfig from "./WebCrawlerConfig";
import ChatBotSummary from "./ChatBotSummary";

interface ChatbotFormData {
  name: string;
  description: string;
  dataSources: string[];
  s3Files?: File[];
  webUrls?: string[];
}

const defaultFormData: ChatbotFormData = {
  name: "",
  description: "",
  dataSources: [],
  s3Files: [],
  webUrls: [],
};

type Step = "basic-info" | "s3-upload" | "web-crawler" | "review";

export default function CreateChatbotPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [formData, setFormData] = useState<ChatbotFormData>(defaultFormData);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("basic-info");

  // Add validation effect
  useEffect(() => {
    let isValid = false;
    switch (currentStep) {
      case "basic-info":
        isValid =
          formData.name.trim() !== "" && formData.dataSources.length > 0;
        break;
      case "s3-upload":
        isValid = Boolean(formData.s3Files?.length);
        break;
      case "web-crawler":
        isValid = Boolean(formData.webUrls?.length);
        break;
      case "review":
        isValid = true;
        break;
    }
    setIsFormValid(isValid);
  }, [formData, currentStep]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === "review") {
      // TODO: Implement API call to create chatbot
      console.log("Form submitted:", formData);
      router.push("/chatbots");
    } else {
      // Move to next step
      const nextStep = getNextStep();
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  const getNextStep = (): Step | null => {
    const hasS3 = formData.dataSources.includes("Amazon S3");
    const hasWeb = formData.dataSources.includes("Web Crawler");

    switch (currentStep) {
      case "basic-info":
        if (hasS3) return "s3-upload";
        if (hasWeb) return "web-crawler";
        return null;
      case "s3-upload":
        if (hasWeb) return "web-crawler";
        return "review";
      case "web-crawler":
        return "review";
      default:
        return null;
    }
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

  const handleS3FilesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, s3Files: files }));
  };

  const handleWebUrlsChange = (urls: string[]) => {
    setFormData((prev) => ({ ...prev, webUrls: urls }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case "basic-info":
        return (
          <>
            <TextInput
              label="Name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter chatbot name"
              required
            />

            <TextInput
              label="Description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter chatbot description"
            />

            <DataSourceOptions
              selectedSources={formData.dataSources}
              onChange={handleCheckboxChange}
            />
          </>
        );
      case "s3-upload":
        return <S3Upload onFilesChange={handleS3FilesChange} />;
      case "web-crawler":
        return <WebCrawlerConfig onUrlsChange={handleWebUrlsChange} />;
      case "review":
        return (
          <ChatBotSummary
            name={formData.name}
            description={formData.description}
            dataSources={formData.dataSources}
            s3Files={formData.s3Files}
            webUrls={formData.webUrls}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Create New Chatbot
          </h1>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStep()}

              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "basic-info") {
                      router.push("/chatbots");
                    } else {
                      setCurrentStep("basic-info");
                    }
                  }}
                >
                  {currentStep === "basic-info" ? "Cancel" : "Back"}
                </Button>
                <Button type="submit" variant="primary" disabled={!isFormValid}>
                  {currentStep === "review" ? "Create Chatbot" : "Next"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
