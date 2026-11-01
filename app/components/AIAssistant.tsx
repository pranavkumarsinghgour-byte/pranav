
"use client";

import { useState } from "react";
import {
  Bot,
  X,
  Send,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! Welcome to Manufacturing ERP AI Assistant. I can help you with website operations, production, inventory, stores, quality, maintenance and general questions. What would you like to know?",
    },
  ]);

  async function sendMessage(text?: string) {
    const question = (text ?? message).trim();

    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
      });

      const responseText = await response.text();

      let data: { reply?: string; error?: string };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Invalid server response. HTTP status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an answer.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply || "No answer was returned.",
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100]">

      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[370px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between bg-[#101b35] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-2">
                <Bot size={21} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Manufacturing AI Assistant
                </p>
                <p className="text-xs text-blue-200">
                  Your ERP Help Desk
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-lg bg-white p-3 text-xs text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                AI is preparing your answer...
              </div>
            )}
          </div>

          {/* Suggestions and input */}
          <div className="border-t border-slate-200 bg-white p-3">

            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "How to use ERP?",
                "Production help",
                "Inventory help",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => sendMessage(item)}
                  disabled={loading}
                  className="rounded-full border border-blue-200 px-2.5 py-1.5 text-[10px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask anything..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="rounded-xl bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              <Sparkles size={11} className="mr-1 inline" />
              Powered by AI
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((previous) => !previous)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={25} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
}
