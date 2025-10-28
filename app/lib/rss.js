import { decodeHtmlEntities, extractFirstSentenceFromText, formatPreviewText } from './text.js';

const FEED_URLS = [
  'https://dev.to/feed/meeshbhoombah',
  'https://medium.com/feed/@meeshbhoombah',
];

const CATEGORY_KEYWORDS = {
  cryptocurrencies: [
    'cryptocurrency',
    'cryptocurrencies',
    'crypto',
    'bitcoin',
    'ethereum',
    'ethdenver',
    'blockchain',
    'web3',
    'defi',
    'nft',
    { keyword: 'token', weight: 0.5 },
    { keyword: 'tokens', weight: 0.5 },
  ],
  'social-sciences': [
    'psychology',
    'sociology',
    'economics',
    'anthropology',
    'behavior',
    'behaviour',
    'culture',
    'society',
    'history',
    'politics',
  ],
  computing: [
    'software',
    'programming',
    'developer',
    'development',
    'coding',
    'code',
    'computer',
    'computing',
    { keyword: 'formal verification', weight: 3 },
    { keyword: 'verification', weight: 1.5 },
    'ai',
    'machine learning',
    'data science',
    'cloud',
    'technology',
    'tech',
    'engineering',
    'software engineering',
  ],
  startups: [
    'startup',
    'startups',
    'entrepreneur',
    'entrepreneurship',
    'founder',
    'founders',
    'business',
    'product',
    'growth',
    'marketing',
    'fundraising',
    'venture capital',
  ],
  food: [
    'food',
    'recipe',
    'recipes',
    'cooking',
    'kitchen',
    'restaurant',
    'baking',
    'coffee',
    'tea',
    'drink',
    'cuisine',
    'dining',
  ],
};

const REVALIDATE_SECONDS = 60 * 60 * 24; // Refresh daily

function decodeCdata(value) {
  if (!value) return '';
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
}

function sanitizeHtmlToText(value) {
  if (!value) return '';
  const withoutCdata = decodeCdata(value);
  const decoded = decodeHtmlEntities(withoutCdata);
  return decoded.replace(/<[^>]*>/g, '').trim();
}

function createTagRegex(tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
}

function getTagValue(xml, tagName) {
  const regex = createTagRegex(tagName);
  const match = xml.match(regex);
  if (!match) return '';
  return decodeCdata(match[1]);
}

function getTagValues(xml, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'gi');
  const values = [];
  let match = regex.exec(xml);
  while (match) {
    values.push(decodeCdata(match[1]));
    match = regex.exec(xml);
  }
  return values;
}

function extractItems(xml) {
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  const items = [];
  let match = itemRegex.exec(xml);
  while (match) {
    items.push(match[0]);
    match = itemRegex.exec(xml);
  }
  return items;
}

function countKeywordOccurrences(text, keyword) {
  if (!text || !keyword) return 0;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundaryWrapped = `\\b${escaped}\\b`;
  const regex = new RegExp(boundaryWrapped, 'gi');
  const matches = text.match(regex);

  return matches ? matches.length : 0;
}

function normalizeKeywordDescriptors(keywords) {
  return keywords
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'string') {
        return { keyword: item.toLowerCase(), weight: 1 };
      }

      const keyword = typeof item.keyword === 'string' ? item.keyword.toLowerCase() : '';
      if (!keyword) return null;

      const weight = Number.isFinite(item.weight) ? Number(item.weight) : 1;
      return { keyword, weight };
    })
    .filter(Boolean);
}

function classifyItem({ title, description, categories }) {
  const haystack = [title, description, ...(categories ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let bestCategory = 'computing';
  let bestScore = Number.NEGATIVE_INFINITY;
  const scores = new Map();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const descriptors = normalizeKeywordDescriptors(keywords);
    const score = descriptors.reduce(
      (total, { keyword, weight }) => total + countKeywordOccurrences(haystack, keyword) * weight,
      0,
    );

    scores.set(category, score);

    if (score > bestScore || (score === bestScore && category === 'computing')) {
      bestCategory = category;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    return 'computing';
  }

  const computingScore = scores.get('computing') ?? 0;
  if (bestCategory !== 'computing' && computingScore > 0) {
    const margin = bestScore - computingScore;
    if (margin <= 0.75) {
      return 'computing';
    }
  }

  return bestCategory;
}

function parseRss(xml) {
  return extractItems(xml).map((itemXml) => {
    const title = getTagValue(itemXml, 'title');
    const link = getTagValue(itemXml, 'link');
    const description = getTagValue(itemXml, 'description');
    const encodedContent = getTagValue(itemXml, 'content:encoded');
    const categories = getTagValues(itemXml, 'category');
    const pubDate = getTagValue(itemXml, 'pubDate') || getTagValue(itemXml, 'updated');

    const summarySource = encodedContent || description;
    const summary = sanitizeHtmlToText(summarySource || '');

    return {
      title: title || link,
      link,
      description: summary,
      rawDescription: description,
      categories,
      publishedAt: pubDate,
    };
  });
}

async function fetchRssFeed(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, text/plain' },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${url}`);
  }

  const xml = await response.text();
  return parseRss(xml);
}

function parseDateToMs(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export async function getExternalWritingEntries() {
  const results = await Promise.all(
    FEED_URLS.map(async (url) => {
      try {
        return await fetchRssFeed(url);
      } catch (error) {
        console.error(error);
        return [];
      }
    })
  );

  const items = results.flat();

  return items
    .filter((item) => item.link)
    .map((item) => {
      const category = classifyItem({
        title: item.title,
        description: item.description,
        categories: item.categories,
      });

      const publishedAtMs = parseDateToMs(item.publishedAt);

      const previewSource = extractFirstSentenceFromText(item.description);
      const isDevToLink = /^https?:\/\/(?:www\.)?dev\.to\//i.test(item.link ?? '');
      const preview = formatPreviewText(previewSource, { isDevToLink });

      return {
        title: item.title,
        description: null,
        href: item.link,
        category,
        publishedAtMs,
        source: 'external',
        preview,
      };
    });
}
