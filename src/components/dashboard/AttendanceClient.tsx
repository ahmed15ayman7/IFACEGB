"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion/dashboard";
import { MapPin, Camera, LogIn, LogOut, CheckCircle2, AlertTriangle } from "lucide-react";
import Webcam from "react-webcam";

type TodayAttendance = {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  isGeofenced: boolean;
  lateMinutes: number;
} | null;

export function AttendanceClient({ today }: { today: TodayAttendance }) {
  const t = useTranslations("dashboard.employeeAttendance");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(today?.id ?? null);
  const [checkedIn, setCheckedIn] = useState<boolean>(!!today?.checkIn);
  const [checkedOut, setCheckedOut] = useState<boolean>(!!today?.checkOut);

  const capture = useCallback(() => webcamRef.current?.getScreenshot(), []);

  async function checkIn() {
    setStatus("loading");
    setMessage(null);

    if (!navigator.geolocation) {
      setStatus("error");
      setMessage(t("geo_denied"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const snapshot = capture();
        try {
          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              snapshotNote: snapshot ? "camera_snapshot_captured" : undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setAttendanceId(data.attendance.id);
          setCheckedIn(true);
          setStatus("success");
          setMessage(t("check_in_success"));
          setShowCamera(false);
          router.refresh();
        } catch (err) {
          setStatus("error");
          setMessage(err instanceof Error ? err.message : t("check_error"));
        }
      },
      () => {
        setStatus("error");
        setMessage(t("geo_denied"));
      },
      { timeout: 10000 }
    );
  }

  async function checkOut() {
    if (!attendanceId) return;
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId }),
      });
      if (!res.ok) throw new Error(t("check_error"));
      setCheckedOut(true);
      setStatus("success");
      setMessage(t("check_out_success"));
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("check_error"));
    }
  }

  const canCheckIn = !checkedIn;
  const canCheckOut = checkedIn && !checkedOut;

  return (
    <motion.div {...fadeInUp} className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.6)] p-6 space-y-5">
      <h2 className="text-sm font-semibold text-[#C9A227] flex items-center gap-2">
        <MapPin className="size-4" aria-hidden />
        {t("today_status")}
      </h2>

      {today?.checkIn && (
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-[#22c55e] font-medium">{t("check_in")}: {new Date(today.checkIn).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
          {today.checkOut && <span className="text-[#ef4444] font-medium">{t("check_out")}: {new Date(today.checkOut).toLocaleTimeString(isRtl ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          {today.lateMinutes > 0 && <span className="text-[#f97316]">{t("col_late")}: {today.lateMinutes} min</span>}
          {today.isGeofenced && <span className="text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="size-3" aria-hidden />Geofenced</span>}
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 text-sm ${status === "error" ? "text-red-400" : "text-[#22c55e]"}`}>
          {status === "error" ? <AlertTriangle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
          {message}
        </div>
      )}

      {showCamera && (
        <div className="rounded-xl overflow-hidden border border-[rgba(201,162,39,0.2)] w-fit">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={240}
            height={180}
            className="block"
            mirrored
          />
          <p className="text-[10px] text-[#6e7d93] text-center py-1.5 bg-[rgba(6,15,30,0.8)]">
            {t("camera_hint")}
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {canCheckIn && (
          <>
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="h-9 px-3 rounded-lg border border-[rgba(201,162,39,0.2)] text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1.5 transition-colors"
            >
              <Camera className="size-3.5" aria-hidden />
              {showCamera ? "Hide camera" : "Enable camera"}
            </button>
            <button
              onClick={checkIn}
              disabled={status === "loading"}
              className="h-9 px-5 rounded-lg bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-xs font-semibold text-[#22c55e] hover:bg-[rgba(34,197,94,0.22)] inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <LogIn className="size-3.5" aria-hidden />
              {status === "loading" ? t("checking_in") : t("check_in")}
            </button>
          </>
        )}
        {canCheckOut && (
          <button
            onClick={checkOut}
            disabled={status === "loading"}
            className="h-9 px-5 rounded-lg bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-xs font-semibold text-red-400 hover:bg-[rgba(239,68,68,0.18)] inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <LogOut className="size-3.5" aria-hidden />
            {status === "loading" ? t("checking_out") : t("check_out")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
