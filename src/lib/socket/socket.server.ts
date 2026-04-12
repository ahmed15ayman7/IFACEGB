import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { redis } from "@/lib/redis/client";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Room definitions from plan:
  // god-view | sector:[id] | employee:[id] | exam:[token] | connect:[roomId]

  io.on("connection", (socket) => {
    const { userId, role } = socket.handshake.auth as { userId: string; role: string };

    // Auto-join role-based rooms
    if (role === "super_admin") {
      socket.join("god-view");
    }

    socket.on("join:sector", (sectorId: string) => {
      socket.join(`sector:${sectorId}`);
    });

    socket.on("join:employee", (empId: string) => {
      socket.join(`employee:${empId}`);
    });

    socket.on("join:exam", (token: string) => {
      socket.join(`exam:${token}`);
    });

    socket.on("join:connect", (roomId: string) => {
      socket.join(`connect:${roomId}`);
    });

    // Whiteboard draw event for virtual classrooms
    socket.on("whiteboard:draw", ({ sessionId, data }: { sessionId: string; data: unknown }) => {
      socket.to(`whiteboard:${sessionId}`).emit("whiteboard:draw", data);
    });

    // Presence update
    socket.on("presence:update", async (status: string) => {
      if (userId) {
        await redis.set(`presence:${userId}`, status, "EX", 60);
        socket.broadcast.emit("presence:changed", { userId, status });
      }
    });

    socket.on("disconnect", async () => {
      if (userId) {
        await redis.set(`presence:${userId}`, "offline", "EX", 300);
      }
    });
  });

  console.log("[Socket.io] Server initialized");
  return io;
}

// Broadcast helpers for server-side emits
export function emitToGodView(event: string, data: unknown) {
  io?.to("god-view").emit(event, data);
}

export function emitToSector(sectorId: string, event: string, data: unknown) {
  io?.to(`sector:${sectorId}`).emit(event, data);
}

export function emitToEmployee(employeeId: string, event: string, data: unknown) {
  io?.to(`employee:${employeeId}`).emit(event, data);
}
