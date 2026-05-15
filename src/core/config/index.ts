import * as dotenv from 'dotenv';
import { ConfigError } from '../../shared/errors';
import { FeedSource, ScheduleConfig } from '../../shared/types';
import { DEFAULT_FEED_SOURCES, OLLAMA_DEFAULT_MODEL, OLLAMA_BASE_URL } from '../../shared/constants';

dotenv.config();

export interface AppConfig {
  telegram: {
    botToken: string;
    chatId: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
  feeds: FeedSource[];
  schedule: {
    daily: ScheduleConfig;
    weekly: ScheduleConfig;
  };
  digest: {
    maxItemsPerReport: number;
    language: string;
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new ConfigError(key);
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export function loadConfig(): AppConfig {
  return {
    telegram: {
      botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
      chatId: requireEnv('TELEGRAM_CHAT_ID'),
    },
    ollama: {
      baseUrl: optionalEnv('OLLAMA_BASE_URL', OLLAMA_BASE_URL),
      model: optionalEnv('OLLAMA_MODEL', OLLAMA_DEFAULT_MODEL),
    },
    feeds: DEFAULT_FEED_SOURCES,
    schedule: {
      daily: {
        cronExpression: optionalEnv('CRON_DAILY', '0 8 * * *'), // 8h chaque jour
        timezone: optionalEnv('TIMEZONE', 'Europe/Paris'),
      },
      weekly: {
        cronExpression: optionalEnv('CRON_WEEKLY', '0 10 * * 1'), // Lundi 10h
        timezone: optionalEnv('TIMEZONE', 'Europe/Paris'),
      },
    },
    digest: {
      maxItemsPerReport: parseInt(optionalEnv('MAX_ITEMS', '10'), 10),
      language: optionalEnv('DIGEST_LANGUAGE', 'français'),
    },
  };
}

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) _config = loadConfig();
  return _config;
}
