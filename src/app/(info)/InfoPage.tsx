import DigikalaHeader from "@/components/DigikalaHeader";
import SiteFooter from "@/components/SiteFooter";

export default function InfoPage({
  title,
  content,
  children,
}: {
  title: string;
  content?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <DigikalaHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="card rounded-3xl p-6 md:p-10">
          <h1 className="section-title mb-6 text-2xl">{title}</h1>
          {content ? (
            <div className="space-y-4 text-sm leading-8 whitespace-pre-line text-slate-700">{content}</div>
          ) : (
            !children && <p className="text-sm text-slate-500">محتوای این صفحه به‌زودی تکمیل می‌شود.</p>
          )}
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
