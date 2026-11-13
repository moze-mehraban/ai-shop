import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// تصاویر آپلودشده خارج از public ذخیره می‌شوند تا بعد از build هم در دسترس باشند
// و از مسیر /uploads/<name> توسط route handler سرو می‌شوند.
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
// رسیدهای پرداخت جدا و خصوصی نگه داشته می‌شوند (فقط صاحب سفارش و مدیر)
export const RECEIPT_DIR = path.join(UPLOAD_DIR, "receipts");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

// حجم فایل ورودی؛ خروجی بعد از فشرده‌سازی معمولاً چند صد کیلوبایت است
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

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

async function readValidatedImage(file: File) {
  if (!ALLOWED_TYPES[file.type]) {
    throw new Error("فقط فایل‌های JPG، PNG، WEBP، AVIF و GIF مجاز است.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("حجم هر تصویر باید کمتر از ۸ مگابایت باشد.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) {
    throw new Error("فایل انتخاب‌شده تصویر معتبر نیست.");
  }
  return bytes;
}

// تغییر اندازه (حداکثر ضلع maxSize) و تبدیل به WebP؛ چرخش عکس موبایل هم اصلاح می‌شود
async function compress(bytes: Uint8Array, maxSize: number) {
  try {
    return await sharp(bytes, { failOn: "error" })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("فایل انتخاب‌شده تصویر معتبر نیست.");
  }
}

export async function saveUploadedImage(file: File) {
  const bytes = await readValidatedImage(file);
  // GIF متحرک دست‌نخورده ذخیره می‌شود تا انیمیشنش از بین نرود
  const isGif = file.type === "image/gif";
  const output = isGif ? bytes : await compress(bytes, 1600);
  const name = `${randomUUID()}.${isGif ? "gif" : "webp"}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), output);
  return `/uploads/${name}`;
}

// رسید پرداخت: با کیفیت بالاتر برای خوانا ماندن ارقام؛ مسیر فایل (نه آدرس عمومی) برگردانده می‌شود
export async function saveReceiptImage(file: File) {
  const bytes = await readValidatedImage(file);
  const output = await compress(bytes, 2000);
  const name = `${randomUUID()}.webp`;

  await mkdir(RECEIPT_DIR, { recursive: true });
  await writeFile(path.join(RECEIPT_DIR, name), output);
  return name;
}

export const UPLOAD_CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(ALLOWED_TYPES).map(([type, extension]) => [extension, type]),
);
