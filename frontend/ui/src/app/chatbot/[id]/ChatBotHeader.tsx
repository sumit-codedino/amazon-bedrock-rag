"use client";

import { useState } from "react";
import { useAppDispatch } from "@/app/store/store";
import { useRouter, usePathname } from "next/navigation";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface ChatbotHeaderProps {
  chatbotName: string;
  chatbotId: string;
}

export default function ChatbotHeader({
  chatbotName,
  chatbotId,
}: ChatbotHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(chatbotName);

  const isChatPage = pathname.includes("/chat");
  const isDataSourcePage = pathname.includes("/data-source");
  const isEditPage = pathname.includes("/edit");

  const onEdit = () => {
    router.push(`/chatbot/${chatbotId}/edit`);
  };

  const onDelete = () => {
    router.push(`/chatbot/${chatbotId}/delete`);
  };

  const tabs = [
    {
      name: "Chat",
      href: `/chatbot/${chatbotId}/chat`,
      current: isChatPage && !isDataSourcePage,
    },
    {
      name: "Data Source",
      href: `/chatbot/${chatbotId}/data-source`,
      current: isDataSourcePage,
    },
  ];

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement name update
    setIsEditing(false);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {isEditing ? (
              <form
                onSubmit={handleNameSubmit}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(chatbotName);
                  }}
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {chatbotName}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab, index) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    tab.current
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.name}
                  {tab.current && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500" />
                  )}
                </Link>
              ))}
            </div>

            <div className="ml-4 flex items-center space-x-2">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                title="Edit Chatbot"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                title="Delete Chatbot"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
