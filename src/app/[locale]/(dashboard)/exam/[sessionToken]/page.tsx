"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type Question = {
  id: string;
  questionEn: string;
  questionAr: string | null;
  optionsJson: { label: string; value: string }[];
  topic: string;
};

type Props = { params: { sessionToken: string; locale: string } };

export default function ExamPage({ params }: Props) {
  const { sessionToken, locale } = params;
  const isAr = locale === "ar";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [status, setStatus] = useState<"loading" | "active" | "paused" | "completed">("loading");
  const [proctorScore, setProctorScore] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [alert, setAlert] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showAlert = useCallback((msg: string) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 4000);
  }, []);

  // iLock: Block keyboard shortcuts
  useEffect(() => {
    function blockKeys(e: KeyboardEvent) {
      const blocked = [
        "PrintScreen",
        "F12",
        e.ctrlKey && ["c", "v", "u", "s", "p"].includes(e.key.toLowerCase()),
        e.metaKey && ["c", "v", "p", "s"].includes(e.key.toLowerCase()),
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        showAlert("⚠️ Key combination blocked by iLock secure browser");
      }
    }
    function blockContext(e: MouseEvent) { e.preventDefault(); }
    window.addEventListener("keydown", blockKeys);
    window.addEventListener("contextmenu", blockContext);
    return () => {
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("contextmenu", blockContext);
    };
  }, [showAlert]);

  // iLock: Block tab switching / visibility change
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && status === "active") {
        setTabWarnings((prev) => {
          const next = prev + 1;
          showAlert(`⚠️ Tab switch detected (${next}/3). Exam will be paused after 3 violations.`);
          if (next >= 3) {
            setStatus("paused");
            socketRef.current?.emit("proctor:alert", {
              sessionToken,
              reason: "tab_switch_limit",
              count: next,
            });
          }
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status, sessionToken, showAlert]);

  // Socket.io proctoring
  useEffect(() => {
    const s = io({ path: "/api/socket", transports: ["websocket"] });
    socketRef.current = s;
    s.emit("join:exam", sessionToken);

    s.on("proctor:pause", () => {
      setStatus("paused");
      showAlert("🚨 Exam paused by proctor. Contact your supervisor.");
    });

    s.on("face:score-update", ({ score }: { score: number }) => {
      setProctorScore(score);
      if (score < 95) {
        showAlert(`⚠️ Face verification score low: ${score}%. Verify your identity.`);
      }
    });

    return () => { s.disconnect(); };
  }, [sessionToken, showAlert]);

  // Load exam session
  useEffect(() => {
    async function loadExam() {
      const res = await fetch(`/api/exam/${sessionToken}`);
      if (!res.ok) { setStatus("paused"); return; }
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setTimeLeft(data.durationMinutes * 60);
      setStatus("active");
    }
    loadExam();
  }, [sessionToken]);

  // Countdown timer
  useEffect(() => {
    if (status !== "active" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [status, timeLeft > 0]);

  async function submitExam() {
    setStatus("completed");
    await fetch(`/api/exam/${sessionToken}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-5xl">✅</span>
          <h2 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {isAr ? "تم إرسال الامتحان بنجاح" : "Exam Submitted Successfully"}
          </h2>
          <p className="text-[#6e7d93]">Your results will be reviewed and published shortly.</p>
        </div>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgba(156,42,42,0.05)]">
        <div className="text-center space-y-4 max-w-md px-4">
          <span className="text-5xl">🔒</span>
          <h2 className="text-2xl font-bold text-[#9C2A2A]">Exam Paused</h2>
          <p className="text-[#6e7d93]">Your exam has been paused due to security violations. Contact your supervisor to resume.</p>
        </div>
      </div>
    );
  }

  if (status === "loading" || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#6e7d93] text-sm">Loading secure exam environment...</p>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ userSelect: "none" }}>
      {/* Alert Banner */}
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="rounded-xl bg-[rgba(156,42,42,0.9)] backdrop-blur border border-[rgba(156,42,42,0.5)] px-4 py-3 text-sm text-white">
            {alert}
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-[rgba(6,15,30,0.98)] border-b border-[rgba(201,162,39,0.12)] backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="text-xs px-2 py-1 rounded-full bg-[rgba(156,42,42,0.15)] text-[#9C2A2A] border border-[rgba(156,42,42,0.3)] font-medium">
            🔒 iLock Secure
          </span>
          <span className="text-xs text-[#6e7d93]">
            Q {currentQ + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6e7d93]">Face ID:</span>
            <span className="text-xs font-mono" style={{ color: proctorScore >= 95 ? "#22c55e" : "#9C2A2A" }}>
              {proctorScore}%
            </span>
          </div>
          <div
            className="text-sm font-mono font-bold"
            style={{ color: timeLeft < 300 ? "#9C2A2A" : "#C9A227" }}
          >
            ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          {tabWarnings > 0 && (
            <span className="text-xs text-[#9C2A2A] font-medium">
              ⚠️ {tabWarnings} tab warning{tabWarnings > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5 bg-[rgba(201,162,39,0.1)]">
        <div
          className="h-full bg-[#C9A227] transition-all"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-sovereign-card rounded-2xl border border-[rgba(201,162,39,0.15)] p-8 space-y-6">
            <div>
              <span className="text-xs text-[#6e7d93] mb-3 block">{q.topic}</span>
              <h2
                className="text-[#A8B5C8] text-lg font-medium leading-relaxed"
                style={{ fontFamily: isAr ? "var(--font-tajawal)" : "inherit" }}
                dir={isAr ? "rtl" : "ltr"}
              >
                {isAr ? q.questionAr ?? q.questionEn : q.questionEn}
              </h2>
            </div>

            <div className="space-y-3">
              {(q.optionsJson as { label: string; value: string }[]).map((option) => {
                const isSelected = answers[q.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: option.value }))}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: isSelected ? "rgba(201,162,39,0.5)" : "rgba(201,162,39,0.12)",
                      background: isSelected ? "rgba(201,162,39,0.08)" : "transparent",
                      color: isSelected ? "#C9A227" : "#A8B5C8",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full border shrink-0"
                      style={{
                        borderColor: isSelected ? "#C9A227" : "rgba(201,162,39,0.3)",
                        background: isSelected ? "#C9A227" : "transparent",
                      }}
                    />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="h-9 px-4 text-xs rounded-lg border border-[rgba(201,162,39,0.2)] text-[#6e7d93] hover:text-[#A8B5C8] disabled:opacity-30"
              >
                ← Previous
              </button>

              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((q) => q + 1)}
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-[rgba(201,162,39,0.9)] text-[#060f1e] hover:bg-[#C9A227]"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={submitExam}
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-[rgba(34,197,94,0.9)] text-white hover:bg-[#22c55e]"
                >
                  Submit Exam ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
