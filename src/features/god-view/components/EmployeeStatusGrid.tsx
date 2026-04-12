type Employee = {
  id: string;
  user: {
    name: string | null;
    role: string;
    presence: { status: string; lastSeen: Date } | null;
  };
  sector: { nameEn: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  online: "#22c55e",
  away: "#f59e0b",
  busy: "#ef4444",
  offline: "#6e7d93",
};

export function EmployeeStatusGrid({ employees }: { employees: Employee[] }) {
  const online = employees.filter((e) => e.user.presence?.status === "online").length;

  return (
    <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
      <h3
        className="text-[#C9A227] font-semibold mb-4 flex items-center justify-between"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <span className="flex items-center gap-2">
          <span>👥</span> Employee Status
        </span>
        <span className="text-xs text-[#6e7d93] font-normal">
          {online} / {employees.length} online
        </span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {employees.map((emp) => {
          const status = emp.user.presence?.status ?? "offline";
          return (
            <div
              key={emp.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[rgba(201,162,39,0.04)] transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: STATUS_COLOR[status] ?? STATUS_COLOR.offline }}
              />
              <div className="min-w-0">
                <p className="text-xs text-[#A8B5C8] truncate font-medium">
                  {emp.user.name ?? "Employee"}
                </p>
                <p className="text-[10px] text-[#6e7d93] truncate">
                  {emp.sector?.nameEn ?? emp.user.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
