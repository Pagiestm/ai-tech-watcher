import { createLogger } from "../../core/logger";
import { getConfig } from "../../core/config";
import { feedService } from "../../infrastructure/feeds/feed.service";
import { ollamaService } from "../../infrastructure/ai/ollama.service";
import { DigestReport, DigestedNewsItem, NewsItem } from "../../shared/types";
import crypto from "crypto";

const logger = createLogger("GenerateDigestUseCase");

export class GenerateDigestUseCase {
  private isRunning = false;

  async execute(period: "daily" | "weekly"): Promise<DigestReport> {
    if (this.isRunning) {
      logger.warn("Un digest est deja en cours, execution ignoree");
      throw new Error("Digest deja en cours, reessaie dans quelques minutes.");
    }

    this.isRunning = true;
    logger.info(`Verrou acquis - debut generation digest ${period}`);

    try {
      return await this._execute(period);
    } finally {
      this.isRunning = false;
      logger.info("Verrou libere");
    }
  }

  private async _execute(period: "daily" | "weekly"): Promise<DigestReport> {
    const config = getConfig();
    const targetItems = config.digest.maxItemsPerReport;
    const fetchExtra = targetItems * 2;

    logger.info(`Generation du digest ${period}...`);

    const rawItems = await feedService.fetchAllFeeds(
      config.feeds,
      period === "weekly" ? 10 : 5,
    );
    logger.info(`${rawItems.length} articles recuperes`);

    const uniqueItems = this.deduplicateAndSort(rawItems);
    const candidates = this.selectTopItems(uniqueItems, fetchExtra);
    logger.info(
      `${candidates.length} articles candidats (objectif: ${targetItems} valides)`,
    );

    const digested = await this.digestUntilEnough(candidates, targetItems);
    logger.info(`${digested.length} articles valides dans le digest final`);

    const report: DigestReport = {
      id: crypto.randomUUID(),
      generatedAt: new Date(),
      period,
      items: digested,
      totalFetched: rawItems.length,
    };

    logger.info(`Digest genere`, { id: report.id, items: digested.length });
    return report;
  }

  private async digestUntilEnough(
    items: NewsItem[],
    target: number,
  ): Promise<DigestedNewsItem[]> {
    const results: DigestedNewsItem[] = [];
    let attempted = 0;

    for (const item of items) {
      if (results.length >= target) break;
      attempted++;
      logger.info(
        `Resume ${attempted}/${items.length} (${results.length}/${target} valides): "${item.title.slice(0, 50)}"`,
      );

      const aiResult = await ollamaService.summarize(item.title, item.content);

      if (aiResult === null || !aiResult.summary) {
        logger.warn(
          `Article ignore (resume echoue): "${item.title.slice(0, 50)}"`,
        );
        continue;
      }

      results.push({ ...item, ...aiResult });
    }

    return results;
  }

  private deduplicateAndSort(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return items
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  private selectTopItems(items: NewsItem[], max: number): NewsItem[] {
    const priority = [
      "ai",
      "framework",
      "language",
      "tool",
      "cloud",
      "security",
      "other",
    ];
    const buckets = new Map<string, NewsItem[]>();

    for (const cat of priority) buckets.set(cat, []);
    for (const item of items) {
      buckets.get(item.category)?.push(item);
    }

    const result: NewsItem[] = [];
    let i = 0;
    while (result.length < max) {
      let added = false;
      for (const cat of priority) {
        const bucket = buckets.get(cat)!;
        if (i < bucket.length) {
          result.push(bucket[i]);
          added = true;
          if (result.length >= max) break;
        }
      }
      if (!added) break;
      i++;
    }

    return result;
  }
}

export const generateDigestUseCase = new GenerateDigestUseCase();
