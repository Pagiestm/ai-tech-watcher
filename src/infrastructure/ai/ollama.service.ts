import { Ollama } from "ollama";
import { createLogger } from "../../core/logger";
import { getConfig } from "../../core/config";
import { AISummaryResult } from "../../shared/types";

const logger = createLogger("OllamaService");

export class OllamaService {
  private readonly client: Ollama;
  private readonly model: string;

  constructor() {
    const config = getConfig();
    this.client = new Ollama({ host: config.ollama.baseUrl });
    this.model = config.ollama.model;
  }

  async summarize(title: string, content: string): Promise<AISummaryResult> {
    const truncatedContent = content.slice(0, 1500);

    // Prompt
    const prompt = `Reponds uniquement avec un objet JSON valide, sans aucun texte avant ou apres, sans markdown, sans backticks.

Format exact attendu:
{"summary":"...","tags":["...","...","..."],"emoji":"..."}

Regles:
- summary: 2 phrases en francais qui resument l article
- tags: 3 mots-cles en anglais sans espaces
- emoji: 1 seul emoji

Article a resumer:
Titre: ${title}
Contenu: ${truncatedContent}

JSON:`;

    try {
      logger.debug(`Resume pour: "${title.slice(0, 60)}"`);

      const response = await this.client.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { temperature: 0.1 },
      });

      const raw = response.message.content.trim();
      return this.parseResponse(raw, title);
    } catch (error) {
      logger.error(`Erreur Ollama pour "${title.slice(0, 50)}"`, error);
      return null as unknown as AISummaryResult;
    }
  }

  private parseResponse(raw: string, title: string): AISummaryResult {
    // Tentative 1 : extraire le premier bloc JSON
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.summary && typeof parsed.summary === "string") {
          return {
            summary: parsed.summary,
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
            emoji: typeof parsed.emoji === "string" ? parsed.emoji : "📰",
          };
        }
      } catch {
        // continue vers tentative 2
      }
    }

    // Tentative 2 : extraire summary manuellement depuis le texte brut
    const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
    const tagsMatch = raw.match(/"tags"\s*:\s*\[([^\]]+)\]/);
    const emojiMatch = raw.match(/"emoji"\s*:\s*"([^"]+)"/);

    if (summaryMatch) {
      const tagsRaw = tagsMatch ? (tagsMatch[1].match(/"([^"]+)"/g) ?? []) : [];
      return {
        summary: summaryMatch[1],
        tags: tagsRaw.map((t) => t.replace(/"/g, "")).slice(0, 5),
        emoji: emojiMatch ? emojiMatch[1] : "📰",
      };
    }

    // Echec total
    logger.warn(
      `Impossible de parser la reponse Ollama pour "${title.slice(0, 50)}"`,
    );
    return null as unknown as AISummaryResult;
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const list = await this.client.list();
    return list.models.map((m) => m.name);
  }
}

export const ollamaService = new OllamaService();
