import { create } from "zustand";

type Notification = {
  id: string;
  type: string;
  titleEn: string;
  bodyEn: string;
  isRead: boolean;
  createdAt: string;
};

type GodViewAlert = {
  id: string;
  type: "alert:fraud" | "alert:sla-breach" | "alert:violation" | "reconciliation:complete" | "directive:broadcast";
  data: unknown;
  ts: number;
};

type GodViewStore = {
  alerts: GodViewAlert[];
  isKillSwitchActive: boolean;
  pendingDirectives: number;
  addAlert: (alert: GodViewAlert) => void;
  clearAlerts: () => void;
  setKillSwitch: (active: boolean) => void;
  setPendingDirectives: (count: number) => void;
};

export const useGodViewStore = create<GodViewStore>((set) => ({
  alerts: [],
  isKillSwitchActive: false,
  pendingDirectives: 0,
  addAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts].slice(0, 100),
    })),
  clearAlerts: () => set({ alerts: [] }),
  setKillSwitch: (active) => set({ isKillSwitchActive: active }),
  setPendingDirectives: (count) => set({ pendingDirectives: count }),
}));

type NotificationStore = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

type SocketStore = {
  isConnected: boolean;
  setConnected: (v: boolean) => void;
};

export const useSocketStore = create<SocketStore>((set) => ({
  isConnected: false,
  setConnected: (v) => set({ isConnected: v }),
}));
