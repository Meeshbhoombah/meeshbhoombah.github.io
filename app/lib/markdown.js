function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtmlAttribute(text) {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function processInline(text) {
  let result = '';
  let buffer = '';

  const flushBuffer = () => {
    if (buffer) {
      result += escapeHtml(buffer);
      buffer = '';
    }
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '`') {
      const closing = text.indexOf('`', index + 1);
      if (closing !== -1) {
        flushBuffer();
        const code = text.slice(index + 1, closing);
        result += `<code>${escapeHtml(code)}</code>`;
        index = closing;
        continue;
      }
    }

    if (char === '[') {
      const closingBracket = text.indexOf(']', index + 1);
      const openingParen = text.indexOf('(', closingBracket);
      const closingParen = text.indexOf(')', openingParen);

      if (
        closingBracket !== -1 &&
        openingParen === closingBracket + 1 &&
        closingParen !== -1
      ) {
        const linkText = text.slice(index + 1, closingBracket);
        const href = text.slice(openingParen + 1, closingParen);
        flushBuffer();
        result += `<a href="${escapeHtmlAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)}</a>`;
        index = closingParen;
        continue;
      }
    }

    if (char === '*' || char === '_') {
      const marker = char;
      const doubleMarker = marker.repeat(2);

      if (text.slice(index, index + 2) === doubleMarker) {
        const closing = text.indexOf(doubleMarker, index + 2);
        if (closing !== -1) {
          const inner = text.slice(index + 2, closing);
          flushBuffer();
          result += `<strong>${processInline(inner)}</strong>`;
          index = closing + 1;
          continue;
        }
      } else {
        const closing = text.indexOf(marker, index + 1);
        if (closing !== -1) {
          const inner = text.slice(index + 1, closing);
          flushBuffer();
          result += `<em>${processInline(inner)}</em>`;
          index = closing;
          continue;
        }
      }
    }

    buffer += char;
  }

  flushBuffer();
  return result;
}

function flushParagraphsFromLines(lines, htmlParts) {
  let paragraphLines = [];

  const flush = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    const paragraph = paragraphLines.join(' ').trim();
    if (paragraph) {
      htmlParts.push(`<p>${processInline(paragraph)}</p>`);
    }
    paragraphLines = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
    } else {
      paragraphLines.push(line.trim());
    }
  }

  flush();
}

export function renderMarkdownToHtml(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const htmlParts = [];

  let paragraphBuffer = [];
  let inList = false;
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }
    const paragraph = paragraphBuffer.join(' ').trim();
    if (paragraph) {
      htmlParts.push(`<p>${processInline(paragraph)}</p>`);
    }
    paragraphBuffer = [];
  };

  const closeList = () => {
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }
  };

  const flushBlockquote = () => {
    if (!inBlockquote) {
      return;
    }

    htmlParts.push('<blockquote>');
    flushParagraphsFromLines(blockquoteLines, htmlParts);
    htmlParts.push('</blockquote>');
    blockquoteLines = [];
    inBlockquote = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      flushBlockquote();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      flushBlockquote();

      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      htmlParts.push(`<h${level}>${processInline(text)}</h${level}>`);
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        inBlockquote = true;
        blockquoteLines = [];
      }
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    }

    if (inBlockquote) {
      flushBlockquote();
    }

    const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      htmlParts.push(`<li>${processInline(listMatch[1].trim())}</li>`);
      continue;
    }

    closeList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();
  flushBlockquote();

  return htmlParts.join('');
}
