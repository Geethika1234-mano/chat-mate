"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function ChatBubble({
  role,
  content,
  pulse,
}: {
  role: "user" | "assistant";
  content: string;
  pulse?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 h-8 w-8 flex-none rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
      )}

      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 shadow",
          isUser
            ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
            : "bg-white/90 text-zinc-900",
          pulse ? "animate-pulse" : "",
        ].join(" ")}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code({ inline, children, ...props }: {
                inline?: boolean;
                children?: React.ReactNode;
                className?: string;
              }) {
                return inline ? (
                  <code className="rounded bg-black/10 px-1 py-0.5">{children}</code>
                ) : (
                  <pre className="rounded-lg overflow-x-auto bg-black/10 p-3 my-2 text-sm leading-relaxed">
                    <code>{children}</code>
                  </pre>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
