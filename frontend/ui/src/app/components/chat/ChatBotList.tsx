import { ChatBotCard } from "./ChatBotCard";
import { CreateChatBotButton } from "./CreateChatBotButton";

interface ChatBot {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
}

interface ChatBotListProps {
  chatbots: ChatBot[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onChat: (id: string) => void;
}

export const ChatBotList = ({
  chatbots,
  onCreateNew,
  onEdit,
  onDelete,
  onChat,
}: ChatBotListProps) => {
  if (chatbots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No Chatbots Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Create your first chatbot to get started
          </p>
        </div>
        <CreateChatBotButton onClick={onCreateNew} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Your Chatbots
        </h2>
        <CreateChatBotButton onClick={onCreateNew} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.map((chatbot) => (
          <ChatBotCard
            key={chatbot.id}
            name={chatbot.name}
            description={chatbot.description}
            lastUpdated={chatbot.lastUpdated}
            onEdit={() => onEdit(chatbot.id)}
            onDelete={() => onDelete(chatbot.id)}
            onChat={() => onChat(chatbot.id)}
          />
        ))}
      </div>
    </div>
  );
};
