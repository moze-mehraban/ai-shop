import { UPLOAD_CONTENT_TYPES, UPLOAD_DIR } from "@/lib/uploads";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // فقط نام فایل‌های تولیدشده توسط سرور (uuid.ext) پذیرفته می‌شود
  const match = /^[0-9a-f-]{36}\.([a-z]+)$/.exec(name);
  const contentType = match ? UPLOAD_CONTENT_TYPES[match[1]] : undefined;

  if (!match || !contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
