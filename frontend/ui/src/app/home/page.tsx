import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to{" "}
            <span className="text-blue-600 dark:text-blue-400">CodeDino</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your AI-powered RAG chatbot for intelligent conversations
          </p>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Description */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Experience the Power of RAG
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced Retrieval-Augmented Generation (RAG) chatbot combines
              the latest in AI technology with your knowledge base to provide
              accurate, context-aware responses.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg
                  className="w-5 h-5 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Context-aware responses
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg
                  className="w-5 h-5 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Real-time knowledge retrieval
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-300">
                <svg
                  className="w-5 h-5 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Secure and private
              </li>
            </ul>
            <Button variant="primary" size="lg">
              Start Chatting
            </Button>
          </div>

          {/* Right Column - Chat Preview */}
          <Card variant="elevated">
            <div className="h-96 flex flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg max-w-[80%]">
                  <p className="text-gray-800 dark:text-gray-200">
                    Hello! How can I help you today?
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg max-w-[80%] ml-auto">
                  <p className="text-gray-800 dark:text-gray-200">
                    Tell me about RAG technology
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg max-w-[80%]">
                  <p className="text-gray-800 dark:text-gray-200">
                    RAG (Retrieval-Augmented Generation) combines the power of
                    large language models with external knowledge retrieval...
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <Button variant="primary" size="sm">
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
