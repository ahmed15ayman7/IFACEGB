"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Webcam from "react-webcam";
import type { Socket } from "socket.io-client";
import { Eye, Wifi, WifiOff } from "lucide-react";

type Props = {
  sessionToken: string;
  socket: Socket | null;
  proctorScore: number;
};

const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export function ProctoringCamera({ sessionToken, socket, proctorScore }: Props) {
  const t = useTranslations("dashboard.exam");
  const webcamRef = useRef<Webcam>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const sendHeartbeat = useCallback(() => {
    if (!socket || !webcamRef.current || !cameraReady) return;
    const imageData = webcamRef.current.getScreenshot();
    if (!imageData) return;

    setPulsing(true);
    setTimeout(() => setPulsing(false), 800);

    socket.emit("face:heartbeat", { sessionToken, imageData });
  }, [socket, sessionToken, cameraReady]);

  useEffect(() => {
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sendHeartbeat]);

  const ringColor =
    proctorScore >= 95 ? "#22c55e" : proctorScore >= 80 ? "#C9A227" : "#ef4444";

  return (
    <div
      className="fixed bottom-4 end-4 z-50 flex flex-col items-end gap-2"
      aria-label="Proctoring camera"
    >
      <div
        className="relative rounded-xl overflow-hidden border-2 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        style={{
          borderColor: ringColor,
          boxShadow: pulsing ? `0 0 20px ${ringColor}60` : undefined,
          transition: "box-shadow 0.4s ease",
        }}
      >
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={120}
          height={90}
          mirrored
          className="block"
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={() => setCameraReady(false)}
          videoConstraints={{ width: 240, height: 180, facingMode: "user" }}
        />

        <div
          className="absolute inset-0 rounded-lg"
          style={{
            boxShadow: `inset 0 0 ${pulsing ? "16px" : "8px"} ${ringColor}40`,
            transition: "box-shadow 0.4s ease",
          }}
          aria-hidden
        />

        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-0.5 bg-[rgba(6,15,30,0.85)]">
          <span className="text-[9px] font-mono font-bold" style={{ color: ringColor }}>
            {proctorScore}%
          </span>
          {cameraReady ? (
            <Wifi className="size-2.5 text-[#22c55e]" aria-hidden />
          ) : (
            <WifiOff className="size-2.5 text-red-400" aria-hidden />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)]">
        <Eye className="size-2.5 text-[#C9A227]" aria-hidden />
        <span className="text-[9px] font-medium text-[#C9A227]">{t("face_id")}</span>
        <span
          className={`size-1.5 rounded-full ${pulsing ? "animate-ping" : "animate-pulse"}`}
          style={{ background: ringColor }}
          aria-hidden
        />
      </div>
    </div>
  );
}
