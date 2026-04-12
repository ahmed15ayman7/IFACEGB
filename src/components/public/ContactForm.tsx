"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail, User, MessageSquare, Tag } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("public.contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-center text-[#22c55e] text-sm py-8">{t("success")}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg mx-auto">
      {status === "err" && (
        <p className="text-sm text-[#9C2A2A] bg-[rgba(156,42,42,0.1)] border border-[rgba(156,42,42,0.25)] rounded-lg px-3 py-2">
          {t("error")}
        </p>
      )}
      <div>
        <label className="block text-xs text-[#A8B5C8] mb-1">{t("name")}</label>
        <div className="relative">
          <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.45)]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#A8B5C8] mb-1">{t("email")}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.45)]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#A8B5C8] mb-1">{t("subject")}</label>
        <div className="relative">
          <Tag className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.45)]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#A8B5C8] mb-1">{t("message")}</label>
        <div className="relative">
          <MessageSquare className="absolute start-3 top-3 size-4 text-[#6e7d93]" aria-hidden />
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full ps-10 pe-3 py-2.5 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.45)] resize-y min-h-[120px]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full h-11 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {t("send")}
      </button>
    </form>
  );
}
