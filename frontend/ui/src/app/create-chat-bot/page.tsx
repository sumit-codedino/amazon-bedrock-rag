"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import TextInput from "./TextInput";
import { createChatBot } from "@/apis/create-chat-bot";
import { useDispatch } from "react-redux";
import { addChatBot } from "../store/slices/chatBotListSlice";
import { setChatBot } from "../store/slices/chatBotSlice";
interface ChatbotFormData {
  name: string;
  description: string;
}

const defaultFormData: ChatbotFormData = {
  name: "",
  description: "",
};

export default function CreateChatbotPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { getToken, userId } = useAuth();
  const [formData, setFormData] = useState<ChatbotFormData>(defaultFormData);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsFormValid(
      formData.name.trim() !== "" && formData.description.trim() !== ""
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        router.push("/");
        return;
      }

      const result = await createChatBot({
        name: formData.name,
        description: formData.description,
        userId: userId as string,
        token,
      });

      if (result.isError) {
        setError(result.error || "Failed to create chatbot");
      } else {
        dispatch(
          addChatBot({
            chatBotId: result.chatBotId || "",
            chatBotName: formData.name,
            chatBotDescription: formData.description,
            dataSources: [],
            s3DataSourceId: null,
            webPageDataSourceId: null,
            knowledgeBaseId: null,
            lastUpdatedAt: new Date().toISOString(),
          })
        );
        dispatch(
          setChatBot({
            chatBotId: result.chatBotId || "",
            chatBotName: formData.name,
            chatBotDescription: formData.description,
            dataSources: [],
            s3DataSourceId: null,
            webPageDataSourceId: null,
            knowledgeBaseId: null,
            lastUpdatedAt: new Date().toISOString(),
          })
        );
        router.push(`/chatbot/${result.chatBotId}/data-source`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
              {error && (
                <div className="p-4 text-red-700 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

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
                required
              />

              <div className="flex justify-between space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Chatbot"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
