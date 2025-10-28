import fs from 'fs';
import path from 'path';

import { getExternalWritingEntries } from './rss.js';
import { extractFirstSentenceFromMarkdown, formatPreviewText } from './text.js';

export const WRITING_CATEGORY_LABELS = {
  cryptocurrencies: 'Cryptocurrencies',
  'social-sciences': 'Social Sciences',
  computing: 'Computing',
  startups: 'Startups',
  food: 'Food',
};

const WRITING_BASE_DIR = path.join(process.cwd(), 'writing');

export function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) {
    return { data: {}, content: markdown };
  }

  const closingIndex = markdown.indexOf('\n---', 3);
  if (closingIndex === -1) {
    return { data: {}, content: markdown };
  }

  const frontMatter = markdown.slice(3, closingIndex).trim();
  const content = markdown.slice(closingIndex + 4);
  const data = {};

  for (const line of frontMatter.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]/, '').replace(/['"]$/, '');
    if (key) {
      data[key] = value;
    }
  }

  return { data, content };
}

export function getFirstHeading(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^#\s+(.*)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

function getMarkdownFilePath(category, slug) {
  return path.join(WRITING_BASE_DIR, category, `${slug}.md`);
}

function readWritingMarkdown(category, slug) {
  const filePath = getMarkdownFilePath(category, slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const markdown = fs.readFileSync(filePath, 'utf8');
  const { data, content } = parseFrontMatter(markdown);
  const title = getFirstHeading(content) || slug;
  const status = data?.status ? String(data.status).toLowerCase() : '';
  const description = data?.description ? String(data.description) : '';

  const firstSentence = extractFirstSentenceFromMarkdown(content);

  return {
    category,
    slug,
    filePath,
    data,
    content,
    title,
    status,
    description,
    firstSentence,
  };
}

export function getWritingEntry(category, slug) {
  return readWritingMarkdown(category, slug);
}

export function getLiveWritingEntries() {
  const entries = [];

  for (const category of Object.keys(WRITING_CATEGORY_LABELS)) {
    const directoryPath = path.join(WRITING_BASE_DIR, category);

    if (!fs.existsSync(directoryPath)) {
      continue;
    }

    const files = fs.readdirSync(directoryPath).filter((file) => file.endsWith('.md'));

    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const entry = readWritingMarkdown(category, slug);

      if (!entry || entry.status !== 'live') {
        continue;
      }

      entries.push(entry);
    }
  }

  return entries;
}

function parseDateToMs(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeLocalEntry(entry) {
  const publishedAtMs = parseDateToMs(entry?.data?.date);
  const previewSource = entry.description || entry.firstSentence || '';
  const preview = formatPreviewText(previewSource);

  return {
    title: entry.title,
    description: entry.description,
    href: `writing/${entry.category}/${entry.slug}`,
    category: entry.category,
    publishedAtMs,
    source: 'local',
    preview,
    openInNewTab: true,
  };
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const aTime = typeof a.publishedAtMs === 'number' ? a.publishedAtMs : -Infinity;
    const bTime = typeof b.publishedAtMs === 'number' ? b.publishedAtMs : -Infinity;

    if (aTime === bTime) {
      return a.title.localeCompare(b.title);
    }

    return bTime - aTime;
  });
}

export async function getLiveWritingByCategory() {
  const [externalEntries, liveEntries] = await Promise.all([
    getExternalWritingEntries(),
    Promise.resolve(getLiveWritingEntries()),
  ]);

  const combinedByCategory = new Map();

  for (const entry of liveEntries.map(normalizeLocalEntry)) {
    const entries = combinedByCategory.get(entry.category) ?? [];
    entries.push(entry);
    combinedByCategory.set(entry.category, entries);
  }

  for (const entry of externalEntries) {
    const entries = combinedByCategory.get(entry.category) ?? [];
    if (!entries.some((existing) => existing.href === entry.href)) {
      entries.push(entry);
      combinedByCategory.set(entry.category, entries);
    }
  }

  const sections = [];

  for (const [category, label] of Object.entries(WRITING_CATEGORY_LABELS)) {
    const entries = sortEntries(combinedByCategory.get(category) ?? []).map(
      ({ title, href, preview, openInNewTab }) => ({
        title,
        href,
        preview,
        openInNewTab: Boolean(openInNewTab),
      })
    );

    sections.push({
      label,
      entries,
    });
  }

  return sections;
}

export function getLiveWritingStaticParams() {
  return getLiveWritingEntries().map(({ category, slug }) => ({ category, slug }));
}
