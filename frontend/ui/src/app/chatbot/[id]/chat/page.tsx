"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { useAppDispatch, useAppSelector } from "@/app/store/store";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const chatBotId = useAppSelector((state) => state.chatBot.chatBotId);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const token = await getToken();
    if (!token) {
      router.push("/");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "This is a placeholder response. Replace with actual API call.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages Area - Height calculated to fit remaining space */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ height: "calc(100vh - 9rem)" }}
      >
        <div className="container mx-auto max-w-3xl p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                Start a conversation with your AI assistant
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <p className="p-4">{message.content}</p>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-white dark:bg-gray-800">
                <p className="p-4">Thinking...</p>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed height */}
      <div className="h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="h-full container mx-auto max-w-3xl px-4 flex items-center">
          <form onSubmit={handleSubmit} className="w-full flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!input.trim() || isLoading}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
