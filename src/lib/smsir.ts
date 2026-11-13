import "server-only";

type SmsIrApiResponse = {
  status?: number;
  message?: string;
  data?: { messageId?: number; cost?: number } | null;
};

export async function sendSmsIrOtp({
  mobile,
  code,
}: {
  mobile: string;
  code: string;
}) {
  const apiKey = process.env.SMSIR_API_KEY?.trim();
  const templateId = Number(process.env.SMSIR_TEMPLATE_ID?.trim());
  // نام متغیر داخل قالب پیامک در پنل sms.ir (مثلاً #CODE#)
  const paramName = process.env.SMSIR_TEMPLATE_PARAM?.trim() || "CODE";

  if (!apiKey || !Number.isInteger(templateId) || templateId <= 0) {
    throw new Error("SMSIR_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      mobile,
      templateId,
      parameters: [{ name: paramName, value: code }],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const result = (await response.json().catch(() => null)) as
    | SmsIrApiResponse
    | null;

  // در sms.ir مقدار status برابر 1 به معنی ارسال موفق است
  if (!response.ok || result?.status !== 1) {
    throw new Error(result?.message || "SMSIR_SEND_FAILED");
  }

  // هزینه‌ای که خود sms.ir برای این پیامک کم کرده است (برای بررسی تعداد بخش‌های پیامک؛ بدون شماره و کد)
  console.info(
    `[sms.ir] OTP sent · messageId=${result.data?.messageId ?? "?"} · cost=${result.data?.cost ?? "?"}`,
  );
}

// ارسال پیامک با یک قالب دلخواه sms.ir (برای اطلاع‌رسانی سفارش و موجودی).
// اگر شناسه قالب در env تنظیم نشده باشد، پیامک ارسال نمی‌شود و خطایی هم رخ نمی‌دهد.
export async function sendSmsIrTemplate({
  mobile,
  templateEnv,
  parameters,
}: {
  mobile: string;
  templateEnv: string;
  parameters: Record<string, string>;
}) {
  const apiKey = process.env.SMSIR_API_KEY?.trim();
  const templateId = Number(process.env[templateEnv]?.trim());

  if (!apiKey || !Number.isInteger(templateId) || templateId <= 0 || !mobile) {
    return false;
  }

  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId,
        parameters: Object.entries(parameters).map(([name, value]) => ({
          name,
          value,
        })),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await response.json().catch(() => null)) as
      | SmsIrApiResponse
      | null;
    return response.ok && result?.status === 1;
  } catch (error) {
    console.error(
      `SMS (${templateEnv}) failed:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}
