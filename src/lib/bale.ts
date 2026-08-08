import "server-only";

type BaleApiResponse = {
  ok?: boolean;
  description?: string;
};

export async function sendBaleOtp({
  mobile,
  code,
}: {
  mobile: string;
  code: string;
}) {
  const token = process.env.BALE_BOT_TOKEN?.trim();
  const chatId = process.env.BALE_CHAT_ID?.trim();

  if (!token || !chatId) {
    throw new Error("BALE_NOT_CONFIGURED");
  }

  const response = await fetch(
    `https://tapi.bale.ai/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: [
          "🔐 کد ورود AI-Shop",
          "",
          `شماره درخواست‌کننده: ${mobile}`,
          `کد تایید: ${code}`,
          "اعتبار کد: ۲ دقیقه",
          "",
          "این کد را در اختیار دیگران قرار ندهید.",
        ].join("\n"),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  const result = (await response.json().catch(() => null)) as
    | BaleApiResponse
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(result?.description || "BALE_SEND_FAILED");
  }
}
