// داده‌های نمونه فروشگاه لوازم الکترونیک و کالای دیجیتال (فقط برای نمایش/تست).
// همه شناسه‌ها با demo_ شروع می‌شوند تا با scripts/remove-demo.ts به‌راحتی حذف شوند.

export type DemoIcon =
  | "smartphone"
  | "tablet"
  | "laptop"
  | "watch"
  | "headphones"
  | "headset"
  | "plug-zap"
  | "cable"
  | "battery-charging"
  | "shield"
  | "speaker"
  | "mouse"
  | "keyboard";

export type DemoCategory = {
  id: string;
  name: string;
  slug: string;
  parentSlug: "digital" | "accessories";
  description: string;
  sortOrder: number;
};

export type DemoProduct = {
  id: string;
  category: string; // demo category id, or "mobile" for the existing «تلفن همراه»
  title: string;
  brand: string;
  price: number;
  discountPercent?: number;
  stock?: number; // ignored when variants exist
  icon: DemoIcon;
  colors: string[]; // one image per colour (first = cover)
  description: string;
  specs: [string, string][];
  variants?: { name: string; price?: number; stock: number }[];
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: "demo_cat_tablet", name: "تبلت", slug: "tablet", parentSlug: "digital", description: "تبلت‌های اندروید و آیپد برای کار، تحصیل و سرگرمی.", sortOrder: 2 },
  { id: "demo_cat_laptop", name: "لپ‌تاپ", slug: "laptop", parentSlug: "digital", description: "لپ‌تاپ‌های دانشجویی، اداری و حرفه‌ای از برندهای معتبر.", sortOrder: 3 },
  { id: "demo_cat_wearable", name: "ساعت و مچ‌بند هوشمند", slug: "smart-watch", parentSlug: "digital", description: "ساعت و مچ‌بند هوشمند برای سلامت، ورزش و اعلان‌های گوشی.", sortOrder: 4 },
  { id: "demo_cat_audio", name: "هدفون و هندزفری", slug: "headphones", parentSlug: "accessories", description: "هدفون، هندزفری بلوتوثی و ایرباد با کیفیت صدای بالا.", sortOrder: 1 },
  { id: "demo_cat_charger", name: "شارژر و کابل", slug: "chargers-cables", parentSlug: "accessories", description: "شارژر دیواری فست‌شارژ و کابل‌های USB-C و لایتنینگ.", sortOrder: 2 },
  { id: "demo_cat_powerbank", name: "پاوربانک", slug: "power-bank", parentSlug: "accessories", description: "پاوربانک با ظرفیت‌های مختلف و پشتیبانی از شارژ سریع.", sortOrder: 3 },
  { id: "demo_cat_case", name: "قاب و محافظ گوشی", slug: "phone-cases", parentSlug: "accessories", description: "قاب سیلیکونی، محافظ صفحه و کاور گوشی.", sortOrder: 4 },
  { id: "demo_cat_speaker", name: "اسپیکر بلوتوثی", slug: "speakers", parentSlug: "accessories", description: "اسپیکر قابل حمل و ضدآب برای سفر و مهمانی.", sortOrder: 5 },
  { id: "demo_cat_input", name: "ماوس و کیبورد", slug: "mouse-keyboard", parentSlug: "accessories", description: "ماوس و کیبورد بی‌سیم، اداری و گیمینگ.", sortOrder: 6 },
];

const phoneDesc = (name: string, extra: string) =>
  `${name} یکی از گزینه‌های محبوب بازار در رده قیمتی خودش است. ${extra}\nاین کالا با ضمانت اصالت عرضه می‌شود و پیش از ارسال، سلامت بسته‌بندی آن بررسی می‌شود. در صورت هرگونه سؤال پیش از خرید می‌توانید با پشتیبانی فروشگاه تماس بگیرید.`;

export const DEMO_PRODUCTS: DemoProduct[] = [
  // ---------------- گوشی موبایل ----------------
  {
    id: "demo_p_galaxy_a55", category: "mobile", title: "گوشی موبایل سامسونگ مدل Galaxy A55 5G", brand: "Samsung",
    price: 21900000, discountPercent: 6, icon: "smartphone", colors: ["#1f2937", "#3b82f6"],
    description: phoneDesc("گلکسی A55", "بدنه فلزی، صفحه‌نمایش Super AMOLED با نرخ نوسازی ۱۲۰ هرتز و دوربین ۵۰ مگاپیکسلی با لرزشگیر اپتیکال، آن را به انتخابی متعادل برای استفاده روزمره تبدیل کرده است."),
    specs: [["صفحه‌نمایش", "۶.۶ اینچ Super AMOLED، ۱۲۰ هرتز"], ["پردازنده", "Exynos 1480"], ["حافظه داخلی", "۱۲۸ یا ۲۵۶ گیگابایت"], ["رم", "۸ گیگابایت"], ["دوربین اصلی", "۵۰ مگاپیکسل با OIS"], ["باتری", "۵۰۰۰ میلی‌آمپر ساعت، شارژ ۲۵ وات"], ["اینترنت", "5G"]],
    variants: [{ name: "سرمه‌ای - ۱۲۸ گیگ", stock: 6 }, { name: "آبی یخی - ۲۵۶ گیگ", price: 24500000, stock: 3 }],
  },
  {
    id: "demo_p_redmi_note13", category: "mobile", title: "گوشی موبایل شیائومی مدل Redmi Note 13 Pro", brand: "Xiaomi",
    price: 15800000, icon: "smartphone", colors: ["#111827", "#10b981"],
    description: phoneDesc("ردمی نوت ۱۳ پرو", "دوربین ۲۰۰ مگاپیکسلی، شارژ سریع ۶۷ وات و صفحه‌نمایش AMOLED روشن از نقاط قوت این مدل هستند."),
    specs: [["صفحه‌نمایش", "۶.۶۷ اینچ AMOLED، ۱۲۰ هرتز"], ["پردازنده", "Helio G99 Ultra"], ["حافظه داخلی", "۲۵۶ گیگابایت"], ["رم", "۸ گیگابایت"], ["دوربین اصلی", "۲۰۰ مگاپیکسل"], ["باتری", "۵۰۰۰ میلی‌آمپر ساعت، شارژ ۶۷ وات"]],
    variants: [{ name: "مشکی - ۲۵۶ گیگ", stock: 5 }, { name: "سبز - ۲۵۶ گیگ", stock: 0 }],
  },
  {
    id: "demo_p_iphone15", category: "mobile", title: "گوشی موبایل اپل مدل iPhone 15", brand: "Apple",
    price: 72000000, icon: "smartphone", colors: ["#0f172a", "#f9a8d4"],
    description: phoneDesc("آیفون ۱۵", "داینامیک آیلند، درگاه USB-C و دوربین ۴۸ مگاپیکسلی، تجربه‌ای روان و باکیفیت در اکوسیستم اپل فراهم می‌کنند."),
    specs: [["صفحه‌نمایش", "۶.۱ اینچ Super Retina XDR"], ["پردازنده", "A16 Bionic"], ["حافظه داخلی", "۱۲۸ گیگابایت"], ["دوربین اصلی", "۴۸ مگاپیکسل"], ["درگاه", "USB-C"], ["سیستم‌عامل", "iOS"]],
    variants: [{ name: "مشکی - ۱۲۸ گیگ", stock: 2 }, { name: "صورتی - ۱۲۸ گیگ", stock: 1 }],
  },
  {
    id: "demo_p_galaxy_s24fe", category: "mobile", title: "گوشی موبایل سامسونگ مدل Galaxy S24 FE", brand: "Samsung",
    price: 38500000, discountPercent: 8, icon: "smartphone", colors: ["#6366f1", "#e5e7eb"],
    description: phoneDesc("گلکسی S24 FE", "امکانات هوش مصنوعی Galaxy AI، دوربین سه‌گانه با زوم اپتیکال ۳ برابر و طراحی مقاوم، تجربه پرچمدار را با قیمتی منطقی‌تر ارائه می‌دهد."),
    specs: [["صفحه‌نمایش", "۶.۷ اینچ Dynamic AMOLED 2X"], ["پردازنده", "Exynos 2400e"], ["حافظه داخلی", "۲۵۶ گیگابایت"], ["رم", "۸ گیگابایت"], ["دوربین", "۵۰ + ۱۲ + ۸ مگاپیکسل"], ["باتری", "۴۷۰۰ میلی‌آمپر ساعت"]],
    variants: [{ name: "آبی - ۲۵۶ گیگ", stock: 4 }, { name: "خاکستری - ۲۵۶ گیگ", stock: 2 }],
  },

  // ---------------- تبلت ----------------
  {
    id: "demo_p_tab_a9", category: "demo_cat_tablet", title: "تبلت سامسونگ مدل Galaxy Tab A9 Plus", brand: "Samsung",
    price: 14200000, icon: "tablet", colors: ["#475569"], stock: 7,
    description: "تبلت ۱۱ اینچی سامسونگ با بلندگوهای چهارگانه و صفحه‌نمایش ۹۰ هرتز؛ مناسب کلاس آنلاین، تماشای فیلم و کارهای روزمره.",
    specs: [["صفحه‌نمایش", "۱۱ اینچ، ۹۰ هرتز"], ["حافظه داخلی", "۶۴ گیگابایت"], ["رم", "۴ گیگابایت"], ["باتری", "۷۰۴۰ میلی‌آمپر ساعت"]],
  },
  {
    id: "demo_p_xiaomi_pad6", category: "demo_cat_tablet", title: "تبلت شیائومی مدل Pad 6", brand: "Xiaomi",
    price: 22800000, discountPercent: 5, icon: "tablet", colors: ["#94a3b8", "#1e3a8a"],
    description: "پد ۶ شیائومی با صفحه‌نمایش ۱۴۴ هرتز 2.8K و پردازنده اسنپدراگون ۸۷۰، برای طراحی، بازی و چندوظیفگی گزینه‌ای قدرتمند است.",
    specs: [["صفحه‌نمایش", "۱۱ اینچ 2.8K، ۱۴۴ هرتز"], ["پردازنده", "Snapdragon 870"], ["رم", "۸ گیگابایت"], ["باتری", "۸۸۴۰ میلی‌آمپر ساعت، شارژ ۳۳ وات"]],
    variants: [{ name: "خاکستری - ۲۵۶ گیگ", stock: 3 }, { name: "آبی - ۲۵۶ گیگ", stock: 2 }],
  },

  // ---------------- لپ‌تاپ ----------------
  {
    id: "demo_p_ideapad3", category: "demo_cat_laptop", title: "لپ‌تاپ ۱۵.۶ اینچی لنوو مدل IdeaPad Slim 3", brand: "Lenovo",
    price: 34900000, icon: "laptop", colors: ["#64748b"], stock: 4,
    description: "لپ‌تاپ سبک و کم‌مصرف برای دانشجویان و کارهای اداری، با صفحه‌نمایش Full HD، حافظه SSD سریع و باتری با دوام مناسب برای یک روز کاری.",
    specs: [["پردازنده", "Core i5-12450H"], ["رم", "۱۶ گیگابایت"], ["حافظه", "۵۱۲ گیگابایت SSD"], ["صفحه‌نمایش", "۱۵.۶ اینچ Full HD"], ["وزن", "۱.۶ کیلوگرم"]],
  },
  {
    id: "demo_p_vivobook15", category: "demo_cat_laptop", title: "لپ‌تاپ ۱۵.۶ اینچی ایسوس مدل Vivobook 15", brand: "Asus",
    price: 29500000, discountPercent: 4, icon: "laptop", colors: ["#1e293b"], stock: 5,
    description: "ویووبوک ۱۵ با کیبورد کامل دارای بخش اعداد و لولای ۱۸۰ درجه، گزینه‌ای اقتصادی برای کارهای روزمره و آموزشی است.",
    specs: [["پردازنده", "Core i3-1215U"], ["رم", "۸ گیگابایت"], ["حافظه", "۵۱۲ گیگابایت SSD"], ["صفحه‌نمایش", "۱۵.۶ اینچ Full HD"]],
  },
  {
    id: "demo_p_macbook_air", category: "demo_cat_laptop", title: "لپ‌تاپ ۱۳.۶ اینچی اپل مدل MacBook Air M2", brand: "Apple",
    price: 79000000, icon: "laptop", colors: ["#cbd5e1"], stock: 0,
    description: "مک‌بوک ایر با تراشه M2، بدنه بسیار باریک و بدون فن و عمر باتری تا ۱۸ ساعت؛ مناسب کاربرانی که قابلیت حمل و سکوت برایشان مهم است.",
    specs: [["پردازنده", "Apple M2"], ["رم", "۸ گیگابایت"], ["حافظه", "۲۵۶ گیگابایت SSD"], ["صفحه‌نمایش", "۱۳.۶ اینچ Liquid Retina"], ["وزن", "۱.۲۴ کیلوگرم"]],
  },

  // ---------------- پوشیدنی ----------------
  {
    id: "demo_p_band8", category: "demo_cat_wearable", title: "مچ‌بند هوشمند شیائومی مدل Smart Band 8", brand: "Xiaomi",
    price: 2450000, discountPercent: 10, icon: "watch", colors: ["#111827"], stock: 12,
    description: "پایش ضربان قلب، اکسیژن خون و خواب، بیش از ۱۵۰ حالت ورزشی و باتری تا ۱۶ روز در بدنه‌ای سبک و ضدآب.",
    specs: [["صفحه‌نمایش", "۱.۶۲ اینچ AMOLED"], ["ضدآب", "5ATM"], ["باتری", "تا ۱۶ روز"], ["سازگاری", "اندروید و iOS"]],
  },
  {
    id: "demo_p_watch6", category: "demo_cat_wearable", title: "ساعت هوشمند سامسونگ مدل Galaxy Watch6 40mm", brand: "Samsung",
    price: 12900000, icon: "watch", colors: ["#0f172a", "#fde68a"],
    description: "ساعت هوشمند گلکسی واچ ۶ با سنسور سلامت پیشرفته، صفحه‌نمایش بزرگ‌تر و پشتیبانی از پرداخت و اعلان‌های گوشی.",
    specs: [["اندازه", "۴۰ میلی‌متر"], ["صفحه‌نمایش", "Super AMOLED"], ["ضدآب", "5ATM و IP68"], ["سازگاری", "اندروید"]],
    variants: [{ name: "گرافیتی", stock: 3 }, { name: "طلایی", stock: 2 }],
  },

  // ---------------- هدفون ----------------
  {
    id: "demo_p_sony_xm5", category: "demo_cat_audio", title: "هدفون بی‌سیم سونی مدل WH-1000XM5", brand: "Sony",
    price: 24000000, icon: "headphones", colors: ["#111827", "#e7e5e4"],
    description: "یکی از بهترین هدفون‌های حذف نویز فعال بازار، با کیفیت صدای بسیار بالا، ۳۰ ساعت شارژدهی و میکروفون‌های دقیق برای تماس.",
    specs: [["نوع", "روگوشی، بی‌سیم"], ["حذف نویز", "فعال (ANC)"], ["باتری", "تا ۳۰ ساعت"], ["بلوتوث", "5.2"]],
    variants: [{ name: "مشکی", stock: 2 }, { name: "نقره‌ای", stock: 1 }],
  },
  {
    id: "demo_p_redmi_buds5", category: "demo_cat_audio", title: "هندزفری بلوتوثی شیائومی مدل Redmi Buds 5", brand: "Xiaomi",
    price: 1850000, discountPercent: 12, icon: "headset", colors: ["#f8fafc"], stock: 15,
    description: "ایرباد اقتصادی با حذف نویز فعال تا ۴۶ دسی‌بل، اتصال هم‌زمان به دو دستگاه و تا ۴۰ ساعت شارژدهی با کیس.",
    specs: [["نوع", "داخل گوشی (True Wireless)"], ["حذف نویز", "فعال تا ۴۶ دسی‌بل"], ["باتری", "تا ۴۰ ساعت با کیس"], ["ضدآب", "IP54"]],
  },
  {
    id: "demo_p_airpods_pro2", category: "demo_cat_audio", title: "هندزفری بلوتوثی اپل مدل AirPods Pro 2 USB-C", brand: "Apple",
    price: 13500000, icon: "headset", colors: ["#ffffff"], stock: 3,
    description: "ایرپاد پرو ۲ با حذف نویز تطبیقی، صدای فضایی و کیس شارژ USB-C؛ بهترین همراه برای کاربران آیفون.",
    specs: [["نوع", "داخل گوشی"], ["حذف نویز", "فعال و تطبیقی"], ["باتری", "تا ۳۰ ساعت با کیس"], ["درگاه کیس", "USB-C"]],
  },
  {
    id: "demo_p_qcy_t13", category: "demo_cat_audio", title: "هندزفری بلوتوثی کیو سی وای مدل T13", brand: "QCY",
    price: 790000, icon: "headset", colors: ["#1f2937"], stock: 25,
    description: "هندزفری اقتصادی و پرفروش با چهار میکروفون برای مکالمه واضح و تأخیر کم در بازی.",
    specs: [["نوع", "داخل گوشی"], ["باتری", "تا ۳۰ ساعت با کیس"], ["بلوتوث", "5.1"]],
  },

  // ---------------- شارژر و کابل ----------------
  {
    id: "demo_p_anker_20w", category: "demo_cat_charger", title: "شارژر دیواری انکر ۲۰ وات مدل PowerPort III Nano", brand: "Anker",
    price: 890000, icon: "plug-zap", colors: ["#f8fafc"], stock: 20,
    description: "شارژر فشرده USB-C با پشتیبانی از Power Delivery؛ مناسب شارژ سریع آیفون و گوشی‌های اندرویدی.",
    specs: [["توان", "۲۰ وات"], ["خروجی", "USB-C"], ["پروتکل", "Power Delivery 3.0"]],
  },
  {
    id: "demo_p_baseus_cable", category: "demo_cat_charger", title: "کابل USB-C به USB-C باسئوس طول ۱ متر ۱۰۰ وات", brand: "Baseus",
    price: 245000, discountPercent: 15, icon: "cable", colors: ["#111827"], stock: 40,
    description: "کابل کنفی مقاوم با پشتیبانی از شارژ ۱۰۰ وات و انتقال داده؛ مناسب لپ‌تاپ، تبلت و گوشی.",
    specs: [["طول", "۱ متر"], ["توان", "تا ۱۰۰ وات"], ["جنس روکش", "کنفی"]],
  },
  {
    id: "demo_p_samsung_25w", category: "demo_cat_charger", title: "شارژر دیواری سامسونگ ۲۵ وات مدل EP-TA800", brand: "Samsung",
    price: 1150000, icon: "plug-zap", colors: ["#111827", "#f8fafc"],
    description: "شارژر اصلی سامسونگ با فناوری Super Fast Charging برای گوشی‌های گلکسی.",
    specs: [["توان", "۲۵ وات"], ["خروجی", "USB-C"], ["پروتکل", "PD PPS"]],
    variants: [{ name: "مشکی", stock: 8 }, { name: "سفید", stock: 6 }],
  },

  // ---------------- پاوربانک ----------------
  {
    id: "demo_p_mi_powerbank", category: "demo_cat_powerbank", title: "پاوربانک شیائومی ظرفیت ۲۰۰۰۰ میلی‌آمپر ساعت ۲۲.۵ وات", brand: "Xiaomi",
    price: 1650000, icon: "battery-charging", colors: ["#334155"], stock: 9,
    description: "پاوربانک پرظرفیت با شارژ سریع ۲۲.۵ وات و امکان شارژ هم‌زمان سه دستگاه.",
    specs: [["ظرفیت", "۲۰۰۰۰ میلی‌آمپر ساعت"], ["توان خروجی", "۲۲.۵ وات"], ["درگاه‌ها", "۲ USB-A و ۱ USB-C"]],
  },
  {
    id: "demo_p_anker_powercore", category: "demo_cat_powerbank", title: "پاوربانک انکر مدل PowerCore 10000", brand: "Anker",
    price: 1390000, icon: "battery-charging", colors: ["#0f172a"], stock: 2,
    description: "پاوربانک جمع‌وجور و سبک به اندازه یک کارت بانکی؛ مناسب سفر و همراه همیشگی کیف.",
    specs: [["ظرفیت", "۱۰۰۰۰ میلی‌آمپر ساعت"], ["وزن", "۱۸۰ گرم"]],
  },

  // ---------------- قاب ----------------
  {
    id: "demo_p_iphone15_case", category: "demo_cat_case", title: "قاب سیلیکونی مناسب گوشی iPhone 15", brand: "Generic",
    price: 290000, icon: "shield", colors: ["#f472b6", "#60a5fa", "#111827"],
    description: "قاب سیلیکونی با داخل مخملی که از بدنه گوشی در برابر خط و ضربه محافظت می‌کند.",
    specs: [["سازگاری", "iPhone 15"], ["جنس", "سیلیکون"]],
    variants: [{ name: "صورتی", stock: 10 }, { name: "آبی", stock: 8 }, { name: "مشکی", stock: 12 }],
  },

  // ---------------- اسپیکر ----------------
  {
    id: "demo_p_jbl_flip6", category: "demo_cat_speaker", title: "اسپیکر بلوتوثی جی بی ال مدل Flip 6", brand: "JBL",
    price: 6900000, discountPercent: 7, icon: "speaker", colors: ["#0ea5e9", "#111827"],
    description: "اسپیکر قابل حمل با صدای پرقدرت و باس عمیق، ضدآب و ضدگردوغبار IP67 و تا ۱۲ ساعت پخش.",
    specs: [["توان", "۳۰ وات"], ["ضدآب", "IP67"], ["باتری", "تا ۱۲ ساعت"]],
    variants: [{ name: "آبی", stock: 3 }, { name: "مشکی", stock: 4 }],
  },
  {
    id: "demo_p_soundcore_mini", category: "demo_cat_speaker", title: "اسپیکر بلوتوثی انکر مدل Soundcore Mini 3", brand: "Anker",
    price: 1450000, icon: "speaker", colors: ["#2563eb"], stock: 6,
    description: "اسپیکر کوچک و ضدآب با صدای شفاف؛ مناسب کوهنوردی، دوچرخه‌سواری و میز کار.",
    specs: [["توان", "۶ وات"], ["ضدآب", "IPX7"], ["باتری", "تا ۱۵ ساعت"]],
  },

  // ---------------- ماوس و کیبورد ----------------
  {
    id: "demo_p_m185", category: "demo_cat_input", title: "ماوس بی‌سیم لاجیتک مدل M185", brand: "Logitech",
    price: 690000, icon: "mouse", colors: ["#475569"], stock: 18,
    description: "ماوس بی‌سیم ساده و مطمئن با دانگل USB و عمر باتری تا ۱ سال.",
    specs: [["اتصال", "بی‌سیم ۲.۴ گیگاهرتز"], ["دقت", "۱۰۰۰ DPI"], ["باتری", "تا ۱۲ ماه"]],
  },
  {
    id: "demo_p_mx_keys_mini", category: "demo_cat_input", title: "کیبورد بی‌سیم لاجیتک مدل MX Keys Mini", brand: "Logitech",
    price: 6200000, icon: "keyboard", colors: ["#1f2937"], stock: 3,
    description: "کیبورد جمع‌وجور و حرفه‌ای با نورپردازی هوشمند، اتصال به سه دستگاه و کلیدهای خوش‌دست.",
    specs: [["اتصال", "بلوتوث"], ["نورپردازی", "دارد"], ["شارژ", "USB-C"]],
  },
  {
    id: "demo_p_g102", category: "demo_cat_input", title: "ماوس گیمینگ لاجیتک مدل G102 Lightsync", brand: "Logitech",
    price: 1050000, discountPercent: 10, icon: "mouse", colors: ["#111827", "#f8fafc"],
    description: "ماوس گیمینگ اقتصادی با سنسور ۸۰۰۰ DPI و نورپردازی RGB قابل تنظیم.",
    specs: [["دقت", "تا ۸۰۰۰ DPI"], ["اتصال", "سیم‌دار USB"], ["نورپردازی", "RGB"]],
    variants: [{ name: "مشکی", stock: 7 }, { name: "سفید", stock: 4 }],
  },
];

export const DEMO_USERS = [
  { id: "demo_user_1", name: "سارا احمدی" },
  { id: "demo_user_2", name: "رضا کریمی" },
  { id: "demo_user_3", name: "مریم موسوی" },
];

// [productId, userIndex, rating, text]
export const DEMO_REVIEWS: [string, number, number, string][] = [
  ["demo_p_galaxy_a55", 0, 5, "صفحه‌نمایش خیلی روشن و شارژدهی عالیه. با استفاده معمولی راحت یک روز و نیم کار می‌کنه."],
  ["demo_p_galaxy_a55", 1, 4, "دوربینش در روز عالیه ولی در نور کم کمی نویز داره. در کل برای این قیمت راضی‌ام."],
  ["demo_p_redmi_note13", 2, 4, "شارژ ۶۷ واتش واقعاً سریعه. فقط تبلیغات داخل سیستم‌عامل کمی اذیت می‌کنه."],
  ["demo_p_iphone15", 0, 5, "روان و بی‌نقص. بالاخره USB-C شد و همه کابل‌هام یکی شد."],
  ["demo_p_sony_xm5", 1, 5, "حذف نویزش فوق‌العاده‌ست، توی مترو هیچی نمی‌شنوم. ارزش خریدش رو داره."],
  ["demo_p_sony_xm5", 2, 4, "صدا عالیه ولی برای استفاده طولانی کمی گرم می‌شه."],
  ["demo_p_redmi_buds5", 0, 4, "برای این قیمت حذف نویزش خوبه. اتصال به دو گوشی هم کار رو راحت کرده."],
  ["demo_p_band8", 1, 5, "باتریش واقعاً دو هفته دوام میاره. پایش خوابش هم دقیقه."],
  ["demo_p_mi_powerbank", 2, 4, "ظرفیتش خوبه، گوشی رو حدود ۴ بار شارژ می‌کنه. فقط کمی سنگینه."],
  ["demo_p_jbl_flip6", 0, 5, "صداش برای این اندازه باورنکردنیه. توی سفر عالی بود."],
  ["demo_p_ideapad3", 1, 4, "برای کارهای دانشجویی و برنامه‌نویسی سبک کاملاً کافیه. فقط بلندگوهاش ضعیفه."],
  ["demo_p_anker_20w", 2, 5, "کوچیک و خنک می‌مونه، آیفون رو سریع شارژ می‌کنه."],
  ["demo_p_m185", 0, 4, "ساده و بی‌دردسر. یک ساله با یک باتری کار می‌کنه."],
  ["demo_p_g102", 1, 5, "برای این قیمت بهترین ماوس گیمینگه. نورش هم قشنگه."],
];

// سفارش‌های نمونه (تحویل‌شده) برای پر شدن «پرفروش‌ترین‌ها» و داشبورد
// [userIndex, daysAgo, items: [productId, quantity][]]
export const DEMO_ORDERS: [number, number, [string, number][]][] = [
  [0, 20, [["demo_p_redmi_buds5", 1], ["demo_p_anker_20w", 1]]],
  [1, 18, [["demo_p_galaxy_a55", 1], ["demo_p_iphone15_case", 2]]],
  [2, 15, [["demo_p_qcy_t13", 2], ["demo_p_baseus_cable", 3]]],
  [0, 12, [["demo_p_band8", 1], ["demo_p_redmi_buds5", 1]]],
  [1, 9, [["demo_p_m185", 1], ["demo_p_g102", 1]]],
  [2, 6, [["demo_p_mi_powerbank", 1], ["demo_p_qcy_t13", 1]]],
  [0, 3, [["demo_p_jbl_flip6", 1], ["demo_p_baseus_cable", 1]]],
];
