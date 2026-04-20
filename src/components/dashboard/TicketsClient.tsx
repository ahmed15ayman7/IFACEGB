"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TicketPriority, TicketStatus } from "@prisma/client";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  isHierarchyBypass: boolean;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface Props {
  initialTickets: Ticket[];
  namespace: "dashboard.agentPortal" | "dashboard.clientPortal";
  isHierarchyBypass?: boolean;
}

const priorityColor: Record<TicketPriority, string> = {
  low: "bg-gray-500/10 text-gray-400",
  normal: "bg-blue-500/10 text-blue-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const statusColor: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  resolved: "bg-green-500/10 text-green-400",
  closed: "bg-gray-500/10 text-gray-400",
};

export function TicketsClient({ initialTickets, namespace, isHierarchyBypass = false }: Props) {
  const t = useTranslations(namespace);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, priority, isHierarchyBypass }),
      });
      if (!res.ok) throw new Error();
      const { ticket } = await res.json();
      setTickets((prev) => [
        { ...ticket, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt, resolvedAt: null },
        ...prev,
      ]);
      setSubject("");
      setDescription("");
      setPriority("normal");
      setShowForm(false);
    } catch {
      setError(t("ticket_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* New Ticket Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-[#C9A227] text-[#060f1e] text-sm font-medium rounded-lg hover:bg-[#e0b82e] transition-colors"
        >
          {t("tickets_new_btn")}
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.2)] rounded-xl p-5 space-y-4"
        >
          <div>
            <label className="text-[#A8B5C8] text-xs block mb-1">{t("ticket_subject")}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full bg-[rgba(6,15,30,0.6)] border border-[rgba(201,162,39,0.15)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A227]"
            />
          </div>
          <div>
            <label className="text-[#A8B5C8] text-xs block mb-1">{t("ticket_description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full bg-[rgba(6,15,30,0.6)] border border-[rgba(201,162,39,0.15)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A227] resize-none"
            />
          </div>
          <div>
            <label className="text-[#A8B5C8] text-xs block mb-1">{t("ticket_priority")}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="bg-[rgba(6,15,30,0.6)] border border-[rgba(201,162,39,0.15)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A227]"
            >
              <option value="normal">{t("ticket_priority_normal")}</option>
              <option value="high">{t("ticket_priority_high")}</option>
              <option value="critical">{t("ticket_priority_urgent")}</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#C9A227] text-[#060f1e] text-sm font-medium rounded-lg hover:bg-[#e0b82e] disabled:opacity-50 transition-colors"
            >
              {saving ? t("ticket_saving") : t("ticket_save")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-[#6e7d93] text-sm rounded-lg hover:text-[#A8B5C8] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <EmptyState description={t("tickets_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,162,39,0.1)]">
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_subject")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_priority")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_ticket_status")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_date")}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-[rgba(201,162,39,0.06)] ${i % 2 === 0 ? "" : "bg-[rgba(6,15,30,0.3)]"}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{ticket.subject}</p>
                    <p className="text-[#6e7d93] text-xs line-clamp-1">{ticket.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[ticket.status]}`}>
                      {t(`ticket_status_${ticket.status}` as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6e7d93] text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
