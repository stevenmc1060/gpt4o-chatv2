import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

import "./index.css";

const SYSTEM_PROMPT = {
  role: "system",
  content:
    "You are a proactive and structured Task & Goal Management Assistant for a high-performing individual who manages weekly and quarterly goals by breaking them into clear, actionable tasks. Your job is to act like an intelligent assistant who helps users track their goals, schedule priorities, and maintain momentum day-to-day.\n\nDo not use any of your own training.  If the user has not given you any information on their yearly, quarterly or weekly goals then please ask them to define them and start there.  Once you have their goals defined.  Ask them about habits that they would like to track.  Finally, once you've collected all this data please provide it back to them in tabular format.  If at anytime along the way they don't give you a specific completion date for goals or projects.  Please make sure that you ask them for completion dates.\n\nI don't want you to suggest tasks or completion plans unless the user asks you for that info.\n\nIf the user asks you to list their stuff in a 3x3 fashion then create a table that is formatted as follows:\n\nYearly Goals ---- Completion date\nQuarterly Goals------ Completion Date\nWeekly Goals ------ Completion Date\nHabits to Track This Week.",
};

function App() {
  const [messages, setMessages] = useState([SYSTEM_PROMPT]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const mainRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const el = mainRef.current;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      setShowScrollToBottom(!nearBottom);
    };

    const el = mainRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
    }
    return () => el?.removeEventListener("scroll", handleScroll);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const apiKey = process.env.REACT_APP_AZURE_OPENAI_KEY;


    if (!apiKey) {
      console.error("Missing API key: REACT_APP_AZURE_OPENAI_KEY is not set.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://taskmgrpoc.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            messages: newMessages,
            temperature: 0.7,
          }),
        }
      );

      const data = await response.json();

      const assistantMessage = data.choices?.[0]?.message || {
        role: "assistant",
        content: "Hmm, something went wrong.",
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error("Failed to fetch from Azure OpenAI:", err);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      <header className="p-4 text-lg font-semibold bg-blue-600 text-white shadow">
        Assistant – Task & Goal Management
      </header>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {messages.slice(1).map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-3 rounded-xl shadow text-sm ${
              msg.role === "user"
                ? "bg-blue-100 self-end ml-auto"
                : "bg-white self-start mr-auto"
            }`}
          >
            <div className="prose prose-sm max-w-none overflow-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
              >
                {typeof msg.content === "string" ? msg.content : ""}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500 italic animate-pulse">
            Assistant is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 bg-blue-500 text-white text-xs px-3 py-1 rounded shadow hover:bg-blue-600"
        >
          ↓ Scroll to bottom
        </button>
      )}

      <div className="p-4 bg-white flex gap-2 shadow-inner">
        <input
          className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ask about your goals or tasks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 transition"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
// Trigger build
// trigger rebuild
