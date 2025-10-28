import fs from 'fs';

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
    'ai',
    'machine learning',
    'data science',
    'cloud',
    'technology',
    'tech',
    'engineering',
    { keyword: 'formal methods', weight: 3 },
    { keyword: 'formal verification', weight: 3 },
    { pattern: /\bverif(?:y|ication|ying|ied|ier|iers)\b/gi, weight: 2 },
    { keyword: 'static analysis', weight: 2 },
    { keyword: 'smart contract', weight: 2 },
    { keyword: 'smart contracts', weight: 2 },
    { keyword: 'solidity', weight: 2 },
    { keyword: 'type system', weight: 2 },
    { keyword: 'type checking', weight: 2 },
    { pattern: /\balgorithm(?:s)?\b/gi, weight: 1.5 },
    { keyword: 'protocol', weight: 1.5 },
    { keyword: 'specification', weight: 1.5 },
    { pattern: /\bzero[-\s]?knowledge\b/gi, weight: 2 },
    { keyword: 'distributed systems', weight: 2 },
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
const RSS_FEED_FIXTURE = process.env.RSS_FEED_FIXTURE ?? '';

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

function countKeywordOccurrences(text, keyword, options = {}) {
  if (!text || !keyword) return 0;

  const regex = createKeywordRegex(keyword, options);
  const matches = text.match(regex);

  return matches ? matches.length : 0;
}

function createKeywordRegex(keyword, { partial = false } = {}) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundaryWrapped = partial ? escaped : `\\b${escaped}\\b`;
  return new RegExp(boundaryWrapped, 'gi');
}

function getKeywordScore(text, keywordEntry) {
  if (!text || !keywordEntry) return 0;

  if (typeof keywordEntry === 'string') {
    return countKeywordOccurrences(text, keywordEntry);
  }

  const { keyword, pattern, weight = 1, partial = false } = keywordEntry;
  let regex;

  if (pattern) {
    if (pattern instanceof RegExp) {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      regex = new RegExp(pattern.source, flags);
    } else {
      regex = new RegExp(pattern, 'gi');
    }
  } else if (keyword) {
    regex = createKeywordRegex(keyword, { partial });
  } else {
    return 0;
  }

  const matches = text.match(regex);
  return matches ? matches.length * weight : 0;
}

export function classifyItem({ title, description, categories }) {
  const haystack = [title, description, ...(categories ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let bestCategory = 'computing';
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (total, keywordEntry) => total + getKeywordScore(haystack, keywordEntry),
      0,
    );

    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    return 'computing';
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

let cachedFixtureEntries = null;

function normalizeFixtureEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const categories = Array.isArray(entry.categories)
    ? entry.categories.map((value) => String(value)).filter(Boolean)
    : [];

  return {
    title: entry.title ?? entry.link ?? '',
    link: entry.link ?? '',
    description: entry.description ?? '',
    rawDescription: entry.rawDescription ?? entry.description ?? '',
    categories,
    publishedAt: entry.publishedAt ?? entry.pubDate ?? '',
  };
}

function loadFixtureEntries() {
  if (!RSS_FEED_FIXTURE) {
    return null;
  }

  if (cachedFixtureEntries) {
    return cachedFixtureEntries;
  }

  try {
    const raw = fs.readFileSync(RSS_FEED_FIXTURE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.error(
        'RSS_FEED_FIXTURE must point to a JSON array of feed entries. Received:',
        typeof parsed,
      );
      return null;
    }

    cachedFixtureEntries = parsed
      .map(normalizeFixtureEntry)
      .filter((entry) => entry && entry.link);

    return cachedFixtureEntries;
  } catch (error) {
    console.error('Failed to read RSS fixture data:', error);
    return null;
  }
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

async function loadFeedItems() {
  const fixtureEntries = loadFixtureEntries();

  if (fixtureEntries) {
    return fixtureEntries;
  }

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

  return results.flat();
}

export async function getExternalWritingEntries() {
  const items = await loadFeedItems();

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
