const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function decodeHtmlEntities(value) {
  if (!value) return '';
  return value.replace(/&(amp|lt|gt|quot|#39);/gi, (match) => {
    const decoded = HTML_ENTITIES[match.toLowerCase()];
    return typeof decoded === 'string' ? decoded : match;
  });
}

function stripInlineMarkdown(value) {
  if (!value) return '';

  let text = value;

  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/!\[[^\]]*?\]\([^)]*?\)/g, '');
  text = text.replace(/\[([^\]]+?)\]\([^)]*?\)/g, '$1');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, '$1');
  text = text.replace(/&nbsp;/gi, ' ');
  text = decodeHtmlEntities(text);

  return text;
}

export function extractFirstSentenceFromText(text) {
  if (!text) return '';

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const sentenceMatch = normalized.match(/^(.+?[.!?])(?=\s|$)/);
  if (sentenceMatch) {
    return sentenceMatch[1].trim();
  }

  return normalized;
}

export function extractFirstSentenceFromMarkdown(markdown) {
  if (!markdown) return '';

  const lines = markdown.split(/\r?\n/);
  let paragraphLines = [];

  function processParagraph() {
    if (paragraphLines.length === 0) {
      return '';
    }

    const combined = paragraphLines.join(' ');
    const stripped = stripInlineMarkdown(combined)
      .replace(/^\s*>+\s*/g, '')
      .replace(/^\s*[-*+]\s+/g, '')
      .replace(/^\s*\d+\.\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    paragraphLines = [];

    if (!stripped) {
      return '';
    }

    return extractFirstSentenceFromText(stripped);
  }

  for (const originalLine of lines) {
    const line = originalLine.trim();

    if (!line) {
      const sentence = processParagraph();
      if (sentence) {
        return sentence;
      }
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const sentence = processParagraph();
      if (sentence) {
        return sentence;
      }
      continue;
    }

    const cleanedLine = line
      .replace(/^>+\s*/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '');

    paragraphLines.push(cleanedLine);
  }

  return processParagraph();
}

export function formatPreviewText(value, { isDevToLink = false } = {}) {
  if (!value) {
    return '';
  }

  let text = value.trim();

  if (isDevToLink) {
    text = text
      .replace(/^(&lt;|<)p(&gt;|>)/i, '')
      .replace(/(&lt;|<)\/p(&gt;|>)$/i, '')
      .trim();
  }

  if (!text) {
    return '';
  }

  const withoutOuterQuotes = text.replace(/^"+/, '').replace(/"+$/, '').trim();

  if (!withoutOuterQuotes) {
    return '';
  }

  return `"${withoutOuterQuotes}"`;
}
