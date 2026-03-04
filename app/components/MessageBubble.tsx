"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../lib/types";
import { SourcePanel } from "./SourcePanel";
import { buildReportMailto } from "../lib/report";
import { SCHOOL_NAME, LOGO_PATH } from "../lib/school-config";

/** Strip stray HTML tags the LLM sometimes injects */
function sanitiseContent(raw: string): string {
  return raw
    .replace(/<br\s*\/?>\s*[•·‣⁃]/g, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&bull;/gi, "- ");
}

interface MessageBubbleProps {
  message: Message;
  precedingUserText?: string;
}

export function MessageBubble({ message, precedingUserText }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
          style={{
            background: "var(--school-user-bubble)",
            color: "var(--school-text)",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-6 animate-slide-up">
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 overflow-hidden mt-0.5">
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${LOGO_PATH}`}
          alt={SCHOOL_NAME}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement!;
            parent.innerHTML = `<span style="font-size:14px;display:flex;align-items:center;justify-content:center;height:100%;width:100%;background:#1B4F72;color:#fff;border-radius:50%;font-weight:700">A</span>`;
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Message bubble */}
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
          style={{
            background: "var(--school-surface)",
            color: "var(--school-text)",
            boxShadow: "0 2px 12px var(--school-shadow)",
            borderLeft: "2px solid var(--school-primary)",
          }}
        >
          <div className={`school-prose ${message.isStreaming ? "school-cursor" : ""}`}>
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <div className="text-base font-semibold mt-2 mb-1" style={{ color: "var(--school-text)" }}>{children}</div>
                  ),
                  h2: ({ children }) => (
                    <div className="text-sm font-semibold mt-2 mb-1" style={{ color: "var(--school-text)" }}>{children}</div>
                  ),
                  h3: ({ children }) => (
                    <div className="text-sm font-semibold mt-2 mb-1" style={{ color: "var(--school-text)" }}>{children}</div>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead>{children}</thead>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  th: ({ children }) => (
                    <th
                      className="text-left px-2 py-1.5 border-b-2 font-semibold"
                      style={{ borderColor: "var(--school-accent-light)", color: "var(--school-text)" }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-2 py-1.5 border-b" style={{ borderColor: "var(--school-border-light)" }}>
                      {children}
                    </td>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium underline"
                      style={{ color: "var(--school-primary)" }}
                    >
                      {children}
                      <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  ),
                  strong: ({ children }) => <strong>{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                  p: ({ children }) => <p className="mb-1">{children}</p>,
                }}
              >
                {sanitiseContent(message.content)}
              </ReactMarkdown>
            ) : (
              <span style={{ color: "var(--school-text-muted)" }}>Thinking…</span>
            )}
          </div>
        </div>

        {/* Sources */}
        {!message.isStreaming && message.sources && message.sources.length > 0 && (
          <SourcePanel sources={message.sources} />
        )}

        {/* Report link */}
        {!message.isStreaming && (
          <div className="mt-1.5 flex items-center">
            <a
              href="#"
              title="Opens your email client with the last Q&A pre-filled."
              onClick={(e) => {
                e.preventDefault();
                const url = buildReportMailto({
                  lastUserText: precedingUserText ?? "",
                  lastBotText: message.content,
                  citations: message.sources?.map((s) => ({
                    title: s.chunk.title,
                    url: s.chunk.url,
                    score: s.score,
                  })),
                });
                window.location.href = url;
              }}
              className="inline-flex items-center gap-1 text-[11px] transition-colors hover:underline"
              style={{ color: "#6B7280" }}
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 6l9-3 9 3v8l-9 3-9-3V6z" />
              </svg>
              Report this answer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
