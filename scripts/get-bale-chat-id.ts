import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type BaleUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
      first_name?: string;
      username?: string;
    };
  };
};

type BaleUpdatesResponse = {
  ok?: boolean;
  result?: BaleUpdate[];
  description?: string;
};

async function main() {
  const token = process.env.BALE_BOT_TOKEN?.trim();

  if (!token) {
    throw new Error("ابتدا BALE_BOT_TOKEN را در فایل .env تنظیم کنید.");
  }

  const response = await fetch(
    `https://tapi.bale.ai/bot${token}/getUpdates`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = (await response.json()) as BaleUpdatesResponse;

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "دریافت پیام‌های ربات ناموفق بود.");
  }

  const chats = Array.from(
    new Map(
      (data.result ?? [])
        .filter((update) => update.message?.chat?.id)
        .map((update) => {
          const chat = update.message!.chat!;
          return [
            String(chat.id),
            {
              id: String(chat.id),
              type: chat.type || "unknown",
              name: chat.first_name || chat.username || "بدون نام",
              lastMessage: update.message?.text || "",
            },
          ];
        }),
    ).values(),
  );

  if (chats.length === 0) {
    console.log(
      "هیچ چتی پیدا نشد. ابتدا در بله وارد بازو شوید و پیام /start را ارسال کنید.",
    );
    return;
  }

  console.table(chats);
  console.log(
    "شناسه موردنظر را در فایل .env به صورت BALE_CHAT_ID=... قرار دهید.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
