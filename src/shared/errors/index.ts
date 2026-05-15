export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class FeedFetchError extends AppError {
  constructor(feedName: string, cause?: string) {
    super(`Impossible de récupérer le flux "${feedName}"${cause ? ': ' + cause : ''}`, 'FEED_FETCH_ERROR');
    this.name = 'FeedFetchError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string) {
    super(message, 'AI_SERVICE_ERROR');
    this.name = 'AIServiceError';
  }
}

export class TelegramError extends AppError {
  constructor(message: string) {
    super(message, 'TELEGRAM_ERROR');
    this.name = 'TelegramError';
  }
}

export class ConfigError extends AppError {
  constructor(field: string) {
    super(`Variable d'environnement manquante: ${field}`, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}
