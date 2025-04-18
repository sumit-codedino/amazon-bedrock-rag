import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import DataSourceOptions from "../components/DataSourceOptions";
import TextInput from "../components/TextInput";

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

export default function ChatbotForm() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [formData, setFormData] = useState<ChatbotFormData>(defaultFormData);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    router.push("/chatbots");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextInput
          label="Name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter chatbot name"
        />
        <TextInput
          label="Description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter chatbot description"
          isTextArea
        />
        <DataSourceOptions
          selectedSources={formData.dataSources}
          onChange={handleCheckboxChange}
        />
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
  );
}
