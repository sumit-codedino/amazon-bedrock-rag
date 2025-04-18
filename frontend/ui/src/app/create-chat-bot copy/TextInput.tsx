interface TextInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  isTextArea?: boolean;
  required?: boolean;
}

export default function TextInput({
  label,
  id,
  value,
  onChange,
  placeholder,
  isTextArea = false,
  required = true,
}: TextInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        {label}
      </label>
      {isTextArea ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
