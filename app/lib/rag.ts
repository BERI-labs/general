import { streamGroqCompletion, type GroqMessage } from "./groq";
import { SYSTEM_PROMPT } from "./school-config";
import type { SearchResult } from "./types";

export class RAGOrchestrator {
  private retrievalWorker: Worker;
  private history: GroqMessage[] = [];

  constructor(retrievalWorker: Worker) {
    this.retrievalWorker = retrievalWorker;
  }

  async search(query: string): Promise<SearchResult[]> {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.retrievalWorker.removeEventListener("message", handler);
          resolve(e.data.results ?? []);
        }
      };
      this.retrievalWorker.addEventListener("message", handler);
      this.retrievalWorker.postMessage({ type: "search", query, id });
    });
  }

  buildMessages(userQuery: string, sources: SearchResult[]): GroqMessage[] {
    const contextBlock = sources
      .map((r) => {
        const urlLine = r.chunk.url ? `\nURL: ${r.chunk.url}` : "";
        return `[${r.chunk.title}]${urlLine}\n${r.chunk.text}`;
      })
      .join("\n\n");

    const messages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Include last 3 turns of history (6 messages)
    const recentHistory = this.history.slice(-6);
    messages.push(...recentHistory);

    messages.push({
      role: "user",
      content: contextBlock
        ? `Context:\n${contextBlock}\n\nQuestion: ${userQuery}`
        : `Question: ${userQuery}`,
    });

    return messages;
  }

  async ask(
    userQuery: string,
    onChunk: (text: string) => void,
  ): Promise<{ fullText: string; sources: SearchResult[] }> {
    // 1. Retrieve (local, ~30ms)
    const sources = await this.search(userQuery);

    // 2. Build messages
    const messages = this.buildMessages(userQuery, sources);

    // 3. Stream from Groq
    const fullText = await new Promise<string>((resolve, reject) => {
      streamGroqCompletion({
        messages,
        includeReasoning: false,
        onChunk,
        onDone: (text) => {
          this.history.push(
            { role: "user", content: userQuery },
            { role: "assistant", content: text },
          );
          resolve(text);
        },
        onError: reject,
      });
    });

    return { fullText, sources };
  }

  resetHistory() {
    this.history = [];
  }
}
