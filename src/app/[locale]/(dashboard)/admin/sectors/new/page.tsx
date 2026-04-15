import { auth } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NewSectorForm from "@/components/dashboard/NewSectorForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.sectors" });
  return { title: t("new_title") };
}

export default async function AdminNewSectorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) redirect(`/${locale}/login`);
  if (!["super_admin", "admin"].includes(session.user.role)) redirect(`/${locale}/dashboard`);

  const t = await getTranslations({ locale, namespace: "dashboard.sectors" });

  return (
    <div className="min-h-screen bg-[#060f1e] text-white px-4 sm:px-6 lg:px-10 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
        <Link
          href={`/${locale}/admin/sectors`}
          className="hover:text-[#C9A227] transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("title")}
        </Link>
        <span>/</span>
        <span className="text-white">{t("add_sector")}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t("new_title")}</h1>
        <p className="text-sm text-white/50 mt-1">{t("new_subtitle")}</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <NewSectorForm />
      </div>
    </div>
  );
}
