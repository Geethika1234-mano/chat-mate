"use client";

import { useRef, useState } from "react";
import MessageList, { Msg } from "./ui/MessageList";

export default function Home() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m ChatMate. How can I help?" },
  ]);
  const [partial, setPartial] = useState("");
  const [loading, setLoading] = useState(false);

  // Model & system
  const [model, setModel] = useState("gpt-4o-mini");
  const [system, setSystem] = useState(
    "You are ChatMate, a concise helpful assistant."
  );
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/chat/pdf-text", { method: "POST", body: fd });
  const j = await r.json();
  return j.text as string;
}

  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
const [attachedFile, setAttachedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  setAttachedFile(file);

  if (file.type.startsWith("image/")) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  } else {
    setPreviewUrl(null);
  }

  // Optional: upload immediately to backend
  const formData = new FormData();
  formData.append("file", file);
  await fetch("/chat/upload", { method: "POST", body: formData });
}

 async function send() {
  if ((!input.trim() && !attachedFile) || loading) return;

  const userMsg: Msg = { role: "user", content: input.trim() || (attachedFile ? "(file attached)" : "") };
  setChat((c) => [...c, userMsg]);
  setInput("");
  setPartial("");
  setLoading(true);

  const controller = new AbortController();
  controllerRef.current = controller;

  try {
    let imageDataUrl: string | null = null;
    let fileText: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    if (attachedFile) {
      fileName = attachedFile.name;
      fileType = attachedFile.type;

      if (attachedFile.type.startsWith("image/")) {
        imageDataUrl = await fileToDataURL(attachedFile); // e.g. "data:image/png;base64,...."
      } else if (attachedFile.type === "application/pdf") {
        fileText = await extractPdfText(attachedFile); // server extracts text
      } else if (attachedFile.type.startsWith("text/")) {
        fileText = await attachedFile.text();
      }
    }

    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg.content,
        history: chat.map((m) => ({ role: m.role, content: m.content })),
        model,
        system,
        imageDataUrl,   // <-- for vision
        fileText,       // <-- for pdf/txt
        fileName,
        fileType,
      }),
      signal: controller.signal,
    });

    if (!res.body) throw new Error("No response body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accum = "";

    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        accum += chunk;
        setPartial(accum);
      }
    }

    const finalText = accum.trim();
    if (finalText) setChat((c) => [...c, { role: "assistant", content: finalText }]);
    setPartial("");
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      setChat((c) => [...c, { role: "assistant", content: "[Generation stopped]" }]);
    } else {
      setChat((c) => [...c, { role: "assistant", content: "Oops—stream failed." }]);
    }
    setPartial("");
  } finally {
    setLoading(false);
    controllerRef.current = null;
    // clear attachment after send
    setAttachedFile(null);
    setPreviewUrl(null);
    inputRef.current?.focus();
  }
}

  function stop() {
    controllerRef.current?.abort();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100 flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-600" />
          <h1 className="text-xl font-semibold">ChatMate</h1>
        </header>

        {/* Model/System selector */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <label className="text-sm text-zinc-300">Model</label>
          <select
            className="rounded-lg bg-white/10 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
          </select>

          <label className="ml-3 text-sm text-zinc-300">System</label>
          <input
            className="min-w-[200px] flex-1 rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="System prompt (assistant persona)"
          />
        </div>

        {/* Chat container — fixed height area */}
        <section className="h-[75vh] flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          {/* Scrollable message area */}
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={chat} loading={loading} partial={partial} />
          </div>
{attachedFile && (
  <div className="border-t border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="preview"
          className="h-14 w-14 object-cover rounded-lg border border-white/10"
        />
      ) : (
        <div className="text-sm text-zinc-300">
          📄 {attachedFile.name} ({Math.round(attachedFile.size / 1024)} KB)
        </div>
      )}
    </div>
    <button
      onClick={() => {
        setAttachedFile(null);
        setPreviewUrl(null);
      }}
      className="text-sm text-red-400 hover:text-red-300"
    >
      Remove
    </button>
  </div>
)}

          {/* Input bar stays fixed at bottom of container */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur p-3">
           <div className="flex items-center gap-2">
  {/* Upload Button */}
  <label
    htmlFor="file-upload"
    className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition"
    title="Upload file or image"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="w-5 h-5 text-white"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-3.5 3.5M12 4l3.5 3.5M20 20H4" />
    </svg>
  </label>
  <input
    id="file-upload"
    type="file"
    accept="image/*,.pdf,.txt"
    onChange={handleFileUpload}
    className="hidden"
  />

  {/* Text input */}
  <input
    ref={inputRef}
    className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-zinc-100 placeholder:text-zinc-400 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
    placeholder="Type a message and press Enter"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={onKey}
  />

  {/* Send / Stop */}
  {loading ? (
    <button
      onClick={stop}
      className="relative h-10 w-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 transition"
      title="Stop generating"
    >
      <span className="absolute h-3 w-3 rounded-full bg-white animate-pulse" />
    </button>
  ) : (
    <button
      onClick={send}
      disabled={!input.trim() && !attachedFile}
      className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition disabled:opacity-50"
      title="Send message"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 rotate-[-180deg]"
      >
        <path d="M2.25 12l19.5-9-3.75 9 3.75 9-19.5-9z" />
      </svg>
    </button>
  )}
</div>

          </div>
        </section>

        <footer className="mt-3 text-center text-xs text-zinc-400">
          Powered by OpenAI
        </footer>
      </div>
    </main>
  );
}
