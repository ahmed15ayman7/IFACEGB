"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

type Notif = {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string | null;
  bodyEn: string;
  bodyAr: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [fetch_]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("just_now");
    if (m < 60) return t("minutes_ago", { m });
    return t("hours_ago", { h: Math.floor(m / 60) });
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex size-9 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] transition-all hover:border-[rgba(201,162,39,0.45)] hover:text-[#C9A227]"
        aria-label={t("title")}
        aria-expanded={open}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#C9A227] text-[9px] font-bold text-[#060f1e]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={`absolute ${isRtl ? "start-0" : "end-0"} top-full z-50 mt-2 w-80 rounded-2xl border border-[rgba(201,162,39,0.18)] bg-[#060f1e]/98 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-md`}
          >
            <div className="flex items-center justify-between border-b border-[rgba(201,162,39,0.1)] px-4 py-3">
              <p className="text-sm font-semibold text-[#C9A227]">{t("title")}</p>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-[#6e7d93] hover:text-[#C9A227] transition-colors"
                >
                  {t("mark_all_read")}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(201,162,39,0.06)]">
              {notifications.length === 0 ? (
                <EmptyState variant="no_notifications" compact />
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full text-start px-4 py-3 transition-colors hover:bg-[rgba(201,162,39,0.04)] ${!n.isRead ? "bg-[rgba(201,162,39,0.04)]" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#C9A227]" aria-hidden />
                      )}
                      <div className={!n.isRead ? "" : "ms-3.5"}>
                        <p className="text-xs font-semibold text-[#C9A227] line-clamp-1">
                          {isRtl ? (n.titleAr ?? n.titleEn) : n.titleEn}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6e7d93] line-clamp-2">
                          {isRtl ? (n.bodyAr ?? n.bodyEn) : n.bodyEn}
                        </p>
                        <p className="mt-1 text-[10px] text-[#6e7d93] opacity-60">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
