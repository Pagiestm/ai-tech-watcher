import { DigestReport, DigestedNewsItem } from '../../shared/types';
import { CATEGORY_LABELS } from '../../shared/constants';

// Transformer un DigestReport en texte formaté pour Telegram
export class TelegramFormatter {
  formatDigest(report: DigestReport): string[] {
    // Telegram limite les messages à 4096 caractères → on découpe en chunks
    const chunks: string[] = [];

    // Message d'en-tête
    chunks.push(this.buildHeader(report));

    // Messages par article
    for (const item of report.items) {
      chunks.push(this.buildArticleMessage(item));
    }

    // Message de pied de page
    chunks.push(this.buildFooter(report));

    return chunks;
  }

  formatDailySummary(report: DigestReport): string {
    const emoji = report.period === 'daily';
    const title = report.period === 'daily' ? 'DIGEST QUOTIDIEN' : 'DIGEST HEBDOMADAIRE';
    const categoryCount = this.countByCategory(report);

    const lines = [
      `${emoji} *${title} — TECH & IA*`,
      ``,
      `${this.formatDate(report.generatedAt)}`,
      `${report.items.length} articles sélectionnés sur ${report.totalFetched} récupérés`,
      ``,
      `*Répartition par catégorie :*`,
      ...Object.entries(categoryCount).map(([cat, count]) =>
        `${CATEGORY_LABELS[cat] ?? cat} → ${count}`
      ),
    ];

    return lines.join('\n');
  }

  private buildHeader(report: DigestReport): string {
    const emoji = report.period === 'daily';
    const title = report.period === 'daily' ? 'Digest Quotidien' : 'Digest Hebdomadaire';

    return [
      `${emoji} *${title} Tech & IA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `${this.formatDate(report.generatedAt)}`,
      `*${report.items.length} articles* sélectionnés`,
      ``,
      `_Résumés générés par IA locale (Ollama)_`,
      ``,
      `*Voici les actus du moment :*`,
    ].join('\n');
  }

  private buildArticleMessage(item: DigestedNewsItem): string {
    const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;
    const tags = item.tags.map((t) => `#${t.replace(/\s+/g, '_')}`).join(' ');
    const sourceDate = this.formatDate(item.publishedAt);

    return [
      `${item.emoji} *${this.escapeMarkdown(item.title)}*`,
      ``,
      `${item.summary}`,
      ``,
      `${tags}`,
      `${categoryLabel} · ${item.source}`,
      `${sourceDate}`,
      `[Lire l'article](${item.url})`,
      ``,
      `─────────────────────`,
    ].join('\n');
  }

  private buildFooter(report: DigestReport): string {
    return [
      ``,
      `*Fin du digest ${report.period === 'daily' ? 'quotidien' : 'hebdomadaire'}*`,
      ``,
      `_Commandes disponibles : /digest, /status, /help_`,
      `_ai-tech-watcher — Veille technologique automatisée_`,
    ].join('\n');
  }

  formatError(context: string, error: Error): string {
    return [
      `*Erreur — ${context}*`,
      ``,
      `\`${error.message}\``,
      ``,
      `_Réessayez dans quelques instants ou vérifiez les logs._`,
    ].join('\n');
  }

  formatStatus(isHealthy: boolean, model: string, jobNames: string[]): string {
    const status = isHealthy ? 'Opérationnel' : 'Hors ligne';
    return [
      `*Status — ai-tech-watcher*`,
      ``,
      `Ollama : ${status}`,
      `Modèle : \`${model}\``,
      ``,
      `*Jobs planifiés :*`,
      ...jobNames.map((j) => `  • ${j}`),
      ``,
      `_/digest pour lancer un digest maintenant_`,
    ].join('\n');
  }

  private countByCategory(report: DigestReport): Record<string, number> {
    return report.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}

export const telegramFormatter = new TelegramFormatter();
