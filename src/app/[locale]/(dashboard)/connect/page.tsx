"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Lock, MessageCircle, MessagesSquare, Siren, User } from "lucide-react";
import { scaleIn } from "@/lib/motion/dashboard";

type Message = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

type Room = {
  id: string;
  name: string | null;
  type: string;
};

function RoomTypeIcon({ type }: { type: string }) {
  if (type === "emergency") return <Siren className="size-4 text-[#9C2A2A]" aria-hidden />;
  if (type === "direct") return <User className="size-4" aria-hidden />;
  return <MessageCircle className="size-4" aria-hidden />;
}

export default function ConnectPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = io({ path: "/api/socket", transports: ["websocket"] });
    setSocket(s);

    fetch("/api/connect/rooms")
      .then((r) => r.json())
      .then(setRooms);

    s.on("message:new", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function joinRoom(roomId: string) {
    setActiveRoom(roomId);
    socket?.emit("join:connect", roomId);

    const res = await fetch(`/api/connect/rooms/${roomId}/messages`);
    const data = await res.json();
    setMessages(data);
  }

  async function sendMessage() {
    if (!input.trim() || !activeRoom || !socket) return;
    await fetch(`/api/connect/rooms/${activeRoom}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });
    setInput("");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-56 shrink-0 border-r border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.95)] flex flex-col"
      >
        <div className="px-4 py-4 border-b border-[rgba(201,162,39,0.1)]">
          <h2 className="text-[#C9A227] text-sm font-semibold" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            iFACE Connect
          </h2>
          <p className="text-[10px] text-[#6e7d93] mt-0.5 flex items-center gap-1">
            <Lock className="size-2.5 opacity-70" aria-hidden />
            Internal — Encrypted
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {rooms.map((room, i) => (
            <motion.button
              key={room.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              onClick={() => joinRoom(room.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                activeRoom === room.id
                  ? "bg-[rgba(201,162,39,0.1)] text-[#C9A227]"
                  : "text-[#6e7d93] hover:text-[#A8B5C8] hover:bg-[rgba(201,162,39,0.05)]"
              }`}
            >
              <RoomTypeIcon type={room.type} />
              <span className="truncate">{room.name ?? room.type}</span>
            </motion.button>
          ))}
          {rooms.length === 0 && (
            <p className="text-center text-[#6e7d93] text-xs py-8 px-4">
              No rooms yet. Rooms will appear when you are added.
            </p>
          )}
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeRoom ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.25 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-xs text-[#C9A227] shrink-0">
                      {msg.senderName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs text-[#6e7d93] mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>
                          {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#6e7d93] opacity-60">
                          <Lock className="size-2.5" aria-hidden />
                          encrypted
                        </span>
                      </p>
                      <div className="bg-[rgba(10,31,61,0.6)] border border-[rgba(201,162,39,0.08)] rounded-lg px-3 py-2 text-sm text-[#A8B5C8] max-w-lg">
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[rgba(201,162,39,0.1)] p-4 flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message... (Enter to send)"
                  className="flex-1 h-10 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="h-10 px-4 text-xs font-semibold rounded-lg bg-[rgba(201,162,39,0.9)] text-[#060f1e] hover:bg-[#C9A227] disabled:opacity-40 transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              {...scaleIn}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center">
                <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)] mx-auto">
                  <MessagesSquare className="size-8" aria-hidden />
                </span>
                <p className="text-[#6e7d93] mt-4 text-sm">Select a room to start chatting</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
