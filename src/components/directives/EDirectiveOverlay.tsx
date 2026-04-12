"use client";

import { useEffect, useState } from "react";

type Directive = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  bodyEn: string;
  bodyAr: string | null;
  priority: string;
};

export function EDirectiveOverlay({ userId, locale }: { userId: string; locale: string }) {
  const [directive, setDirective] = useState<Directive | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const isAr = locale === "ar";

  useEffect(() => {
    async function checkDirectives() {
      try {
        const res = await fetch("/api/directives/pending");
        if (res.ok) {
          const data = await res.json();
          if (data.directive) setDirective(data.directive);
        }
      } catch {
        // fail silently
      }
    }
    checkDirectives();
    const interval = setInterval(checkDirectives, 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  async function signDirective() {
    if (!directive) return;
    setSigning(true);
    try {
      await fetch(`/api/directives/${directive.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setSigned(true);
      setTimeout(() => {
        setDirective(null);
        setSigned(false);
      }, 1500);
    } finally {
      setSigning(false);
    }
  }

  if (!directive) return null;

  const urgentColors = {
    urgent: "border-[#9C2A2A]",
    high: "border-[#e8c84a]",
    normal: "border-[rgba(201,162,39,0.4)]",
    low: "border-[rgba(201,162,39,0.2)]",
  };
  const borderColor = urgentColors[directive.priority as keyof typeof urgentColors] ?? urgentColors.normal;

  return (
    <div className="fixed inset-0 z-[9999] bg-[rgba(4,12,25,0.95)] backdrop-blur-sm flex items-center justify-center px-4">
      <div className={`w-full max-w-lg rounded-2xl bg-[rgba(10,31,61,0.95)] border-2 ${borderColor} p-8 shadow-[0_16px_64px_rgba(0,0,0,0.6)]`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{directive.priority === "urgent" ? "🚨" : "📢"}</span>
          <div>
            <p className="text-[#6e7d93] text-xs uppercase tracking-widest">
              {isAr ? "تعميم رسمي من الإدارة" : "Official Management Directive"}
            </p>
            <h2
              className="text-[#C9A227] text-xl font-bold mt-0.5"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {isAr ? directive.titleAr ?? directive.titleEn : directive.titleEn}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="bg-[rgba(6,15,30,0.6)] rounded-xl border border-[rgba(201,162,39,0.1)] p-5 mb-6 max-h-64 overflow-y-auto">
          <p className="text-[#A8B5C8] text-sm leading-relaxed whitespace-pre-wrap">
            {isAr ? directive.bodyAr ?? directive.bodyEn : directive.bodyEn}
          </p>
        </div>

        {/* Acknowledgment */}
        <div className="border-t border-[rgba(201,162,39,0.1)] pt-5">
          <p className="text-[#6e7d93] text-xs mb-4 text-center">
            {isAr
              ? "يجب عليك قراءة هذا التعميم والموافقة عليه قبل المتابعة. لا يمكن إغلاق هذه النافذة."
              : "You must read and acknowledge this directive before continuing. This overlay cannot be dismissed."}
          </p>
          <button
            onClick={signDirective}
            disabled={signing || signed}
            className="w-full h-11 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: signed ? "#22c55e" : "rgba(201,162,39,0.9)",
              color: "#060f1e",
              opacity: signing ? 0.7 : 1,
            }}
          >
            {signed
              ? (isAr ? "✓ تم التوقيع" : "✓ Acknowledged")
              : signing
              ? (isAr ? "جاري التوقيع..." : "Signing...")
              : (isAr ? "أقر بقراءة هذا التعميم والالتزام به" : "I acknowledge and commit to this directive")}
          </button>
        </div>
      </div>
    </div>
  );
}
