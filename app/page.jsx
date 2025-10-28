import fs from 'fs';
import path from 'path';

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

  return (
    <main className="content">
      <article
        className="markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
