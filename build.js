#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const SITE_DIR = "_site";
const TEMPLATE_DIR = "templates";
const ROOT = process.cwd();

function readTemplate(name) {
  const filePath = path.join(ROOT, TEMPLATE_DIR, name);
  return fs.readFileSync(filePath, "utf8");
}

const templates = {
  base: readTemplate("base.html"),
  home: readTemplate("home.html"),
  page: readTemplate("page.html"),
  writing: readTemplate("writing.html"),
  writingIndex: readTemplate("writing-index.html"),
};

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function normalizeLinkUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || trimmed.startsWith("#")) {
    return trimmed;
  }

  let pathPart = trimmed;
  let hash = "";
  let query = "";

  const hashIndex = trimmed.indexOf("#");
  if (hashIndex !== -1) {
    hash = trimmed.slice(hashIndex);
    pathPart = trimmed.slice(0, hashIndex);
  }

  const queryIndex = pathPart.indexOf("?");
  if (queryIndex !== -1) {
    query = pathPart.slice(queryIndex);
    pathPart = pathPart.slice(0, queryIndex);
  }

  let normalized = pathPart;
  if (normalized.endsWith(".md")) {
    normalized = normalized.slice(0, -3);
  } else if (normalized.endsWith(".md/")) {
    normalized = normalized.slice(0, -4) + "/";
  }

  if (!normalized) {
    normalized = "/";
  }

  if (!normalized.endsWith("/") && !path.extname(normalized)) {
    normalized += "/";
  }

  return `${normalized}${query}${hash}`;
}

function renderInline(text) {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "`") {
      let j = i + 1;
      while (j < text.length && text[j] !== "`") {
        j += 1;
      }
      if (j < text.length) {
        const code = text.slice(i + 1, j);
        result += `<code>${escapeHtml(code)}</code>`;
        i = j + 1;
        continue;
      }
    }

    if (char === "[") {
      const closeBracket = text.indexOf("]", i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        let depth = 1;
        let j = closeBracket + 2;
        while (j < text.length && depth > 0) {
          if (text[j] === "(") depth += 1;
          else if (text[j] === ")") depth -= 1;
          j += 1;
        }
        if (depth === 0) {
          const label = text.slice(i + 1, closeBracket);
          const url = text.slice(closeBracket + 2, j - 1);
          const normalizedUrl = normalizeLinkUrl(url);
          result += `<a href="${escapeHtmlAttribute(normalizedUrl)}">${renderInline(label)}</a>`;
          i = j;
          continue;
        }
      }
    }

    if (char === "*" || char === "_") {
      const marker = char;
      const isDouble = text[i + 1] === marker;
      const start = i + (isDouble ? 2 : 1);
      let j = text.indexOf(isDouble ? marker + marker : marker, start);
      if (j !== -1) {
        const inner = renderInline(text.slice(start, j));
        const tag = isDouble ? "strong" : "em";
        result += `<${tag}>${inner}</${tag}>`;
        i = j + (isDouble ? 2 : 1);
        continue;
      }
    }

    result += escapeHtml(char);
    i += 1;
  }
  return result;
}

function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== "---") {
    return { data: {}, body: raw };
  }

  let i = 1;
  const data = {};
  while (i < lines.length) {
    const line = lines[i];
    if (line === "---") {
      i += 1;
      break;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const [key, ...rest] = line.split(":");
    const valueRaw = rest.join(":").trim();
    data[key.trim()] = parseFrontMatterValue(valueRaw);
    i += 1;
  }

  const body = lines.slice(i).join("\n");
  return { data, body };
}

function parseFrontMatterValue(value) {
  if (!value) return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1);
    if (!inner.trim()) {
      return [];
    }
    return inner
      .split(",")
      .map((segment) => segment.trim())
      .map((segment) => segment.replace(/^['"]|['"]$/g, ""));
  }
  return value.replace(/^['"]|['"]$/g, "");
}

function parseList(lines, startIndex, indentLevel) {
  let i = startIndex;
  let listType = null;
  const items = [];

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      break;
    }
    const match = line.trimEnd().match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
    if (!match) {
      break;
    }
    const indent = Math.floor((match[1] || "").length / 2);
    if (indent < indentLevel) {
      break;
    }
    if (indent > indentLevel) {
      const { html, nextIndex } = parseList(lines, i, indent);
      if (items.length) {
        items[items.length - 1] += html;
      } else {
        items.push(html);
      }
      i = nextIndex;
      continue;
    }

    const marker = match[2];
    const textValue = match[3];
    const type = marker.endsWith(".") ? "ol" : "ul";
    if (!listType) {
      listType = type;
    }

    let itemContent = renderInline(textValue);
    i += 1;

    while (i < lines.length) {
      const nextLine = lines[i];
      if (!nextLine.trim()) {
        break;
      }
      const nextMatch = nextLine.trimEnd().match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
      if (nextMatch) {
        const nextIndent = Math.floor((nextMatch[1] || "").length / 2);
        if (nextIndent > indentLevel) {
          const { html, nextIndex } = parseList(lines, i, nextIndent);
          itemContent += html;
          i = nextIndex;
          continue;
        }
        if (nextIndent < indentLevel) {
          break;
        }
        break;
      }
      if (/^\s{2,}/.test(nextLine)) {
        itemContent += ` ${renderInline(nextLine.trim())}`;
        i += 1;
        continue;
      }
      const trimmedNext = nextLine.trim();
      if (/^#{1,6}\s/.test(trimmedNext) || trimmedNext.startsWith(">")) {
        break;
      }
      break;
    }

    items.push(`<li>${itemContent}</li>`);

    if (i < lines.length && !lines[i].trim()) {
      i += 1;
    }
  }

  if (!listType) {
    return { html: "", nextIndex: startIndex };
  }

  return {
    html: `<${listType}>${items.join("")}</${listType}>`,
    nextIndex: i,
  };
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let i = 0;

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(" ").trim())}</p>`);
      paragraph = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    if (!trimmed.trim()) {
      flushParagraph();
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const content = headingMatch[2].trim();
      html.push(`<h${level}>${renderInline(content)}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteLines = [];
      while (i < lines.length) {
        const current = lines[i];
        if (!current.trim().startsWith(">")) break;
        quoteLines.push(current.replace(/^\s*>\s?/, ""));
        i += 1;
      }
      const quoteHtml = markdownToHtml(quoteLines.join("\n"));
      html.push(`<blockquote>${quoteHtml}</blockquote>`);
      continue;
    }

    const listMatch = trimmed.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      const indent = Math.floor((listMatch[1] || "").length / 2);
      const { html: listHtml, nextIndex } = parseList(lines, i, indent);
      html.push(listHtml);
      i = nextIndex;
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }

  flushParagraph();
  return html.join("\n");
}

function findMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === SITE_DIR || entry.name === TEMPLATE_DIR || entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function deriveUrl(fromPath, data) {
  if (data.permalink) {
    let permalink = data.permalink.trim();
    if (!permalink.startsWith("/")) {
      permalink = `/${permalink}`;
    }
    if (!path.extname(permalink)) {
      if (!permalink.endsWith("/")) {
        permalink = `${permalink}/`;
      }
    }
    return permalink;
  }
  const relative = path.relative(ROOT, fromPath).replace(/\\/g, "/");
  const withoutExt = relative.replace(/\.md$/, "");
  return `/${withoutExt}/`;
}

function outputPathFromUrl(url) {
  if (url.endsWith("/")) {
    return path.join(ROOT, SITE_DIR, url, "index.html");
  }
  return path.join(ROOT, SITE_DIR, url);
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function getFirstLiveDate(filePath) {
  try {
    const relPath = path.relative(ROOT, filePath);
    const command = `git log --follow --diff-filter=A --format=%aI -- "${relPath}"`;
    const output = execSync(command, { encoding: "utf8" }).trim();
    if (!output) return null;
    const lines = output.split(/\r?\n/).filter(Boolean);
    const iso = lines[lines.length - 1];
    return new Date(iso);
  } catch (error) {
    return null;
  }
}

function getLastCommitDate(filePath) {
  try {
    const relPath = path.relative(ROOT, filePath);
    const command = `git log -1 --format=%aI -- "${relPath}"`;
    const output = execSync(command, { encoding: "utf8" }).trim();
    if (!output) return null;
    return new Date(output.split(/\r?\n/)[0]);
  } catch (error) {
    return null;
  }
}

function renderTemplate(template, context) {
  return template.replace(/{{(\w+)}}/g, (_, key) => (context[key] ?? ""));
}

function renderPageBody(page, liveWriting) {
  const { layout, title, description, contentHtml } = page;
  if (layout === "home") {
    const listHtml = renderLiveWritingSection(liveWriting, {
      containerClass: "home-writing",
      heading: "Latest Writing",
      includeDates: true,
    });
    return renderTemplate(templates.home, {
      content: contentHtml,
      liveWriting: listHtml,
    });
  }

  if (layout === "writing") {
    return renderTemplate(templates.writing, {
      titleBlock: title ? `<h1>${escapeHtml(title)}</h1>` : "",
      descriptionBlock: description ? `<p class="lead">${escapeHtml(description)}</p>` : "",
      content: contentHtml,
    });
  }

  if (layout === "writing-index") {
    const intro = contentHtml ? `<div class="writing-intro">${contentHtml}</div>` : "";
    const listHtml = renderLiveWritingSection(liveWriting, {
      heading: "Published entries",
      includeDates: true,
    });
    return renderTemplate(templates.writingIndex, {
      intro,
      liveWriting: listHtml,
    });
  }

  return renderTemplate(templates.page, {
    titleBlock: title ? `<h1>${escapeHtml(title)}</h1>` : "",
    content: contentHtml,
  });
}

function renderLiveWritingSection(entries, { containerClass = "", heading, includeDates = false } = {}) {
  if (!entries.length) {
    return "";
  }
  const items = entries
    .map((entry) => {
      const datePart = includeDates && entry.firstLiveDate
        ? `<span class="home-writing__date">${formatDate(entry.firstLiveDate)}</span>`
        : "";
      return `<li><a href="${escapeHtmlAttribute(entry.url)}">${escapeHtml(entry.title)}</a>${datePart ? ` ${datePart}` : ""}</li>`;
    })
    .join("\n");
  const headingHtml = heading ? `<h2>${escapeHtml(heading)}</h2>` : "";
  const listHtml = `<ul>${items}</ul>`;
  return `<section class="${containerClass}">${headingHtml}${listHtml}</section>`;
}

function buildSite() {
  if (fs.existsSync(SITE_DIR)) {
    fs.rmSync(SITE_DIR, { recursive: true, force: true });
  }
  ensureDir(path.join(ROOT, SITE_DIR));

  const markdownFiles = findMarkdownFiles(ROOT);
  const pages = markdownFiles
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.trimStart().startsWith('---')) {
        return null;
      }
      const { data, body } = parseFrontMatter(raw);
      const contentHtml = markdownToHtml(body.trim());
    const url = deriveUrl(filePath, data);
    const outputPath = outputPathFromUrl(url);
    return {
      sourcePath: filePath,
      frontMatter: data,
      layout: data.layout || "page",
      title: data.title || "",
      description: data.description || "",
      contentHtml,
      url,
      outputPath,
    };
  })
    .filter(Boolean);

  const liveWriting = pages
    .filter((page) => page.frontMatter.status === "live")
    .map((page) => {
      const firstLiveDate = getFirstLiveDate(page.sourcePath) || getLastCommitDate(page.sourcePath);
      return {
        title: page.title || path.basename(page.sourcePath, ".md"),
        url: page.url,
        firstLiveDate,
      };
    })
    .sort((a, b) => {
      const aTime = a.firstLiveDate ? a.firstLiveDate.getTime() : 0;
      const bTime = b.firstLiveDate ? b.firstLiveDate.getTime() : 0;
      return bTime - aTime;
    });

  for (const page of pages) {
    const body = renderPageBody(page, liveWriting);
    const fullTitle = page.title ? `${page.title} · Meeshbhoombah` : "Meeshbhoombah";
    const finalHtml = renderTemplate(templates.base, {
      fullTitle,
      body,
      year: String(new Date().getFullYear()),
    });
    const destination = page.outputPath;
    ensureDir(path.dirname(destination));
    fs.writeFileSync(destination, finalHtml, "utf8");
  }

  const stylesheetSrc = path.join(ROOT, "styles.css");
  if (fs.existsSync(stylesheetSrc)) {
    const stylesheetDest = path.join(ROOT, SITE_DIR, "styles.css");
    fs.copyFileSync(stylesheetSrc, stylesheetDest);
  }
}

if (require.main === module) {
  try {
    buildSite();
    console.log("Site build complete.");
  } catch (error) {
    console.error("Site build failed:", error);
    process.exit(1);
  }
}
