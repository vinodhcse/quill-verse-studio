import React, { useState } from "react";
import { useLLM } from "../context/LLMContext";
import Header from "../components/Header";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  new?: boolean; // For streaming messages
}

// Simple approximation for token count (word count)
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  // This is a very basic approximation. Actual tokens depend on the model's tokenizer.
  return text.split(/\s+/).filter(Boolean).length;
};

// Helper function to convert newlines to <br /> for HTML rendering
const formatContentForHTML = (text: string): string => {
  return text.replace(/\n/g, '<br />');
};

const ChatPage: React.FC = () => {
  const { llm, isReady } = useLLM();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRequestInfo, setLastRequestInfo] = useState<{
    inputTokens: number;
    outputTokens: number;
    timeTaken: number;
  } | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    console.log("Sending message:", input);
    console.log("LLM is ready:", isReady, llm.options);

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setLastRequestInfo(null); // Clear previous request info

    const startTime = performance.now(); // Start timer
    const inputTokens = estimateTokens(input); // Estimate input tokens

    let currentOutputTokens = 0; // To accumulate output tokens during streaming

    try {
      if (!isReady) {
        throw new Error("LLM is not ready yet!");
      }

      // Insert initial empty assistant message for streaming
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", new: true },
      ]);

      llm.generateResponse(input, (partialResult, done) => {
        // Accumulate output tokens
        currentOutputTokens += estimateTokens(partialResult);

        setMessages((prev) => {
          const assistantMessageIndex = prev.findIndex(
            (msg) => msg.new === true
          );

          if (assistantMessageIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[assistantMessageIndex].content += partialResult;
            return updatedMessages;
          }
          return prev;
        });

        if (done) {
          setMessages((prev) => {
            const assistantMessageIndex = prev.findIndex(
              (msg) => msg.new === true
            );

            if (assistantMessageIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[assistantMessageIndex].new = false;
              return updatedMessages;
            }
            return prev;
          });

          const endTime = performance.now(); // End timer
          const timeTaken = endTime - startTime; // Calculate time taken

          setLastRequestInfo({
            inputTokens: inputTokens,
            outputTokens: currentOutputTokens,
            timeTaken: parseFloat((timeTaken/1000).toFixed(2)), // Round to 2 decimal places
          });

          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error generating response." },
      ]);
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-xl ${
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end ml-auto" // Added ml-auto for user messages to align right
                  : "bg-gray-300 text-black self-start mr-auto" // Added mr-auto for assistant messages to align left
              }`}
            >
              {/* Always use dangerouslySetInnerHTML after formatting content */}
              <div dangerouslySetInnerHTML={{ __html: formatContentForHTML(msg.content) }} />
            </div>
          ))}

          {loading && messages.length === 0 && (
            <div className="p-3 rounded-lg bg-gray-300 text-black self-start">
              Generating response...
            </div>
          )}

          {lastRequestInfo && (
            <div className="p-3 rounded-lg bg-yellow-200 text-yellow-800 text-sm mt-4 mx-auto max-w-xl"> {/* Added mx-auto and max-w-xl for centering */}
              <p>
                <strong>Request Info:</strong><br />
                Input Tokens: {lastRequestInfo.inputTokens}<br />
                Output Tokens: {lastRequestInfo.outputTokens}<br />
                Time Taken: {lastRequestInfo.timeTaken} seconds
              </p>
            </div>
          )}
        </div>
        <div className="p-4 bg-white flex">
          <textarea
            className="flex-1 border rounded px-3 py-2 mr-2"
            placeholder="Ask your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !loading && handleSend()} // Add !e.shiftKey to allow multiline input
            rows={3} // Give it some initial height
          />

          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={!isReady || loading} // Disable if not ready or loading
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;