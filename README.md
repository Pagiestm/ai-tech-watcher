# ai-tech-watcher

Bot Telegram de **veille technologique automatisée** avec résumés générés par IA locale (Ollama).

Il scrape des flux RSS tech (IA, frameworks, langages, cloud, sécurité), résume chaque article avec un LLM local, et t'envoie un digest propre et lisible sur Telegram.

## Installation - Étape par étape

### Prérequis

- **Node.js 22+** (ou 24 recommandé)
- **Ollama** installé en local → [ollama.com/download](https://ollama.com/download)
- Un **bot Telegram** créé via [@BotFather](https://t.me/BotFather)

### Étape 1 - Créer ton bot Telegram

1. Ouvre Telegram et cherche `@BotFather`
2. Envoie `/newbot`
3. Choisis un nom affiché (ex: `AI Tech Watcher`)
4. Choisis un username se terminant par `bot` (ex: `ai_tech_watcher_bot`)
5. **Copie le token** fourni → `123456789:ABCdefGHIjklMNO...`

Pour obtenir ton **Chat ID** :
1. Démarre le bot (envoie-lui `/start`)
2. Le bot t'affichera ton Chat ID directement dans le message de bienvenue

### Étape 2 - Installer et démarrer Ollama

```bash
# Télécharger Ollama (Linux/Mac)
curl -fsSL https://ollama.com/install.sh | sh

# Démarrer le serveur Ollama
ollama serve

# Dans un autre terminal - télécharger un modèle
# Recommandations selon tes ressources :
ollama pull llama3.2        # ~2GB - bon équilibre qualité/vitesse
ollama pull mistral         # ~4GB - excellente qualité
ollama pull gemma3          # ~3GB - rapide et efficace
ollama pull qwen2.5:3b      # ~2GB - très léger

# Tester que ça fonctionne
ollama list
```

### Étape 3 - Cloner et installer le projet

```bash
# Cloner le repo (ou décompresser tes fichiers)
git clone <ton-repo> ai-tech-watcher
cd ai-tech-watcher

# Installer les dépendances
npm install

# Copier le fichier de config
cp .env.example .env
```

### Étape 4 - Configurer le `.env`

Édite le fichier `.env` :

```env
# Obligatoires
TELEGRAM_BOT_TOKEN=123456789:TON_TOKEN_ICI
TELEGRAM_CHAT_ID=987654321

# Ollama - adapte le modèle à ce que tu as installé
OLLAMA_MODEL=llama3.2

# Optionnel - personnaliser les horaires
CRON_DAILY=0 8 * * *        # Chaque jour à 8h
CRON_WEEKLY=0 10 * * 1      # Chaque lundi à 10h
TIMEZONE=Europe/Paris
MAX_ITEMS=10
DIGEST_LANGUAGE=français
```

### Étape 5 - Lancer le bot

```bash
# Mode développement (hot-reload)
npm run dev

# Mode production
npm run build && npm start
```

## Commandes Telegram

| Commande   | Description                                      |
|------------|--------------------------------------------------|
| `/start`   | Message de bienvenue + affiche ton Chat ID       |
| `/digest`  | Lance un digest quotidien immédiatement          |
| `/weekly`  | Lance un digest hebdomadaire immédiatement       |
| `/status`  | Vérifie l'état d'Ollama + jobs planifiés         |
| `/help`    | Liste toutes les commandes                       |

## Personnalisation

### Ajouter/modifier des sources RSS

Édite `src/shared/constants/index.ts` - tableau `DEFAULT_FEED_SOURCES` :

```typescript
export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  // Ajouter une nouvelle source :
  {
    name: 'Mon blog favori',
    url: 'https://monblog.com/feed.xml',
    category: 'ai',        // 'ai' | 'framework' | 'language' | 'tool' | 'cloud' | 'security' | 'other'
    enabled: true,
  },
  // Désactiver une source sans la supprimer :
  {
    name: 'Source trop bruitée',
    url: 'https://...',
    category: 'other',
    enabled: false,         // désactivée
  },
];
```

### Changer le modèle Ollama

Dans `.env` :
```env
OLLAMA_MODEL=mistral   # ou gemma3, qwen2.5:3b, etc.
```

### Changer les horaires de digest

Les expressions cron suivent le standard 5 champs (`minute heure jour mois jour_semaine`) :

```env
CRON_DAILY=0 7 * * *        # Chaque jour à 7h
CRON_DAILY=0 9 * * 1-5      # Lundi au vendredi à 9h
CRON_WEEKLY=0 18 * * 5      # Chaque vendredi à 18h
```

Testeur en ligne : [crontab.guru](https://crontab.guru)

### Modifier le prompt IA

Édite `src/infrastructure/ai/ollama.service.ts` - fonction `summarize()`, variable `prompt`.

### Changer le format des messages Telegram

Édite `src/presentation/formatters/telegram.formatter.ts` - les méthodes `buildHeader()`, `buildArticleMessage()`, `buildFooter()`.

### Ajouter une nouvelle commande Telegram

Dans `src/presentation/telegram/bot.ts`, dans `registerCommands()` :

```typescript
this.bot.onText(/\/ma_commande/, (msg) => this.handleMaCommande(msg));

private async handleMaCommande(msg: TelegramBot.Message): Promise<void> {
  await this.sendMessage(msg.chat.id.toString(), 'Ma réponse');
}
```

## Flux de données

```
[RSS Feeds]
    │  rss-parser + cheerio
    ▼
[FeedService]            <= infrastructure/feeds/
    │  NewsItem[]
    ▼
[GenerateDigestUseCase]  <= domain/usecases/
    │  → déduplique, trie, sélectionne
    │  → appelle OllamaService pour chaque article
    │  DigestReport
    ▼
[TelegramFormatter]      <= presentation/formatters/
    │  string[] (chunks Markdown)
    ▼
[TechWatcherBot]         <= presentation/telegram/
    │  bot.sendMessage()
    ▼
[Utilisateur Telegram]
```

## Dépannage

### Ollama non disponible au démarrage

```bash
# Vérifier qu'Ollama tourne
ollama list

# Si pas démarré
ollama serve

# Vérifier que le modèle est téléchargé
ollama pull llama3.2
```

### Le bot ne répond pas sur Telegram

1. Vérifie que `TELEGRAM_BOT_TOKEN` est correct
2. Vérifie que `TELEGRAM_CHAT_ID` est le tien (envoie `/start` au bot)
3. Assure-toi qu'un seul processus utilise ce bot (pas deux instances)

### Les résumés IA sont mauvais

- Essaie un modèle plus puissant : `ollama pull mistral` puis `OLLAMA_MODEL=mistral`
- Ajuste le prompt dans `ollama.service.ts` pour être plus spécifique
- Augmente `MAX_ITEMS` pour avoir plus d'articles, le filtre sera plus sélectif

### Un flux RSS échoue

Les erreurs de flux sont **non-bloquantes** : si un flux échoue, les autres continuent.
Active les logs debug pour voir les détails :

```env
LOG_LEVEL=debug
```