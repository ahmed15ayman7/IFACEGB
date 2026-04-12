type KPIs = {
  certsToday: number;
  financialFlow: number;
  activeExams: number;
  activeAgents: number;
  pendingDirectives: number;
  criticalAlerts: number;
};

const KPI_CARDS = [
  { key: "certsToday" as const, label: "Certificates Today", icon: "🏆", color: "#C9A227" },
  { key: "financialFlow" as const, label: "Financial Flow (Coins)", icon: "💰", color: "#e8c84a", format: "coins" },
  { key: "activeExams" as const, label: "Active Exams", icon: "📝", color: "#A8B5C8" },
  { key: "activeAgents" as const, label: "Active Agents", icon: "🌐", color: "#A8B5C8" },
  { key: "pendingDirectives" as const, label: "Pending Directives", icon: "📢", color: "#e8c84a" },
  { key: "criticalAlerts" as const, label: "Critical Alerts (24h)", icon: "🚨", color: "#9C2A2A" },
];

export function GodViewKPIStrip({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPI_CARDS.map((card) => {
        const value = kpis[card.key];
        const display =
          card.format === "coins"
            ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
            : value.toString();

        return (
          <div
            key={card.key}
            className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{card.icon}</span>
              {card.key === "criticalAlerts" && value > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#9C2A2A] animate-pulse" />
              )}
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: card.color, fontFamily: "var(--font-eb-garamond)" }}
              >
                {display}
              </p>
              <p className="text-[#6e7d93] text-xs mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
