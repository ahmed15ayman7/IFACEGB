"use client";

import { useState } from "react";

const TARGET_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "sector", label: "Specific Sector" },
  { value: "employee", label: "Specific Employee" },
  { value: "agent", label: "All Agents" },
];

export function EDirectiveComposer({ authorId }: { authorId: string }) {
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!titleEn.trim() || !bodyEn.trim()) return;
    setSending(true);

    await fetch("/api/directives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleEn, titleAr, bodyEn, priority, targetType, authorId }),
    });

    setSent(true);
    setSending(false);
    setTimeout(() => {
      setSent(false);
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
    }, 2000);
  }

  return (
    <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 h-full">
      <h3
        className="text-[#C9A227] font-semibold mb-4 flex items-center gap-2"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <span>📢</span> E-Directive Composer
      </h3>

      <div className="space-y-3">
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          placeholder="Directive title (English)"
          className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)]"
        />
        <input
          type="text"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          placeholder="عنوان التعميم (عربي)"
          dir="rtl"
          className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)]"
        />
        <textarea
          value={bodyEn}
          onChange={(e) => setBodyEn(e.target.value)}
          placeholder="Directive body..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)] resize-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-xs focus:outline-none"
          >
            <option value="low">Low Priority</option>
            <option value="normal">Normal</option>
            <option value="high">High Priority</option>
            <option value="urgent">URGENT</option>
          </select>

          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-xs focus:outline-none"
          >
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={send}
          disabled={sending || !titleEn.trim() || !bodyEn.trim()}
          className="w-full h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: sent ? "#16a34a" : "rgba(201,162,39,0.9)",
            color: "#060f1e",
          }}
        >
          {sent ? "✓ Directive Sent!" : sending ? "Sending..." : "Broadcast Directive"}
        </button>
      </div>
    </div>
  );
}
