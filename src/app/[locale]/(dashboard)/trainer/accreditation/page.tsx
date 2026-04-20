import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TrainerAccreditationPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.trainerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "trainer") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const accreditations = await prisma.accreditationRequest.findMany({
    where: { applicantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    expired: "bg-gray-500/10 text-gray-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("accreditation_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("accreditation_subtitle")}</p>
      </div>

      {accreditations.length === 0 ? (
        <EmptyState description={t("accreditation_empty")} />
      ) : (
        <div className="space-y-4">
          {accreditations.map((acc) => (
            <div
              key={acc.id}
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{acc.institutionName}</h3>
                  <p className="text-[#A8B5C8] text-sm">{acc.programName}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    statusColor[acc.status] ?? "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {t(`acc_status_${acc.status}` as Parameters<typeof t>[0])}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[#6e7d93] text-xs">{t("acc_submitted")}</p>
                  <p className="text-[#A8B5C8]">{new Date(acc.createdAt).toLocaleDateString()}</p>
                </div>
                {acc.approvedAt && (
                  <div>
                    <p className="text-[#6e7d93] text-xs">{t("acc_approved")}</p>
                    <p className="text-[#A8B5C8]">{new Date(acc.approvedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {acc.npsScore !== null && (
                  <div>
                    <p className="text-[#6e7d93] text-xs">{t("acc_nps")}</p>
                    <p className="text-[#C9A227] font-bold">{acc.npsScore} / 10</p>
                  </div>
                )}
              </div>
              {acc.reviewNote && (
                <div className="bg-[rgba(6,15,30,0.5)] rounded-lg p-3">
                  <p className="text-[#6e7d93] text-xs mb-1">{t("acc_review_note")}</p>
                  <p className="text-[#A8B5C8] text-sm">{acc.reviewNote}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
