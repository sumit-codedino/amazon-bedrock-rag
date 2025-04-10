import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface ChatBotCardProps {
  name: string;
  description: string;
  lastUpdated: string;
  onEdit: () => void;
  onDelete: () => void;
  onChat: () => void;
}

export const ChatBotCard = ({
  name,
  description,
  lastUpdated,
  onEdit,
  onDelete,
  onChat,
}: ChatBotCardProps) => {
  return (
    <Card variant="elevated" className="hover:shadow-xl transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" size="sm" onClick={onChat}>
            Chat
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};
