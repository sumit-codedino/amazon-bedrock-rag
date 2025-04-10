import { Button } from "../ui/Button";

interface CreateChatBotButtonProps {
  onClick: () => void;
}

export const CreateChatBotButton = ({ onClick }: CreateChatBotButtonProps) => {
  return (
    <Button
      variant="primary"
      size="lg"
      className="flex items-center gap-2"
      onClick={onClick}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
      Create New Chatbot
    </Button>
  );
};
