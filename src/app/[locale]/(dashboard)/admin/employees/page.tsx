import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Link from "next/link";

export default async function AdminEmployeesPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const employees = await prisma.employee.findMany({
    include: {
      user: { select: { name: true, email: true, role: true, isActive: true, lastLoginAt: true } },
      sector: { select: { nameEn: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          HR Admin — Employees
        </h1>
        <Link
          href={`/${locale}/admin/employees/new`}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-[rgba(201,162,39,0.9)] text-[#060f1e] hover:bg-[#C9A227] flex items-center gap-2"
        >
          ➕ Add Employee
        </Link>
      </div>

      <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
              {["Name", "Email", "Role", "Sector", "Profit Share", "Status", "Last Login", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                <td className="px-4 py-3 text-[#A8B5C8] font-medium">{emp.user.name ?? "—"}</td>
                <td className="px-4 py-3 text-[#6e7d93] text-xs">{emp.user.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs border border-[rgba(201,162,39,0.2)] text-[#C9A227]">
                    {emp.user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6e7d93] text-xs">{emp.sector?.nameEn ?? "—"}</td>
                <td className="px-4 py-3 text-[#C9A227] text-xs font-mono">{Number(emp.profitSharePct).toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <span
                    className="w-2 h-2 rounded-full inline-block mr-1.5"
                    style={{ background: emp.user.isActive ? "#22c55e" : "#9C2A2A" }}
                  />
                  <span className="text-xs text-[#6e7d93]">{emp.user.isActive ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-4 py-3 text-[#6e7d93] text-xs">
                  {emp.user.lastLoginAt ? new Date(emp.user.lastLoginAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/${locale}/admin/employees/${emp.id}`}
                      className="h-7 px-2 text-xs rounded border border-[rgba(201,162,39,0.2)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] flex items-center"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[#6e7d93]">No employees found. Add your first employee.</p>
          </div>
        )}
      </div>
    </div>
  );
}
