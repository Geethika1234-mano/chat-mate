import OpenAI from "openai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const {
      message,
      history = [],
      model = "gpt-4o-mini",
      system = "You are ChatMate, a concise helpful assistant.",
    } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model,
            stream: true,
            messages: [
              { role: "system", content: system },
              ...history,
              { role: "user", content: message },
            ],
          });

          for await (const part of completion) {
            const token = part.choices?.[0]?.delta?.content ?? "";
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (err) {
          controller.enqueue(encoder.encode("\n[stream error]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return new Response(e.message || "error", { status: 500 });
    }
    return new Response("error", { status: 500 });
  }
}
