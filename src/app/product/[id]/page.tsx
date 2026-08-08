import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Star, 
  Sparkles, 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  User 
} from "lucide-react";
import { addReviewAction } from "@/app/actions/reviewActions";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // دریافت اطلاعات محصول به همراه نظرات
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  const session = await getServerSession(authOptions);

  // محاسبه میانگین امتیازات و تحلیل کلی هوش مصنوعی
  const totalReviews = product.reviews.length;
  const averageRating = totalReviews > 0
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  // استخراج نقاط قوت و ضعف از نظرات ثبت‌شده به صورت کاملاً ایمن
  const allStrengths = product.reviews
    .flatMap(r => {
      if (!r.strengths) return [];
      if (typeof r.strengths === 'string') return r.strengths.split(',');
      if (Array.isArray(r.strengths)) return r.strengths;
      return [];
    })
    .map(s => String(s).trim())
    .filter(Boolean);
  
  const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 4);

  const allWeaknesses = product.reviews
    .flatMap(r => {
      if (!r.weaknesses) return [];
      if (typeof r.weaknesses === 'string') return r.weaknesses.split(',');
      if (Array.isArray(r.weaknesses)) return r.weaknesses;
      return [];
    })
    .map(w => String(w).trim())
    .filter(Boolean);
  
  const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 text-slate-800">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* مسیر راهنما (Breadcrumb) */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#ef394e]">فروشگاه</Link>
          <span>/</span>
          <span>{product.category?.name || "محصولات"}</span>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-[200px]">{product.title}</span>
        </div>

        {/* کارت اصلی محصول */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* سمت راست: تصویر محصول */}
          <div className="bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden aspect-square relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Sparkles className="w-12 h-12 text-[#ef394e]" />
                <span className="font-bold text-sm">تصویر اختصاصی AI-Shop</span>
              </div>
            )}
            <span className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{averageRating}</span>
              <span className="text-slate-400 font-normal">({totalReviews} نظر)</span>
            </span>
          </div>

          {/* سمت چپ: اطلاعات و خرید */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h1 className="text-xl md:text-2xl font-black text-slate-900">{product.title}</h1>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{product.description}</p>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ضمانت اصالت و سلامت فیزیکی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#ef394e]" />
                  <span>ارسال سریع هوشمند</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">قیمت مصرف‌کننده:</span>
                <span className="text-lg md:text-xl font-black text-slate-900">
                  {product.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">تومان</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex-1 bg-[#ef394e] hover:bg-[#d82a3f] text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-[#ef394e]/20 text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>افزودن به سبد خرید</span>
                </button>
                <button
                  type="button"
                  className="p-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* بخش تحلیل هوشمند نظرات (AI Review Summary) */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">برآیند هوش مصنوعی از نظرات کاربران</h2>
              <p className="text-xs text-purple-200">تحلیل اتوماتیک نقاط قوت و ضعف بر اساس تجربه خریداران واقعی</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* نقاط قوت */}
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>نقاط قوت پرتکرار</span>
              </h3>
              {uniqueStrengths.length > 0 ? (
                <ul className="space-y-2 text-xs text-purple-100">
                  {uniqueStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-purple-300 italic">هنوز نقطه قوتی ثبت نشده است.</p>
              )}
            </div>

            {/* نقاط ضعف */}
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>نکات قابل بهبود</span>
              </h3>
              {uniqueWeaknesses.length > 0 ? (
                <ul className="space-y-2 text-xs text-purple-100">
                  {uniqueWeaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-purple-300 italic">نقطه ضعف خاصی از سوی خریداران گزارش نشده است.</p>
              )}
            </div>
          </div>
        </div>

        {/* بخش نظرات کاربران و فرم ثبت نظر */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* لیست نظرات (۲ ستون) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <MessageSquare className="w-5 h-5 text-[#ef394e]" />
              <h2 className="font-bold text-slate-900">نظرات کاربران ({totalReviews})</h2>
            </div>

            {product.reviews.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                هنوز نظری برای این محصول ثبت نشده است. اولین نفری باشید که نظر می‌دهد!
              </div>
            ) : (
              <div className="space-y-4">
                {product.reviews.map((review) => {
                  const userName = review.user?.name || review.user?.mobile || "کاربر AI-Shop";
                  // استخراج ایمن محتوای نظر از هر فیلد احتمالی
                  const reviewComment = review.content || (review as any).text || (review as any).body || "بدون متن نظر";

                  return (
                    <div key={review.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800">{userName}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{review.rating}</span>
                        </div>
                      </div>

                      {/* نمایش متن نظر با رنگ کاملاً خوانا */}
                      <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                        {reviewComment}
                      </p>

                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span>{new Date(review.createdAt).toLocaleDateString('fa-IR')}</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${review.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600' : review.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          {review.sentiment === 'POSITIVE' ? 'نظر مثبت' : review.sentiment === 'NEGATIVE' ? 'نظر منفی' : 'خنثی'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* فرم ثبت نظر (۱ ستون) */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-20">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">ثبت نظر درباره کالا</h3>
              
              {session ? (
                <form action={addReviewAction} className="space-y-4 pt-4">
                  <input type="hidden" name="productId" value={product.id} />
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">امتیاز شما (از ۵)</label>
                    <select 
                      name="rating" 
                      defaultValue="5"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-xl focus:bg-white focus:border-[#ef394e] focus:outline-none"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (عالی)</option>
                      <option value="4">⭐⭐⭐⭐ (خوب)</option>
                      <option value="3">⭐⭐⭐ (متوسط)</option>
                      <option value="2">⭐⭐ (ضعیف)</option>
                      <option value="1">⭐ (خیلی بد)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">متن نظر</label>
                    <textarea 
                      name="comment" 
                      rows={4}
                      placeholder="تجربه خود از خرید این محصول را بنویسید..."
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-3 rounded-xl focus:bg-white focus:border-[#ef394e] focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#ef394e] hover:bg-[#d82a3f] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#ef394e]/20 text-xs"
                  >
                    ثبت و ارسال نظر
                  </button>
                </form>
              ) : (
                <div className="pt-4 text-center space-y-3">
                  <p className="text-xs text-slate-500">برای ثبت نظر و استفاده از تحلیل هوش مصنوعی باید وارد حساب کاربری خود شوید.</p>
                  <Link
                    href="/login"
                    className="inline-block w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    ورود به حساب کاربری
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}