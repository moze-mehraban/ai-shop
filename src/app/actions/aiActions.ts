"use server";

export async function generateAiSummary(reviews: string[]) {
  // اگر کامنتی وجود نداشت، نیازی به ریکوست زدن نیست
  if (!reviews || reviews.length === 0) {
    return "برای این محصول هنوز نظرات کافی جهت تحلیل هوش مصنوعی ثبت نشده است.";
  }

  // برای کاهش هزینه، مثلا فقط ۱۰ نظر آخر یا طولانی‌ترین نظرات را ارسال می‌کنیم
  const selectedReviews = reviews.slice(0, 10).join("\n- ");

  const prompt = `شما یک دستیار هوش مصنوعی برای تحلیل نظرات محصولات هستید.
لطفا نظرات زیر را بخوانید و یک خلاصه ۳ الی ۴ خطی، روان و یکپارچه (بدون لیست موردی) از نقاط قوت و ضعف محصول بنویسید. لحن شما باید حرفه‌ای، بی‌طرف و مستقیما رو به خریدار باشد.

نظرات:
- ${selectedReviews}`;

  try {
    // در اینجا می‌توانید از هر API سازگار با OpenAI استفاده کنید
    // کلید API را حتما در فایل .env قرار دهید: AI_API_KEY=your_key
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // یا هر مدل دیگری که استفاده می‌کنید
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
      // کش کردن نتیجه برای ۲۴ ساعت تا برای هر کاربر الکی ریکوست نزنیم
      next: { revalidate: 86400 } 
    });

    if (!response.ok) throw new Error("خطا در دریافت اطلاعات از هوش مصنوعی");

    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error("AI Error:", error);
    return "در حال حاضر امکان پردازش هوشمند نظرات وجود ندارد. لطفا بعدا تلاش کنید.";
  }
}