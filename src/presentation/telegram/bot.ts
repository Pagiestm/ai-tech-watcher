import TelegramBot from "node-telegram-bot-api";
import { createLogger } from "../../core/logger";
import { getConfig } from "../../core/config";
import { telegramFormatter } from "../formatters/telegram.formatter";
import { generateDigestUseCase } from "../../domain/usecases/generate-digest.usecase";
import { ollamaService } from "../../infrastructure/ai/ollama.service";
import { scheduler } from "../../core/scheduler";
import { DigestReport } from "../../shared/types";

const logger = createLogger("TelegramBot");

// Gère les interactions utilisateur, envoie les messages formatés, et déclenche la génération des digests.
export class TechWatcherBot {
  private readonly bot: TelegramBot;
  private readonly chatId: string;

  constructor() {
    const config = getConfig();
    this.chatId = config.telegram.chatId;
    this.bot = new TelegramBot(config.telegram.botToken, {
      polling: {
        interval: 2000,
        autoStart: true,
        params: { timeout: 10 },
      },
    });

    this.registerCommands();
    logger.info("Bot Telegram initialisé avec polling");
  }

  // Commandes et gestion des messages
  private registerCommands(): void {
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/digest/, (msg) => this.handleDigest(msg, "daily"));
    this.bot.onText(/\/weekly/, (msg) => this.handleDigest(msg, "weekly"));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));

    this.bot.on("polling_error", (error: Error & { code?: string }) => {
      if (error.code === "EFATAL" || error.message?.includes("ECONNRESET")) {
        logger.debug("Polling reconnexion (ECONNRESET ignoré)");
        return;
      }
      logger.error("Erreur polling Telegram", error);
    });

    logger.info(
      "Commandes enregistrées: /start, /help, /digest, /weekly, /status",
    );
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const text = [
      `*Bienvenue sur ai-tech-watcher !*`,
      ``,
      `Je suis ton bot de veille technologique.`,
      `Je t'envoie des résumés d'actualités tech, IA, frameworks et langages,`,
      `résumés automatiquement par une IA locale (Ollama).`,
      ``,
      `Ton *Chat ID* : \`${chatId}\` (copie-le dans ton \`.env\`)`,
      ``,
      `_Utilise /help pour voir toutes les commandes._`,
    ].join("\n");

    await this.sendMessage(chatId, text);
  }

  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const text = [
      `*Commandes disponibles*`,
      ``,
      `/digest — Génère et envoie un digest quotidien maintenant`,
      `/weekly — Génère et envoie un digest hebdomadaire maintenant`,
      `/status — Vérifie l'état du bot et d'Ollama`,
      `/help — Affiche ce message`,
      ``,
      `*Planification automatique :*`,
      `- Digest quotidien : tous les jours à 8h`,
      `- Digest hebdomadaire : tous les lundis à 10h`,
      ``,
      `_Configurez les horaires dans le fichier \`.env\`_`,
    ].join("\n");

    await this.sendMessage(msg.chat.id.toString(), text);
  }

  private async handleDigest(
    msg: TelegramBot.Message,
    period: "daily" | "weekly",
  ): Promise<void> {
    const chatId = msg.chat.id.toString();
    await this.sendMessage(
      chatId,
      `*Génération du digest ${period === "daily" ? "quotidien" : "hebdomadaire"} en cours...*\n\n_Récupération des flux + résumé IA, cela peut prendre 1-2 minutes._`,
    );

    try {
      const report = await generateDigestUseCase.execute(period);
      await this.sendDigest(report);
    } catch (error) {
      logger.error("Erreur lors de la génération du digest", error);
      const errorMsg = telegramFormatter.formatError(
        "Génération du digest",
        error instanceof Error ? error : new Error(String(error)),
      );
      await this.sendMessage(chatId, errorMsg);
    }
  }

  private async handleStatus(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const config = getConfig();
    const isHealthy = await ollamaService.checkHealth();
    const jobs = scheduler.listJobs();

    const text = telegramFormatter.formatStatus(
      isHealthy,
      config.ollama.model,
      jobs,
    );
    await this.sendMessage(chatId, text);
  }

  // Envoi des messages
  async sendDigest(report: DigestReport): Promise<void> {
    const messages = telegramFormatter.formatDigest(report);

    for (const message of messages) {
      await this.sendMessage(this.chatId, message);
      // Pause courte entre messages pour éviter le rate limiting
      await this.sleep(500);
    }

    logger.info(`Digest envoyé`, {
      chatId: this.chatId,
      messages: messages.length,
    });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } catch (error) {
      try {
        const plain = text.replace(/[*_`[\]]/g, "");
        await this.bot.sendMessage(chatId, plain, {
          disable_web_page_preview: true,
        });
      } catch (retryError) {
        logger.error(`Impossible d'envoyer le message`, retryError, { chatId });
      }
    }
  }

  async stop(): Promise<void> {
    await this.bot.stopPolling();
    logger.info("Bot arrêté");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
