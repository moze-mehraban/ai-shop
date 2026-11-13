// آدرس اصلی سایت برای sitemap و لینک‌های canonical (در env مقدار SITE_URL را تنظیم کنید)
export function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
