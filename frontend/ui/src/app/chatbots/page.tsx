"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ChatBotList } from "../components/chat/ChatBotList";
import { useAppDispatch } from "../store/store";
import { setChatBot } from "../store/slices/chatBotSlice";
import { getAllChatBots } from "../../apis/get-all-chat-bots";
import { setChatBotList } from "../store/slices/chatBotListSlice";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  setUserId,
  setToken,
  setKnowledgeBaseId,
  setS3DataSourceId,
  setWebDataSourceId,
} from "../store/slices/userSlice";
import { ChatBot } from "../type/chatBotList";

export default function ChatBotHomepage() {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const dispatch = useAppDispatch();
  const [chatBots, setChatBots] = useState<ChatBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      dispatch(setUserId(userId as string));
      dispatch(setToken(token as string));
    };
    fetchToken();
  }, [getToken]);

  useEffect(() => {
    const fetchChatBots = async () => {
      if (userId) {
        try {
          setIsLoading(true);
          const response = await getAllChatBots(userId);
          if (response.isError) {
            console.error("Error fetching chatbots:", response.error);
          } else {
            console.log("Chatbots:", response.chatBotDetails);
            setChatBots(response.chatBotDetails || []);
            dispatch(setChatBotList(response.chatBotDetails || []));
            dispatch(setKnowledgeBaseId(response.knowledgeBaseId || ""));
            dispatch(setS3DataSourceId(response.s3DataSourceId || ""));
            dispatch(setWebDataSourceId(response.webDataSourceId || ""));
          }
        } catch (error) {
          console.error("Error fetching chatbots:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchChatBots();
  }, [userId as string]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleCreateNew = () => {
    router.push("/create-chat-bot");
  };

  const handleEdit = (chatbot: ChatBot) => {
    dispatch(setChatBot(chatbot));
    router.push(`/chatbot/${chatbot.chatBotId}/edit`);
  };

  const handleDelete = (chatbot: ChatBot) => {
    // Implement delete functionality
    console.log("Delete chatbot:", chatbot.chatBotId);
  };

  const handleChat = (chatbot: ChatBot) => {
    dispatch(setChatBot(chatbot));
    router.push(`/chatbot/${chatbot.chatBotId}/chat`);
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <ChatBotList
            chatbots={chatBots}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChat={handleChat}
          />
        )}
      </div>
    </div>
  );
}
