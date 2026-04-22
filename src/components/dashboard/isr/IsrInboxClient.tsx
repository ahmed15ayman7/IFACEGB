"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion/dashboard";
import { IsrCard } from "./IsrCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon, SendHorizonal } from "lucide-react";

type IsrItem = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  priority: string;
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  requester: { name: string | null; nameAr: string | null };
  sector: { nameEn: string; nameAr: string | null } | null;
};

type Props = {
  inbox: IsrItem[];
  sent: IsrItem[];
  readOnly?: boolean;
};

export function IsrInboxClient({ inbox: initialInbox, sent: initialSent, readOnly = false }: Props) {
  const t = useTranslations("dashboard.isr");
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [inbox, setInbox] = useState(initialInbox);
  const [sent] = useState(initialSent);

  const handleAction = useCallback(async (id: string, status: string) => {
    await fetch(`/api/isr/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setInbox((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const items = activeTab === "inbox" ? inbox : sent;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 rounded-xl bg-[rgba(6,15,30,0.6)] border border-[rgba(201,162,39,0.1)] w-fit">
        {(["inbox", "sent"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-[rgba(201,162,39,0.18)] text-[#C9A227]"
                : "text-[#6e7d93] hover:text-[#A8B5C8]"
            }`}
          >
            {t(`tab_${tab}`)}
            <span className="ms-1.5 text-[10px] opacity-60">
              ({tab === "inbox" ? inbox.length : sent.length})
            </span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          variant="no_records"
          icon={activeTab === "inbox" ? InboxIcon : SendHorizonal}
          title={t(activeTab === "inbox" ? "empty_inbox" : "empty_sent")}
        />
      ) : (
        <motion.div {...staggerContainer} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <IsrCard
              key={item.id}
              {...item}
              direction={activeTab}
              onAction={!readOnly && activeTab === "inbox" ? handleAction : undefined}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
