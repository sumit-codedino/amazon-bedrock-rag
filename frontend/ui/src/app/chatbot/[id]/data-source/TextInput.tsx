import { useState } from "react";

interface TextInputProps {
  chatbotId: string;
}

export default function TextInput({ chatbotId }: TextInputProps) {
  const [text, setText] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // TODO: Implement text processing using chatbotId
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Add Text Content</h3>
      <div>
        <label
          htmlFor="text-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Enter your text content
        </label>
        <textarea
          id="text-content"
          value={text}
          onChange={handleTextChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Enter your text content here..."
        />
      </div>
    </div>
  );
}
