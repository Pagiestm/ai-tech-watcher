import { FeedSource } from '../types';


// CONSTANTES — sources RSS & defaults
export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  // IA & Machine Learning
  { name: 'Hacker News (AI)', url: 'https://hnrss.org/newest?q=artificial+intelligence+OR+machine+learning&count=10', category: 'ai', enabled: true },
  { name: 'The Gradient', url: 'https://thegradient.pub/rss/', category: 'ai', enabled: true },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', category: 'ai', enabled: true },
  { name: 'Towards Data Science', url: 'https://towardsdatascience.com/feed', category: 'ai', enabled: true },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', category: 'ai', enabled: true },

  // Frameworks & Langages
  { name: 'Dev.to (webdev)', url: 'https://dev.to/feed/tag/webdev', category: 'framework', enabled: true },
  { name: 'Dev.to (javascript)', url: 'https://dev.to/feed/tag/javascript', category: 'language', enabled: true },
  { name: 'CSS Tricks', url: 'https://css-tricks.com/feed/', category: 'framework', enabled: true },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: 'framework', enabled: true },
  { name: 'InfoQ', url: 'https://www.infoq.com/feed/', category: 'language', enabled: true },

  // Cloud & DevOps
  { name: 'AWS News', url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'cloud', enabled: true },
  { name: 'Google Cloud Blog', url: 'https://cloudblog.withgoogle.com/rss/', category: 'cloud', enabled: true },

  // Sécurité
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'security', enabled: true },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'security', enabled: true },

  // Tech générale
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tool', enabled: true },
  { name: 'Ars Technica', url: 'http://feeds.arstechnica.com/arstechnica/index', category: 'other', enabled: true },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ai: 'Intelligence Artificielle',
  framework: 'Frameworks',
  language: 'Langages',
  tool: 'Outils',
  cloud: 'Cloud',
  security: 'Sécurité',
  other: 'Divers',
};

export const DEFAULT_MAX_ITEMS_PER_DIGEST = 10;
export const DEFAULT_MAX_CONTENT_LENGTH = 2000;
export const OLLAMA_DEFAULT_MODEL = 'llama3.2';
export const OLLAMA_BASE_URL = 'http://localhost:11434';
