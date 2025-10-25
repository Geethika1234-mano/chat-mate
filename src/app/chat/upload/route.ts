import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // In production, upload to S3 or similar and return URL.
    // For now, just read file metadata.
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({
      name: file.name,
      type: file.type,
      size: file.size,
      base64: base64.slice(0, 200) + "...", // only show first chunk
    });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
