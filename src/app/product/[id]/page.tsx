import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addReviewAction } from "@/app/actions/reviewActions"; // اکشن ثبت نظر
import { 
  Star, 
  ShoppingCart, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  UserCircle2,
  ChevronLeft,
  MessageSquare
} from "lucide-react";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // ۱. دریافت داده‌ها
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const reviewCount = product.reviews.length;
  const averageRating = reviewCount > 0
    ? (product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewCount).toFixed(1)
    : "۰";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir="rtl">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* --- هدر ساده نویگیشن --- */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <Link href="/" className="hover:text-[#ef394e]">خانه</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/products" className="hover:text-[#ef394e]">فروشگاه</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-slate-900 font-bold">{product.title}</span>
        </nav>

        {/* --- بخش اصلی محصول --- */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <img src={product.imageUrl||""} alt={product.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">{product.title}</h1>
            <p className="text-slate-600 mt-4 leading-loose">{product.description}</p>
            
            <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900">{product.price.toLocaleString("fa-IR")} <span className="text-sm font-normal text-slate-500">تومان</span></span>
              <button className="bg-[#ef394e] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#d82a3d]">افزودن به سبد</button>
            </div>
          </div>
        </div>

        {/* --- باکس هوش مصنوعی (فقط اگر ادمین پر کرده باشد) --- */}
        {product.aiSummary && (
          <div className="bg-slate-900 text-white rounded-3xl p-8 flex gap-6 items-center border border-slate-800 shadow-xl">
            <Sparkles className="w-12 h-12 text-amber-400 shrink-0" />
            <div className="space-y-2">
              <h2 className="font-bold text-lg">خلاصه هوشمند نظرات (AI)</h2>
              <p className="text-slate-300 leading-loose">{product.aiSummary}</p>
            </div>
          </div>
        )}

        {/* --- بخش نظرات و فرم ثبت کامنت --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* لیست نظرات */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-[#ef394e]" />
              <h3 className="font-bold text-lg">نظرات کاربران ({reviewCount})</h3>
            </div>
            
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <UserCircle2 className="w-8 h-8 text-slate-300" />
                  <span className="font-bold text-sm">{review.user?.name || "کاربر"}</span>
                  <div className="mr-auto bg-slate-100 px-2 py-1 rounded text-xs font-bold">{review.rating} ⭐</div>
                </div>
                <p className="text-sm text-slate-600 pr-11">{(review as any).content || (review as any).text}</p>
              </div>
            ))}
          </div>

          {/* فرم ثبت نظر */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-4">
              <h3 className="font-bold mb-4">ثبت دیدگاه</h3>
              
              {session ? (
                <form action={addReviewAction} className="space-y-4">
                  <input type="hidden" name="productId" value={product.id} />
                  
                  <select name="rating" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <option value="5">۵ ستاره (عالی)</option>
                    <option value="4">۴ ستاره (خوب)</option>
                    <option value="3">۳ ستاره (متوسط)</option>
                  </select>
                  
                  <textarea 
                    name="comment" 
                    required 
                    placeholder="تجربه خرید خود را بنویسید..."
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 h-32"
                  ></textarea>
                  
                  <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold">ثبت نظر</button>
                </form>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl">
                  <p className="text-sm text-slate-500 mb-4">برای ثبت نظر وارد شوید</p>
                  <Link href="/login" className="bg-[#ef394e] text-white px-6 py-2 rounded-xl font-bold">ورود به حساب</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}