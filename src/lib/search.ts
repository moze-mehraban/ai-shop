import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// یکسان‌سازی نوشتار فارسی/عربی تا «ي/ی»، «ك/ک»، نیم‌فاصله، اعراب و ارقام مانع پیدا شدن کالا نشوند
const CHAR_MAP: [string, string][] = [
  ["ي", "ی"],
  ["ى", "ی"],
  ["ك", "ک"],
  ["ة", "ه"],
  ["ۀ", "ه"],
  ["أ", "ا"],
  ["إ", "ا"],
  ["آ", "ا"],
  ["ؤ", "و"],
  ["‌", " "], // نیم‌فاصله
  ["‏", ""],
  ["ـ", ""], // کشیده
  ...[..."۰۱۲۳۴۵۶۷۸۹"].map((digit, index): [string, string] => [digit, String(index)]),
  ...[..."٠١٢٣٤٥٦٧٨٩"].map((digit, index): [string, string] => [digit, String(index)]),
];

export function normalizeSearchText(value: string) {
  let text = value.toLowerCase().replace(/[ً-ٰٟ]/g, "");
  for (const [from, to] of CHAR_MAP) text = text.split(from).join(to);
  return text.replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

export function tokenize(query: string) {
  return [...new Set(normalizeSearchText(query).split(" ").filter(Boolean))].slice(0, 8);
}

// همان یکسان‌سازی در SQL برای ستون‌های دیتابیس (SQLite)
function sqlNormalize(expression: string) {
  let sql = `lower(${expression})`;
  for (const [from, to] of CHAR_MAP) {
    sql = `replace(${sql}, '${from}', '${to}')`;
  }
  return sql;
}

const HAYSTACK = sqlNormalize(
  "' ' || p.title || ' ' || coalesce(p.brand, '') || ' ' || c.name || ' ' || coalesce(pc.name, '') || ' ' || coalesce(p.specs, '') || ' ' || coalesce((SELECT group_concat(v.name, ' ') FROM ProductVariant v WHERE v.productId = p.id), '') || ' ' || p.description",
);

// معادل‌های فارسی/انگلیسی و هم‌معنی‌های رایج؛ هر کلمه جستجو با همه اعضای گروهش مطابقت داده می‌شود
const SYNONYM_GROUPS: string[][] = [
  ["iphone", "ایفون"],
  ["apple", "اپل"],
  ["samsung", "سامسونگ", "سامسونک"],
  ["galaxy", "گلکسی", "گلگسی"],
  ["xiaomi", "شیائومی", "شیاومی", "شیامی"],
  ["redmi", "ردمی"],
  ["poco", "پوکو"],
  ["huawei", "هواوی"],
  ["honor", "انر", "آنر"],
  ["nokia", "نوکیا"],
  ["sony", "سونی"],
  ["asus", "ایسوس"],
  ["lenovo", "لنوو"],
  ["anker", "انکر"],
  ["jbl", "جی بی ال"],
  ["airpods", "ایرپاد", "ایرپادز"],
  ["ipad", "ایپد"],
  ["macbook", "مکبوک"],
  ["گوشی", "موبایل", "تلفن همراه", "mobile", "smartphone"],
  ["هدفون", "هندزفری", "هدست", "ایرباد", "headphone", "headphones", "headset", "earbuds", "handsfree"],
  ["لپتاپ", "laptop", "notebook"],
  ["تبلت", "tablet"],
  ["ساعت", "واچ", "watch"],
  ["شارژر", "charger"],
  ["کابل", "cable"],
  ["قاب", "کاور", "case", "cover"],
  ["اسپیکر", "بلندگو", "speaker"],
  ["کیبورد", "keyboard"],
  ["ماوس", "موس", "mouse"],
  ["پاوربانک", "powerbank"],
  ["دوربین", "camera"],
  ["تلویزیون", "tv"],
  ["بیسیم", "wireless"],
].map((group) => group.map(normalizeSearchText));

// گسترش هر کلمه به هم‌معنی‌هایش؛ کلمه نیمه‌تایپ‌شده (۳ حرف به بالا) هم گروهش را پیدا می‌کند
function expandToken(token: string) {
  const alternatives = new Set([token]);
  for (const group of SYNONYM_GROUPS) {
    const hit = group.some((term) => term === token || (token.length >= 3 && term.startsWith(token)));
    if (hit) group.forEach((term) => alternatives.add(term));
  }
  return [...alternatives].filter((term) => term && !term.includes(" "));
}

type Row = { id: string; title: string; brand: string | null; category: string; parentCategory: string | null; stock: number };

function score(row: Row, groups: string[][], phrase: string) {
  const title = normalizeSearchText(row.title);
  const brand = normalizeSearchText(row.brand ?? "");
  const category = normalizeSearchText(`${row.category} ${row.parentCategory ?? ""}`);
  let value = 0;

  if (title === phrase) value += 200;
  else if (title.startsWith(phrase)) value += 120;
  else if (title.includes(phrase)) value += 80;

  for (const alternatives of groups) {
    const [original] = alternatives;
    if (new RegExp(`(^| )${original}`).test(title)) value += 25;
    else if (alternatives.some((term) => title.includes(term))) value += 15;
    if (brand && alternatives.some((term) => brand.includes(term))) value += 15;
    if (alternatives.some((term) => category.includes(term))) value += 8;
  }

  return value + (row.stock > 0 ? 5 : 0);
}

const SELECT_ROWS = Prisma.sql`
  SELECT p.id, p.title, p.brand, c.name AS category, pc.name AS parentCategory, p.stock
  FROM Product p
  JOIN Category c ON c.id = p.categoryId
  LEFT JOIN Category pc ON pc.id = c.parentId
  WHERE p.isActive = 1`;

async function findRows(groups: string[][], mode: "all" | "any") {
  if (groups.length === 0) return [];
  const conditions = groups.map(
    (alternatives) =>
      Prisma.sql`(${Prisma.join(
        alternatives.map((term) => Prisma.sql`${Prisma.raw(HAYSTACK)} LIKE ${`%${term}%`}`),
        " OR ",
      )})`,
  );

  return prisma.$queryRaw<Row[]>`
    ${SELECT_ROWS}
      AND (${Prisma.join(conditions, mode === "all" ? " AND " : " OR ")})
    LIMIT 2000
  `;
}

// فاصله ویرایشی (Levenshtein) برای تحمل غلط تایپی
function editDistance(a: string, b: string) {
  if (a === b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

// کمترین فاصله کلمه جستجو با یک کلمه کالا (کامل یا ابتدای آن، برای کلمات نیمه‌تایپ‌شده)
function closeness(token: string, word: string) {
  let best = editDistance(token, word);
  for (let length = Math.max(1, token.length - 1); length <= token.length + 1; length++) {
    if (length < word.length) best = Math.min(best, editDistance(token, word.slice(0, length)));
  }
  return best;
}

function allowedTypos(token: string) {
  if (token.length <= 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

// جستجوی تقریبی وقتی هیچ تطابق دقیقی پیدا نشد (مثلاً «ipno» یا «ایفن»)
async function fuzzyRows(groups: string[][]) {
  const candidates = await prisma.$queryRaw<Row[]>`${SELECT_ROWS} LIMIT 5000`;

  return candidates
    .map((row) => {
      const words = normalizeSearchText(
        `${row.title} ${row.brand ?? ""} ${row.category} ${row.parentCategory ?? ""}`,
      ).split(" ");
      let matched = 0;
      let distance = 0;
      for (const alternatives of groups) {
        let best = Infinity;
        for (const term of alternatives) {
          for (const word of words) {
            const limit = Math.min(allowedTypos(term), allowedTypos(word));
            const value = closeness(term, word);
            if (value <= limit) best = Math.min(best, value);
          }
        }
        if (best !== Infinity) {
          matched += 1;
          distance += best;
        }
      }
      return { row, matched, distance };
    })
    .filter((item) => item.matched > 0 && item.matched >= Math.ceil(groups.length / 2))
    .sort((a, b) => b.matched - a.matched || a.distance - b.distance)
    .slice(0, 200);
}

/**
 * جستجوی چندکلمه‌ای با رتبه‌بندی:
 * ۱) همه کلمات (با هم‌معنی‌ها)  ۲) حداقل یکی از کلمات  ۳) جستجوی تقریبی برای غلط تایپی.
 * در حالت‌های ۲ و ۳ مقدار approximate برابر true است.
 */
export async function searchProducts(query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { ids: [] as string[], approximate: false, tokens };

  const groups = tokens.map(expandToken);
  const phrase = tokens.join(" ");
  const rank = (rows: Row[]) =>
    rows
      .map((row) => ({ id: row.id, value: score(row, groups, phrase) }))
      .sort((a, b) => b.value - a.value)
      .map((row) => row.id);

  const exact = await findRows(groups, "all");
  if (exact.length > 0) return { ids: rank(exact), approximate: false, tokens };

  if (groups.length > 1) {
    const partial = await findRows(groups, "any");
    if (partial.length > 0) return { ids: rank(partial), approximate: true, tokens };
  }

  // در مرحله تقریبی، غلط تایپی در نام فارسی/انگلیسی برندها هم پذیرفته می‌شود («ایفن» ← ایفون/iphone)
  const fuzzyGroups = tokens.map((token) => {
    const alternatives = new Set(expandToken(token));
    for (const group of SYNONYM_GROUPS) {
      if (group.some((term) => term.length >= 4 && closeness(token, term) <= Math.min(allowedTypos(token), allowedTypos(term)))) {
        group.forEach((term) => alternatives.add(term));
      }
    }
    return [...alternatives].filter((term) => term && !term.includes(" "));
  });
  const fuzzy = await fuzzyRows(fuzzyGroups);
  return { ids: fuzzy.map((item) => item.row.id), approximate: fuzzy.length > 0, tokens };
}
