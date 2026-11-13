import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// تصاویر آپلودشده خارج از public ذخیره می‌شوند تا بعد از build هم در دسترس باشند
// و از مسیر /uploads/<name> توسط route handler سرو می‌شوند.
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function hasValidSignature(bytes: Uint8Array, type: string) {
  const hex = Buffer.from(bytes.slice(0, 12)).toString("hex");
  switch (type) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e47");
    case "image/gif":
      return hex.startsWith("47494638");
    case "image/webp":
      return hex.startsWith("52494646") && hex.slice(16, 24) === "57454250";
    case "image/avif":
      return hex.slice(8, 16) === "66747970";
    default:
      return false;
  }
}

export async function saveUploadedImage(file: File) {
  const extension = ALLOWED_TYPES[file.type];

  if (!extension) {
    throw new Error("فقط فایل‌های JPG، PNG، WEBP، AVIF و GIF مجاز است.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("حجم هر تصویر باید کمتر از ۵ مگابایت باشد.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!hasValidSignature(bytes, file.type)) {
    throw new Error("فایل انتخاب‌شده تصویر معتبر نیست.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  return `/uploads/${name}`;
}

export const UPLOAD_CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([type, extension]) => [extension, type]),
);
