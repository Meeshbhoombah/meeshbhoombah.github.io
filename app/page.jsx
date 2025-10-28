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

function getLiveWritingByCategory() {
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

function renderWritingSections() {
  const sections = getLiveWritingByCategory();
  const rendered = [];

  for (const section of sections) {
    const { label, entries } = section;
    const heading = `<h3>${escapeHtml(label)}</h3>`;

    if (!entries.length) {
      rendered.push(`${heading}\n<p>No live writing yet.</p>`);
      continue;
    }

    const items = entries
      .map(({ title, description, href }) => {
        const link = `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`;
        if (description) {
          return `<li>${link}<p>${escapeHtml(description)}</p></li>`;
        }
        return `<li>${link}</li>`;
      })
      .join('\n');

    rendered.push(`${heading}\n<ul>\n${items}\n</ul>`);
  }

  return rendered.join('\n');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function normalizeParagraphLines(lines) {
  const normalized = [];
  for (const line of lines) {
    if (normalized.length === 0) {
      normalized.push(line);
      continue;
    }

    const previous = normalized[normalized.length - 1];
    const lastChar = previous.slice(-1);
    const firstChar = line.charAt(0);

    if (/^[\p{L}\p{N}]$/u.test(lastChar) && /^[\p{L}\p{N}]/u.test(firstChar)) {
      normalized[normalized.length - 1] = previous + line;
    } else {
      normalized.push(line);
    }
  }

  return normalized;
}

function parseListLine(line) {
  const match = line.match(/^(\s*)([-*+])\s+(.*)$/);
  if (!match) return null;
  return {
    indent: match[1].length,
    content: match[3].trim(),
  };
}

function renderList(lines, startIndex, baseIndent) {
  let html = '<ul>';
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const item = parseListLine(line);
    if (!item || item.indent < baseIndent) {
      break;
    }

    if (item.indent > baseIndent) {
      const [nestedHtml, nextIndex] = renderList(lines, i, item.indent);
      html += nestedHtml;
      i = nextIndex;
      continue;
    }

    html += `<li>${renderInline(escapeHtml(item.content))}`;
    i += 1;

    while (i < lines.length) {
      const nextItem = parseListLine(lines[i]);
      if (!nextItem || nextItem.indent < baseIndent) {
        break;
      }
      if (nextItem.indent > baseIndent) {
        const [nestedHtml, nextIndex] = renderList(lines, i, nextItem.indent);
        html += nestedHtml;
        i = nextIndex;
      } else {
        break;
      }
    }

    html += '</li>';
  }

  html += '</ul>';
  return [html, i];
}

function markdownToHtml(markdown) {
  const withoutFrontMatter = markdown.startsWith('---')
    ? markdown.slice(markdown.indexOf('\n---', 3) + 4)
    : markdown;
  const withoutComments = withoutFrontMatter.replace(/<!--([\s\S]*?)-->/g, '');
  const lines = withoutComments.split(/\r?\n/);
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(escapeHtml(headingMatch[2]));
      html.push(`<h${level}>${content}</h${level}>`);
      i += 1;
      continue;
    }

    const listMatch = parseListLine(line);
    if (listMatch) {
      const [listHtml, nextIndex] = renderList(lines, i, listMatch.indent);
      html.push(listHtml);
      i = nextIndex;
      continue;
    }

    const paragraphLines = [];
    while (i < lines.length && lines[i].trim().length > 0 && !parseListLine(lines[i]) && !/^#{1,6}\s+/.test(lines[i].trim())) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    const normalizedLines = normalizeParagraphLines(paragraphLines);
    const paragraphText = normalizedLines.join(' ').replace(/\s+/g, ' ').trim();
    html.push(`<p>${renderInline(escapeHtml(paragraphText))}</p>`);
  }

  return html.join('\n');
}

export default function HomePage() {
  const filePath = path.join(process.cwd(), 'HOME.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const html = markdownToHtml(fileContent);
  const writingSectionsHtml = renderWritingSections();
  const enhancedHtml = writingSectionsHtml
    ? html.replace('<h2>🖋️</h2>', `<h2>🖋️</h2>\n${writingSectionsHtml}`)
    : html;

  return (
    <main className="content">
      <article
        className="markdown"
        dangerouslySetInnerHTML={{ __html: enhancedHtml }}
      />
    </main>
  );
}
