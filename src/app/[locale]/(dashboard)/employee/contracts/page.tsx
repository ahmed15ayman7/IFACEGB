import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import { ContractsClient } from "@/components/dashboard/ContractsClient";

export default async function EmployeeContractsPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.employeeContracts");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });

  const contracts = employee
    ? await prisma.electronicContract.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        include: {
          electronicSignatures: { select: { signedAt: true, ipAddress: true } },
        },
      })
    : [];

  const serialized = contracts.map((c) => ({
    ...c,
    signedAt: c.signedAt ? c.signedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    electronicSignatures: c.electronicSignatures.map((s) => ({
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress,
    })),
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <FileText className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("title")}
          </h1>
          <p className="text-xs text-[#6e7d93]">{t("subtitle")}</p>
        </div>
      </div>

      <ContractsClient contracts={serialized} />
    </div>
  );
}
