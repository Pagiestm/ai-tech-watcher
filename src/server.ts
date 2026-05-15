import { getConfig } from './core/config';
import { scheduler } from './core/scheduler';
import { createLogger } from './core/logger';
import { TechWatcherBot } from './presentation/telegram/bot';
import { generateDigestUseCase } from './domain/usecases/generate-digest.usecase';
import { ollamaService } from './infrastructure/ai/ollama.service';

const logger = createLogger('Server');

async function bootstrap(): Promise<void> {
  logger.info('Démarrage de ai-tech-watcher...');

  // 1. Chargement et validation de la config
  const config = getConfig();
  logger.info('Configuration chargée', {
    model: config.ollama.model,
    maxItems: config.digest.maxItemsPerReport,
    sources: config.feeds.filter((f) => f.enabled).length,
  });

  // 2. Vérification Ollama
  const ollamaOk = await ollamaService.checkHealth();
  if (!ollamaOk) {
    logger.warn('Ollama non disponible. Les résumés IA seront désactivés.');
    logger.warn('=> Démarrez Ollama avec: ollama serve');
    logger.warn(`=> Téléchargez le modèle: ollama pull ${config.ollama.model}`);
  } else {
    const models = await ollamaService.listModels();
    logger.info('Ollama connecté', { models });
  }

  // 3. Initialisation du bot Telegram
  const bot = new TechWatcherBot();

  // 4. Planification des digests automatiques
  scheduler.register('digest-daily', config.schedule.daily, async () => {
    logger.info('Exécution du digest quotidien planifié');
    const report = await generateDigestUseCase.execute('daily');
    await bot.sendDigest(report);
  });

  scheduler.register('digest-weekly', config.schedule.weekly, async () => {
    logger.info('Exécution du digest hebdomadaire planifié');
    const report = await generateDigestUseCase.execute('weekly');
    await bot.sendDigest(report);
  });

  logger.info('Bot actif et en écoute !');
  logger.info(`Jobs planifiés: ${scheduler.listJobs().join(', ')}`);
  logger.info('Utilisez /start sur Telegram pour commencer');

  // 5. Gestion arrêt propre
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Signal ${signal} reçu — arrêt en cours...`);
    scheduler.stopAll();
    await bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (error) => {
    logger.error('Exception non gérée', error);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Promise rejetée non gérée', reason instanceof Error ? reason : new Error(String(reason)));
  });
}

bootstrap().catch((error) => {
  console.error('Erreur fatale au démarrage:', error);
  process.exit(1);
});
