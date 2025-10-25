"use client";
import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
export type Msg = { role: "user" | "assistant"; content: string };

export default function MessageList({
  messages,
  loading,
  partial,
}: {
  messages: Msg[];
  loading?: boolean;
  partial?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, partial]);

  return (
    <div
      ref={ref}
      className="h-full min-h-[250px] w-full overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4
                 scrollbar-thin scrollbar-thumb-zinc-700/70 scrollbar-track-transparent"
    >
      {messages.map((m, i) => (
        <ChatBubble key={i} role={m.role} content={m.content} />
      ))}
      {!!partial && <ChatBubble role="assistant" content={partial} pulse />}
      {loading && !partial && <ChatBubble role="assistant" content="typing…" pulse />}
    </div>
  );
}
