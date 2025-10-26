#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const SITE_DIR = "_site";
const TEMPLATE_DIR = "templates";
const ROOT = process.cwd();
const WRITING_DIR = path.join(ROOT, "writing");

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

const CATEGORY_ORDER = [
  "Cryptocurrencies",
  "Social Sciences",
  "Computing",
  "Startups",
  "Food",
];

const CATEGORY_ALIASES = new Map(
  [
    "crypto",
    "cryptocurrency",
    "cryptocurrencies",
    "blockchain",
  ].map((value) => [value, "Cryptocurrencies"])
);

[
  "social science",
  "social sciences",
  "social-sciences",
  "sociology",
].forEach((value) => CATEGORY_ALIASES.set(value, "Social Sciences"));

[
  "computing",
  "computer science",
  "software",
  "engineering",
  "tech",
].forEach((value) => CATEGORY_ALIASES.set(value, "Computing"));

[
  "startup",
  "startups",
  "founder",
  "founders",
  "entrepreneurship",
].forEach((value) => CATEGORY_ALIASES.set(value, "Startups"));

[
  "food",
  "cooking",
  "dining",
  "recipes",
].forEach((value) => CATEGORY_ALIASES.set(value, "Food"));

const CATEGORY_SET = new Set(CATEGORY_ORDER);

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

  if (!normalized.startsWith(".") && !normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (!path.extname(normalized)) {
    normalized = normalized.replace(/\/+$/, "");
    if (!normalized) {
      normalized = "/";
    }
  }

  return `${normalized}${query}${hash}`;
}

function extractFirstHeading(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const match = line.match(/^#\s+(.*)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
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

function isInsideWritingDir(filePath) {
  const relative = path.relative(WRITING_DIR, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isExternalWritingPath(filePath) {
  if (!isInsideWritingDir(filePath)) {
    return false;
  }
  const relative = path
    .relative(WRITING_DIR, filePath)
    .replace(/\\/g, "/")
    .toLowerCase();
  if (!relative) {
    return false;
  }
  if (relative === "readme.md") {
    return false;
  }
  const [firstSegment] = relative.split("/");
  return firstSegment === "dev.to" || firstSegment === "medium";
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
    if (!path.extname(permalink) && permalink !== "/") {
      permalink = permalink.replace(/\/+$/, "");
    }
    return permalink || "/";
  }
  const relative = path.relative(ROOT, fromPath).replace(/\\/g, "/");
  if (relative.toLowerCase() === "writing/readme.md") {
    return "/writing";
  }
  const withoutExt = relative.replace(/\.md$/, "");
  return `/${withoutExt}`;
}

function outputPathFromUrl(url) {
  if (!path.extname(url)) {
    if (url === "/") {
      return path.join(ROOT, SITE_DIR, "index.html");
    }
    const relative = url.replace(/^\//, "");
    return path.join(ROOT, SITE_DIR, relative, "index.html");
  }
  const relative = url.replace(/^\//, "");
  return path.join(ROOT, SITE_DIR, relative);
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

function inferLayout(data, sourcePath) {
  if (data.layout) {
    return data.layout;
  }
  const relative = path.relative(ROOT, sourcePath).replace(/\\/g, "/");
  if (relative === "HOME.md") {
    return "home";
  }
  if (relative.toLowerCase() === "writing/readme.md") {
    return "writing-index";
  }
  if (isInsideWritingDir(sourcePath)) {
    return "writing";
  }
  return "page";
}

function renderPageBody(page, liveWriting) {
  const { layout, title, description, contentHtml } = page;
  if (layout === "home") {
    const listHtml = renderLiveWritingSection(liveWriting, {
      containerClass: "home-writing",
      heading: "🖋️",
      includeDates: true,
      groupByCategory: true,
    });

    let contentWithWriting = contentHtml;
    if (listHtml) {
      const sectionMarker = "<h2>♾</h2>";
      const markerIndex = contentWithWriting.indexOf(sectionMarker);
      if (markerIndex !== -1) {
        contentWithWriting = `${contentWithWriting.slice(0, markerIndex)}${listHtml}${contentWithWriting.slice(markerIndex)}`;
      } else {
        contentWithWriting += listHtml;
      }
    }

    return renderTemplate(templates.home, {
      content: contentWithWriting,
      liveWriting: "",
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
      groupByCategory: true,
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

function renderLiveWritingSection(entries, { containerClass = "", heading, includeDates = false, groupByCategory = false } = {}) {
  if (!entries.length) {
    return "";
  }
  const headingHtml = heading ? `<h2>${escapeHtml(heading)}</h2>` : "";

  if (groupByCategory) {
    const groups = new Map();
    for (const entry of entries) {
      const key = entry.category || "Writing";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(entry);
    }

    const orderedKeys = CATEGORY_ORDER.filter((category) => groups.has(category));
    const extraKeys = Array.from(groups.keys()).filter((category) => !orderedKeys.includes(category));
    const renderOrder = [...orderedKeys, ...extraKeys];

    const groupHtml = renderOrder
      .map((category) => {
        const groupEntries = groups.get(category);
        const items = groupEntries
          .map((entry) => renderWritingListItem(entry, includeDates))
          .join("\n");
        return `<div class="writing-group"><h3>${escapeHtml(category)}</h3><ul>${items}</ul></div>`;
      })
      .join("\n");

    return `<section class="${containerClass}">${headingHtml}<div class="writing-groups">${groupHtml}</div></section>`;
  }

  const items = entries.map((entry) => renderWritingListItem(entry, includeDates)).join("\n");
  const listHtml = `<ul>${items}</ul>`;
  return `<section class="${containerClass}">${headingHtml}${listHtml}</section>`;
}

function renderWritingListItem(entry, includeDates) {
  const datePart = includeDates && entry.firstLiveDate
    ? `<span class="home-writing__date">${formatDate(entry.firstLiveDate)}</span>`
    : "";
  return `<li><a href="${escapeHtmlAttribute(entry.url)}">${escapeHtml(entry.title)}</a>${datePart ? ` ${datePart}` : ""}</li>`;
}

function titleize(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeCategoryValue(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const lower = trimmed.toLowerCase();
  if (CATEGORY_ALIASES.has(lower)) {
    return CATEGORY_ALIASES.get(lower);
  }
  const titleCased = titleize(trimmed);
  if (CATEGORY_SET.has(titleCased)) {
    return titleCased;
  }
  return null;
}

function deriveCategory(page) {
  const { frontMatter, sourcePath } = page;

  const categoryValue = normalizeCategoryValue(frontMatter.category);
  if (categoryValue) {
    return categoryValue;
  }

  if (Array.isArray(frontMatter.tags)) {
    for (const raw of frontMatter.tags) {
      const normalized = normalizeCategoryValue(raw);
      if (normalized && normalized !== "Writing") {
        return normalized;
      }
    }
  }

  const writingRoot = path.join(ROOT, "writing");
  const relative = path.relative(writingRoot, sourcePath);
  if (!relative.startsWith("..")) {
    const [firstSegment] = relative.split(path.sep);
    if (firstSegment) {
      const normalized = normalizeCategoryValue(firstSegment);
      if (normalized) {
        return normalized;
      }
    }
  }

  return "Computing";
}

function shouldIncludeInLiveWriting(page) {
  if (!isInsideWritingDir(page.sourcePath)) {
    return false;
  }
  if (isExternalWritingPath(page.sourcePath)) {
    return false;
  }
  if (path.basename(page.sourcePath).toLowerCase() === "readme.md") {
    return false;
  }
  if ((page.layout || "").toLowerCase() === "writing-index") {
    return false;
  }

  const statusRaw = page.frontMatter.status;
  if (statusRaw === undefined || statusRaw === null || statusRaw === "") {
    return true;
  }

  if (typeof statusRaw === "boolean") {
    return statusRaw;
  }

  const normalized = String(statusRaw).trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (["draft", "private", "hidden", "archived", "unpublished"].includes(normalized)) {
    return false;
  }
  if (["live", "published", "public", "true"].includes(normalized)) {
    return true;
  }
  if (["false", "no"].includes(normalized)) {
    return false;
  }
  return true;
}

function buildSite() {
  if (fs.existsSync(SITE_DIR)) {
    fs.rmSync(SITE_DIR, { recursive: true, force: true });
  }
  ensureDir(path.join(ROOT, SITE_DIR));

  const markdownFiles = findMarkdownFiles(ROOT);
  const pages = markdownFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, body } = parseFrontMatter(raw);
    const bodyContent = body.trim();
    const contentHtml = markdownToHtml(bodyContent);
    const url = deriveUrl(filePath, data);
    const outputPath = outputPathFromUrl(url);
    const inferredLayout = inferLayout(data, filePath);
    const title = data.title || extractFirstHeading(bodyContent) || path.basename(filePath, ".md");
    const description = data.description || "";
    return {
      sourcePath: filePath,
      frontMatter: data,
      layout: inferredLayout,
      title,
      description,
      contentHtml,
      url,
      outputPath,
    };
  });

  const liveWriting = pages
    .filter((page) => shouldIncludeInLiveWriting(page))
    .map((page) => {
      const firstLiveDate = getFirstLiveDate(page.sourcePath) || getLastCommitDate(page.sourcePath);
      return {
        title: page.title || path.basename(page.sourcePath, ".md"),
        url: page.url,
        firstLiveDate,
        category: deriveCategory(page),
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

  const noJekyllPath = path.join(ROOT, SITE_DIR, ".nojekyll");
  fs.writeFileSync(noJekyllPath, "", "utf8");
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
