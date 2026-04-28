import { getApiKey } from "./api-key";
import { SCHOOL_NAME } from "./school-config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const STREAM_TIMEOUT_MS = 30_000; // abort if no bytes received for 30 s

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqStreamOptions {
  messages: GroqMessage[];
  includeReasoning?: boolean;
  onChunk: (text: string) => void;
  onReasoning?: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamGroqCompletion({
  messages,
  includeReasoning = false,
  onChunk,
  onReasoning,
  onDone,
  onError,
}: GroqStreamOptions): Promise<void> {
  const controller = new AbortController();

  // Watchdog: reset on each received chunk; fire if stream goes silent
  let watchdog = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
  const resetWatchdog = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
  };

  try {
    const apiKey = getApiKey();

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.3,
        max_completion_tokens: 800,
        stream: true,
        include_reasoning: includeReasoning,
        reasoning_effort: "low",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const status = response.status;
      let message = errorBody?.error?.message || `Groq API error: ${status}`;

      if (status === 401) {
        message = `${SCHOOL_NAME} Assistant API key is invalid. Please contact the site administrator.`;
      } else if (status === 429) {
        message = "Too many requests. Please wait a moment and try again.";
      } else if (status === 503) {
        message = "The AI service is temporarily unavailable. Please try again shortly.";
      }

      throw new Error(message);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let reasoningText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetWatchdog();

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);

          // Catch server-side stream errors embedded in the SSE payload
          if (parsed.error) {
            throw new Error(parsed.error.message ?? "Stream error from API.");
          }

          const delta = parsed.choices?.[0]?.delta;
          const finishReason = parsed.choices?.[0]?.finish_reason;

          if (delta?.content) {
            fullText += delta.content;
            onChunk(fullText);
          }

          if (delta?.reasoning && onReasoning) {
            reasoningText += delta.reasoning;
            onReasoning(reasoningText);
          }

          // Explicit stop — clear watchdog early
          if (finishReason === "stop" || finishReason === "length") {
            clearTimeout(watchdog);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== "Stream error from API.") {
            // Skip truly malformed SSE chunks
          } else {
            throw parseErr;
          }
        }
      }
    }

    clearTimeout(watchdog);
    onDone(fullText);
  } catch (e) {
    clearTimeout(watchdog);
    if (e instanceof Error && e.name === "AbortError") {
      onError(new Error("The response timed out. Please try asking a shorter or more specific question."));
    } else {
      onError(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
