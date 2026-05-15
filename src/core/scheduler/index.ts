import cron, { ScheduledTask } from 'node-cron';
import { createLogger } from '../logger';
import { ScheduleConfig } from '../../shared/types';

const logger = createLogger('Scheduler');

export interface ScheduledJob {
  name: string;
  task: ScheduledTask;
  config: ScheduleConfig;
}

export class Scheduler {
  private readonly jobs: Map<string, ScheduledJob> = new Map();

  register(name: string, config: ScheduleConfig, handler: () => Promise<void>): void {
    if (this.jobs.has(name)) {
      logger.warn(`Job "${name}" déjà enregistré, remplacement`);
      this.stop(name);
    }

    const task = cron.schedule(
      config.cronExpression,
      async () => {
        logger.info(`=> Exécution du job "${name}"`);
        try {
          await handler();
          logger.info(`Job "${name}" terminé avec succès`);
        } catch (error) {
          logger.error(`Erreur dans le job "${name}"`, error);
        }
      },
      { timezone: config.timezone }
    );

    this.jobs.set(name, { name, task, config });
    logger.info(`Job "${name}" planifié`, { cron: config.cronExpression, tz: config.timezone });
  }

  stop(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.task.stop();
      this.jobs.delete(name);
      logger.info(`Job "${name}" arrêté`);
    }
  }

  stopAll(): void {
    for (const name of this.jobs.keys()) this.stop(name);
    logger.info('Tous les jobs arrêtés');
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

export const scheduler = new Scheduler();
