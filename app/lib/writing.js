import fs from 'fs';
import path from 'path';

const WRITING_CATEGORY_LABELS = {
  cryptocurrencies: 'Cryptocurrencies',
  'social-sciences': 'Social Sciences',
  computing: 'Computing',
  startups: 'Startups',
  food: 'Food',
};

function parseFrontMatter(markdown) {
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

function getFirstHeading(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^#\s+(.*)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

export function getLiveWritingByCategory() {
  const baseDir = path.join(process.cwd(), 'writing');
  const sections = [];

  for (const [folder, label] of Object.entries(WRITING_CATEGORY_LABELS)) {
    const directoryPath = path.join(baseDir, folder);
    const entries = [];

    if (fs.existsSync(directoryPath)) {
      const files = fs.readdirSync(directoryPath).filter((file) => file.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const slug = file.replace(/\.md$/, '');
        const markdown = fs.readFileSync(filePath, 'utf8');
        const { data, content } = parseFrontMatter(markdown);

        if (!data || data.status !== 'live') {
          continue;
        }

        const title = getFirstHeading(content) || slug;
        const description = data.description ? String(data.description) : '';
        const href = `writing/${folder}/${slug}`;

        entries.push({
          title,
          description,
          href,
        });
      }
    }

    sections.push({
      label,
      entries,
    });
  }

  return sections;
}
