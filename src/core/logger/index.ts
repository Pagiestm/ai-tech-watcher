
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private format(level: LogLevel, message: string, meta?: object): string {
    const timestamp = new Date().toISOString();
    const color = COLORS[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${COLORS.dim}${timestamp}${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset} ${COLORS.dim}[${this.context}]${COLORS.reset} ${message}${metaStr}`;
  }

  debug(message: string, meta?: object): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.format('debug', message, meta));
    }
  }

  info(message: string, meta?: object): void {
    console.info(this.format('info', message, meta));
  }

  warn(message: string, meta?: object): void {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, error?: Error | unknown, meta?: object): void {
    const errorMeta = error instanceof Error ? { error: error.message, stack: error.stack } : {};
    console.error(this.format('error', message, { ...errorMeta, ...meta }));
  }
}

export const createLogger = (context: string): Logger => new Logger(context);
