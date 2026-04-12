"use client";

import { useEffect, createContext, useContext, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGodViewStore, useNotificationStore, useSocketStore } from "@/store";

const SocketContext = createContext<Socket | null>(null);

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

export function SocketProvider({
  children,
  userId,
  role,
  sectorId,
}: {
  children: React.ReactNode;
  userId: string;
  role: string;
  sectorId?: string | null;
}) {
  const socketRef = useRef<Socket | null>(null);
  const { addAlert, setKillSwitch } = useGodViewStore();
  const { addNotification } = useNotificationStore();
  const { setConnected } = useSocketStore();

  useEffect(() => {
    const s = io({
      path: "/api/socket",
      transports: ["websocket"],
      auth: { userId, role },
    });

    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      // Join relevant rooms
      if (sectorId) s.emit("join:sector", sectorId);
      s.emit("join:employee", userId);
    });

    s.on("disconnect", () => setConnected(false));

    // God View alerts
    s.on("transaction:new", (data) => {
      addAlert({ id: data.id ?? Date.now().toString(), type: "alert:fraud", data, ts: Date.now() });
    });

    s.on("alert:fraud", (data) => {
      addAlert({ id: Date.now().toString(), type: "alert:fraud", data, ts: Date.now() });
    });

    s.on("kill-switch:activate", () => {
      setKillSwitch(true);
    });

    s.on("kill-switch:deactivate", () => {
      setKillSwitch(false);
    });

    // Personal notifications
    s.on("directive:forced", (data) => {
      addNotification({
        id: data.id,
        type: "directive",
        titleEn: "New Directive",
        bodyEn: data.titleEn,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    s.on("bonus:added", (data) => {
      addNotification({
        id: data.id ?? Date.now().toString(),
        type: "bonus",
        titleEn: "Bonus Added",
        bodyEn: `You received a bonus of ${data.amount} coins`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    return () => { s.disconnect(); };
  }, [userId, role, sectorId]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
