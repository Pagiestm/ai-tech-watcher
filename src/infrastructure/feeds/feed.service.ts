import RSSParser from 'rss-parser';
import * as cheerio from 'cheerio';
import { createLogger } from '../../core/logger';
import { NewsItem, FeedSource } from '../../shared/types';
import { FeedFetchError } from '../../shared/errors';
import { DEFAULT_MAX_CONTENT_LENGTH } from '../../shared/constants';
import crypto from 'crypto';

const logger = createLogger('FeedService');

// récupération et parsing des flux RSS
type CustomFeed = { title?: string; description?: string };
type CustomItem = { title?: string; link?: string; content?: string; contentSnippet?: string; pubDate?: string; isoDate?: string };

export class FeedService {
  private readonly parser: RSSParser<CustomFeed, CustomItem>;

  constructor() {
    this.parser = new RSSParser({
      timeout: 10000,
      headers: { 'User-Agent': 'ai-tech-watcher/1.0 (RSS Reader)' },
      customFields: {
        item: ['content:encoded', 'description'],
      },
    });
  }

  async fetchFeed(source: FeedSource, maxItems = 5): Promise<NewsItem[]> {
    try {
      logger.debug(`Récupération flux: ${source.name}`);
      const feed = await this.parser.parseURL(source.url);

      const items = (feed.items ?? []).slice(0, maxItems);

      return items
        .filter((item) => item.title && item.link)
        .map((item) => this.mapToNewsItem(item, source));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Flux ignoré: ${source.name}`, { reason: msg });
      throw new FeedFetchError(source.name, msg);
    }
  }

  async fetchAllFeeds(sources: FeedSource[], maxItemsPerFeed = 5): Promise<NewsItem[]> {
    const results = await Promise.allSettled(
      sources.filter((s) => s.enabled).map((s) => this.fetchFeed(s, maxItemsPerFeed))
    );

    const items: NewsItem[] = [];
    let errors = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      } else {
        errors++;
      }
    }

    logger.info(`Flux récupérés`, { total: results.length, erreurs: errors, articles: items.length });
    return items;
  }

  private mapToNewsItem(item: CustomItem, source: FeedSource): NewsItem {
    const rawContent = item.content ?? item.contentSnippet ?? '';
    const cleanContent = this.stripHtml(rawContent).slice(0, DEFAULT_MAX_CONTENT_LENGTH);

    return {
      id: this.generateId(item.link!),
      title: item.title!.trim(),
      url: item.link!,
      content: cleanContent,
      source: source.name,
      category: source.category,
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      fetchedAt: new Date(),
    };
  }

  private stripHtml(html: string): string {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, ' ').trim();
  }

  private generateId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
  }
}

export const feedService = new FeedService();
