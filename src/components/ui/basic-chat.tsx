"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useTrip, Message } from "@/context/TripContext";

interface ChatScreenProps {
  userName: string;
  isSidebar?: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  userName,
  isSidebar = false,
}) => {
  const { setTripData, setIsLoading, initialMessage, setInitialMessage, messages, setMessages, profile } = useTrip();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedInitial = useRef(false);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage = text;
    const loadingId = (Date.now() + 1).toString();
    const msg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      sender: "me",
    };
    
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
    setIsLoading(true);

    try {
      setMessages((prev) => [
        ...prev,
        { id: loadingId, content: "Designing your trip...", sender: "other" },
      ]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages,
          profile: profile
        }),
      });

      const data: { reply?: string; error?: string } = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const replyText = data.reply || "";

      // Extract JSON if present
      let cleanText = replyText;
      const jsonMatch = replyText.match(/```json\n([\s\S]*?)\n```/) || 
                       replyText.match(/```([\s\S]*?)```/) ||
                       replyText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        try {
          const jsonStr = (jsonMatch[1] || jsonMatch[0]).trim();
          const parsedData = JSON.parse(jsonStr);
          setTripData(parsedData);
          cleanText = replyText.replace(jsonMatch[0], "").trim();
        } catch {
          console.error("Failed to parse JSON from AI response.");
        }
      }

      setMessages((prev) => 
        prev.map((m) => 
          m.id === loadingId 
            ? { ...m, content: cleanText || "I've updated your plan based on your request!" } 
            : m
        )
      );
    } catch (error: unknown) {
      console.error("Chat error:", error);
      const message = error instanceof Error ? error.message : "Failed to connect to AI.";
      setMessages((prev) => 
        prev.map((m) => 
          m.id === loadingId || m.content === "Designing your trip..."
            ? { ...m, content: `Error: ${message}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, profile, setIsLoading, setMessages, setTripData]);

  // Handle initial message from landing page
  useEffect(() => {
    if (initialMessage && !processedInitial.current) {
      processedInitial.current = true;
      const msg = initialMessage;
      setInitialMessage(null);
      handleSend(msg);
    }
  }, [handleSend, initialMessage, setInitialMessage]);

  return (
    <div className={`flex flex-col h-full bg-transparent overflow-hidden ${isSidebar ? 'p-0' : 'w-full'}`}>
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto bg-transparent scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "other" && (
              <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-xs shrink-0 border border-zinc-200 dark:border-zinc-700">
                { (userName?.charAt(0) || "V")}
              </div>
            )}

            <div
              className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] break-words shadow-sm transition-all duration-200 ${
                msg.sender === "me"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>

            {msg.sender === "me" && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs shrink-0 shadow-sm">
                M
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:pb-12 bg-transparent z-10">
        <div className="max-w-5xl mx-auto flex gap-3 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl shadow-black/50">
          <Input
            placeholder="Ask for changes, bookings, backups, budget, or logistics..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(newMessage);
            }}
            className="bg-zinc-100 dark:bg-zinc-900 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500 rounded-full h-11 px-5"
          />
          <Button
            onClick={() => handleSend(newMessage)}
            size="icon"
            className="shrink-0 rounded-full w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
