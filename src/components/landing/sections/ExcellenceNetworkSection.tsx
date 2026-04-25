"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExcellenceBoardCard } from "./ExcellenceBoardCard";

type Tier = "legend" | "platinum" | "gold" | "silver" | "bronze";

export interface NetworkBoardData {
  name: string;
  nameAr: string | null;
  subtitle: string;
  subtitleAr: string | null;
  kickerPoints: number;
  mode: "rank" | "avatar";
  avatarUrl: string | null;
  /** Always three display values, order matches the section’s metric definitions */
  metrics: { value: string }[];
}

export interface ExcellenceNetworkData {
  agent: NetworkBoardData | null;
  center: NetworkBoardData | null;
  trainer: NetworkBoardData | null;
}

interface ExcellenceNetworkSectionProps {
  data: ExcellenceNetworkData;
}

const BADGE_KEYS = ["agent_badge", "center_badge", "trainer_badge"] as const;
const NO_DATA_KEYS = ["no_agent", "no_center", "no_trainer"] as const;

function metricLabels(
  t: (k: string) => string,
  tEom: (k: string) => string,
  key: "agent" | "center" | "trainer",
): [string, string, string] {
  if (key === "agent") {
    return [t("kpi_agent_m1"), t("kpi_agent_m2"), t("kpi_agent_m3")];
  }
  if (key === "center") {
    return [t("kpi_center_m1"), t("kpi_center_m2"), t("kpi_center_m3")];
  }
  return [tEom("kpi_projects"), tEom("kpi_activity"), tEom("kpi_rating")];
}

export function ExcellenceNetworkSection({ data }: ExcellenceNetworkSectionProps) {
  const t = useTranslations("landing.eom_network");
  const tEom = useTranslations("landing.eom");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const list: { key: "agent" | "center" | "trainer"; board: NetworkBoardData | null }[] = [
    { key: "agent", board: data.agent },
    { key: "center", board: data.center },
    { key: "trainer", board: data.trainer },
  ];

  const tierLabel = (k: Tier) => tEom(k);

  return (
    <div className="mt-14 pt-10 border-t border-[#1E293B]">
      <div className="text-center mb-8">
        <span className="text-[#C9A227] text-xs font-semibold uppercase tracking-widest mb-2 block">
          {t("kicker")}
        </span>
        <h3 className="text-xl md:text-2xl font-bold text-white" dir={isRTL ? "rtl" : "ltr"}>
          {t("title")}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {list.map((item, index) => {
          const { key, board } = item;
          const i = index;
          if (!board) {
            return (
              <div
                key={key}
                className="rounded-2xl border border-dashed border-[#334155] bg-[#0A0F1A]/50 p-6 flex items-center justify-center min-h-[280px]"
              >
                <p className="text-[#64748B] text-sm text-center" dir={isRTL ? "rtl" : "ltr"}>
                  {t(NO_DATA_KEYS[i])}
                </p>
              </div>
            );
          }
          const displayName = isRTL && board.nameAr ? board.nameAr : board.name;
          const displaySubtitle = isRTL && board.subtitleAr ? board.subtitleAr : board.subtitle;
          const nameInitial = (
            (isRTL && board.nameAr ? board.nameAr : board.name) ||
            (board.name || "?")
          )
            .trim()
            .charAt(0) || "?";
          const labels = metricLabels(t, tEom, key);
          const metrics = [0, 1, 2].map((j) => ({
            value: board.metrics[j]?.value ?? "—",
            label: labels[j] ?? "—",
          }));
          return (
            <ExcellenceBoardCard
              key={key}
              badge={t(BADGE_KEYS[i])}
              name={displayName}
              subtitle={displaySubtitle}
              kickerPoints={board.kickerPoints}
              tierLabel={tierLabel}
              mode={board.mode}
              avatarUrl={board.avatarUrl}
              nameInitial={nameInitial}
              isRTL={isRTL}
              metrics={metrics}
              motionDelay={0.05 * index}
            />
          );
        })}
      </div>
    </div>
  );
}
