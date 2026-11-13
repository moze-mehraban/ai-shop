import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

// قالب ذخیره: scrypt$<salt hex>$<hash hex>  (رمز عبور هرگز به‌صورت خام ذخیره نمی‌شود)
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// حداقل ۸ کاراکتر، شامل حرف و عدد
export function passwordProblem(password: string) {
  if (password.length < 8) return "رمز عبور باید حداقل ۸ کاراکتر باشد.";
  if (password.length > 128) return "رمز عبور خیلی طولانی است.";
  if (!/\p{L}/u.test(password) || !/[0-9۰-۹]/.test(password)) return "رمز عبور باید هم حرف و هم عدد داشته باشد.";
  return null;
}

// محدودیت تلاش ناموفق برای هر شماره (۵ بار در ۱۵ دقیقه)؛ در حافظه همین سرور
const FAIL_LIMIT = 5;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const globalForAttempts = globalThis as unknown as { __passwordFails?: Map<string, number[]> };
const failures: Map<string, number[]> = (globalForAttempts.__passwordFails ??= new Map<string, number[]>());

export function isPasswordLocked(mobile: string) {
  const recent = (failures.get(mobile) ?? []).filter((time) => Date.now() - time < FAIL_WINDOW_MS);
  failures.set(mobile, recent);
  return recent.length >= FAIL_LIMIT;
}

export function recordPasswordFailure(mobile: string) {
  failures.set(mobile, [...(failures.get(mobile) ?? []), Date.now()]);
}

export function clearPasswordFailures(mobile: string) {
  failures.delete(mobile);
}

// ورود با کد پیامکی در ۱۵ دقیقه اخیر: تنظیم رمز جدید بدون رمز قبلی (فراموشی رمز)
const OTP_RESET_WINDOW_MS = 15 * 60 * 1000;
export function isRecentOtpLogin(session: { authMethod?: string; authAt?: number } | null | undefined) {
  return session?.authMethod === "otp" && typeof session.authAt === "number" && Date.now() - session.authAt < OTP_RESET_WINDOW_MS;
}
