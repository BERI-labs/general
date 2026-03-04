"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AppState, Message } from "../lib/types";
import { RAGOrchestrator } from "../lib/rag";
import { SCHOOL_NAME, LOGO_PATH } from "../lib/school-config";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { AboutModal } from "./AboutModal";

type WorkerStatus = "loading" | "orama-ready" | "embedder-ready" | "embedder-fallback";

const ABOUT_STORAGE_KEY = "ashford-about-seen";
const MAX_MESSAGES_PER_CONVERSATION = 42;
const MAX_MESSAGES_PER_WINDOW = 3;
const RATE_WINDOW_MS = 8000;

export function ChatWindow() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>("loading");
  const [embedderProgress, setEmbedderProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Rate limiting
  const [messageCount, setMessageCount] = useState(0);
  const messageTimestamps = useRef<number[]>([]);

  const orchestratorRef = useRef<RAGOrchestrator | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const apiKeyMissing =
    typeof window !== "undefined" &&
    !process.env.NEXT_PUBLIC_GROQ_API_KEY;

  // Show About popup on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(ABOUT_STORAGE_KEY)) {
        setAboutOpen(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const closeAbout = () => {
    setAboutOpen(false);
    try {
      localStorage.setItem(ABOUT_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (apiKeyMissing) {
      setAppState("error");
      setErrorMsg(
        `${SCHOOL_NAME} Assistant is not configured. Please contact the site administrator.`,
      );
      return;
    }

    // Spin up the retrieval worker
    const worker = new Worker(
      new URL("../worker/retrieval-worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, progress } = e.data;

      if (type === "orama-ready") {
        setWorkerStatus("orama-ready");
        setAppState("welcome");
      }
      if (type === "embedder-progress") {
        setEmbedderProgress(progress ?? 0);
      }
      if (type === "embedder-ready") {
        setWorkerStatus("embedder-ready");
      }
      if (type === "embedder-fallback") {
        setWorkerStatus("embedder-fallback");
      }
    };

    worker.onerror = (err) => {
      console.error("Retrieval worker error:", err);
    };

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    worker.postMessage({ type: "init", basePath: base });

    const rag = new RAGOrchestrator(worker);
    orchestratorRef.current = rag;

    return () => {
      worker.terminate();
    };
  }, [apiKeyMissing]);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!orchestratorRef.current || isStreaming) return;

      // Rate limit: max messages per conversation
      if (messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
        const rateLimitMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "You have reached the maximum number of messages for this conversation. Please refresh the page to start a new conversation.",
        };
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: userText },
          rateLimitMsg,
        ]);
        return;
      }

      // Rate limit: max messages per time window
      const now = Date.now();
      const recentTimestamps = messageTimestamps.current.filter(
        (t) => now - t < RATE_WINDOW_MS,
      );
      if (recentTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
        const rateLimitMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "You are sending messages too quickly. Please slow down and read through the responses before asking another question.",
        };
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: userText },
          rateLimitMsg,
        ]);
        return;
      }

      messageTimestamps.current = [...recentTimestamps, now];
      setMessageCount((c) => c + 1);

      const rag = orchestratorRef.current;

      if (appState === "welcome") {
        setAppState("chatting");
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        const { fullText, sources } = await rag.ask(
          userText,
          (text) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: text, isStreaming: true }
                  : m,
              ),
            );
          },
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fullText,
                  sources,
                  isStreaming: false,
                }
              : m,
          ),
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: msg,
                  isStreaming: false,
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [appState, isStreaming, messageCount],
  );

  // ── LOADING SCREEN ──────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-8"
        style={{ background: "var(--school-bg)" }}
        role="status"
        aria-label={`Loading ${SCHOOL_NAME} AI assistant`}
      >
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${LOGO_PATH}`}
          alt={`${SCHOOL_NAME} logo`}
          className="h-16 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="w-64 flex flex-col gap-2">
          <div
            className="text-xs text-center"
            style={{ color: "var(--school-text-soft)" }}
          >
            Loading knowledge base…
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ background: "var(--school-accent-light)", height: 3 }}
          >
            <div
              className="school-progress-bar"
              style={{
                width:
                  workerStatus === "loading"
                    ? `${Math.max(5, embedderProgress)}%`
                    : "100%",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR SCREEN ──────────────────────────────────────────────
  if (appState === "error") {
    return (
      <main
        className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center"
        style={{ background: "var(--school-bg)" }}
        aria-label="Error"
      >
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--school-error)" }}
        >
          {errorMsg ?? `${SCHOOL_NAME} Assistant is not configured.`}
        </h1>
        <p className="text-sm" style={{ color: "var(--school-text-soft)" }}>
          Please contact the site administrator.
        </p>
      </main>
    );
  }

  // ── MAIN CHAT UI ──────────────────────────────────────────────
  return (
    <main
      className={`flex flex-col ${appState === "welcome" ? "min-h-screen" : "h-screen"}`}
      style={{ background: "var(--school-bg)" }}
    >
      {/* About modal */}
      <AboutModal open={aboutOpen} onClose={closeAbout} />

      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: "var(--school-border-light)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${LOGO_PATH}`}
              alt={`${SCHOOL_NAME} logo`}
              className="h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--school-primary)" }}
              >
                {SCHOOL_NAME}
              </span>
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--school-text-soft)" }}
              >
                AI Assistant
              </span>
            </div>
          </div>

          <button
            onClick={() => setAboutOpen(true)}
            className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60"
            style={{ color: "var(--school-text-muted)" }}
            aria-label={`About ${SCHOOL_NAME} Assistant`}
          >
            About
          </button>
        </div>
      </header>

      {/* Content */}
      {appState === "welcome" ? (
        <WelcomeScreen onQuestion={sendMessage} />
      ) : (
        <MessageList messages={messages} />
      )}

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isStreaming || workerStatus === "loading"}
        placeholder={
          workerStatus === "loading"
            ? "Loading…"
            : "Ask about admissions, fees, curriculum…"
        }
      />
    </main>
  );
}
