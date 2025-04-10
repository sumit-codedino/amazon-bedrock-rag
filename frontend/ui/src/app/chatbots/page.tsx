"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { ChatBotList } from "../components/chat/ChatBotList";
import { useAppDispatch } from "../store/store";
import { setUser } from "../store/slices/authSlice";

// Mock data - replace with actual data from your backend
const mockChatbots = [
  {
    id: "1",
    name: "Customer Support Bot",
    description:
      "A chatbot trained on our customer support documentation to help answer common questions.",
    lastUpdated: "2 days ago",
  },
  {
    id: "2",
    name: "Product Knowledge Bot",
    description:
      "Specialized in answering questions about our product features and specifications.",
    lastUpdated: "1 week ago",
  },
];

export default function ChatBotHomepage() {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      console.log(token);
    };
    fetchToken();
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (userId) {
      dispatch(
        setUser({
          id: userId,
          firstName: null, // These will be populated from your backend
          lastName: null,
          email: null,
        })
      );
    }
  }, [userId, dispatch]);

  const handleCreateNew = () => {
    router.push("/create-chat-bot");
  };

  const handleEdit = (id: string) => {
    router.push(`/chatbots/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    // Implement delete functionality
    console.log("Delete chatbot:", id);
  };

  const handleChat = (id: string) => {
    router.push(`/chatbots/${id}/chat`);
  };

  if (!isLoaded || !isSignedIn) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, User!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your chatbots and start new conversations
          </p>
        </div>

        <ChatBotList
          chatbots={mockChatbots}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChat={handleChat}
        />
      </div>
    </div>
  );
}
