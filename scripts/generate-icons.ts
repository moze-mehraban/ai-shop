/**
 * ساخت آیکن‌های سایت و اپلیکیشن (PWA) از لوگو.
 * اجرا: npx tsx scripts/generate-icons.ts
 */
import { Sparkles } from "lucide-react";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

const ROOT = process.cwd();

function logoSvg(size: number, { padding, rounded }: { padding: number; rounded: boolean }) {
  const icon = renderToStaticMarkup(createElement(Sparkles, { size: size - padding * 2, color: "#ffffff", strokeWidth: 1.6 })).replace(
    "<svg ",
    `<svg x="${padding}" y="${padding}" `,
  );
  const radius = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f9845a"/>
        <stop offset="1" stop-color="#bf4f2a"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
    ${icon}
  </svg>`;
}

async function write(file: string, size: number, options: { padding: number; rounded: boolean }) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(logoSvg(size, options))).png().toFile(file);
  console.log("wrote", path.relative(ROOT, file));
}

async function main() {
  // آیکن‌های PWA (maskable با حاشیه امن بیشتر برای برش دایره‌ای اندروید)
  await write(path.join(ROOT, "public/icons/icon-192.png"), 192, { padding: 40, rounded: true });
  await write(path.join(ROOT, "public/icons/icon-512.png"), 512, { padding: 110, rounded: true });
  await write(path.join(ROOT, "public/icons/maskable-512.png"), 512, { padding: 150, rounded: false });
  // آیکن تب مرورگر و آیکن صفحه اصلی iOS (قراردادهای فایل Next.js)
  await write(path.join(ROOT, "src/app/icon.png"), 64, { padding: 12, rounded: true });
  await write(path.join(ROOT, "src/app/apple-icon.png"), 180, { padding: 36, rounded: false });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
