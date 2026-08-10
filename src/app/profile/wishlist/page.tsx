import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import Image from "next/image";
import { getDiscountedPrice } from "@/lib/pricing";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // دریافت لیست علاقه‌مندی‌های کاربر همراه با اطلاعات کامل محصولات
  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
      <main className="max-w-4xl mx-auto space-y-6 py-8 px-4">
        
        {/* هدر صفحه */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 p-3 rounded-xl text-rose-500">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">فهرست علاقه‌مندی‌ها</h1>
              <p className="text-xs text-slate-500">محصولاتی که ذخیره کرده‌اید</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#ef394e] transition-colors"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* لیست علاقه‌مندی‌ها */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-800">لیست علاقه‌مندی‌های شما خالی است</h2>
              <p className="text-xs text-slate-500">می‌توانید محصولات مورد علاقه خود را ذخیره کنید.</p>
            </div>
            <Link
              href="/"
              className="inline-block bg-[#ef394e] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-[#ef394e]/20 hover:bg-[#d82a3f] transition-colors"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishlistItems.map((item) => {
              const product = item.product;
              const finalPrice = getDiscountedPrice(
                product.price,
                product.discountPercent,
              );
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          width={80}
                          height={80}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>AI</span>
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{product.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                      <div className="pt-2 font-bold text-slate-900 text-xs">
                        {finalPrice.toLocaleString("fa-IR")} تومان
                        {product.discountPercent > 0 && (
                          <span className="mr-2 rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-600">
                            {product.discountPercent.toLocaleString("fa-IR")}٪
                            تخفیف
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                    >
                      مشاهده کالا
                    </Link>
                    <WishlistButton
                      productId={product.id}
                      initialWishlisted
                      variant="remove"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
  );
}
