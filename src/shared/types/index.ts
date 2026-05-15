export interface NewsItem {
  id: string;
  title: string;
  url: string;
  content: string;
  source: string;
  category: NewsCategory;
  publishedAt: Date;
  fetchedAt: Date;
}

export interface DigestedNewsItem extends NewsItem {
  summary: string;
  emoji: string;
  tags: string[];
}

export interface DigestReport {
  id: string;
  generatedAt: Date;
  period: 'daily' | 'weekly';
  items: DigestedNewsItem[];
  totalFetched: number;
}

export type NewsCategory =
  | 'ai'
  | 'framework'
  | 'language'
  | 'tool'
  | 'cloud'
  | 'security'
  | 'other';

export interface FeedSource {
  name: string;
  url: string;
  category: NewsCategory;
  enabled: boolean;
}

export interface AISummaryResult {
  summary: string;
  tags: string[];
  emoji: string;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
}
