# Meeshbhoombah · WWW

This repository contains the source for the Meeshbhoombah personal site. Markdown files with YAML front matter drive the content and are rendered by a lightweight Node.js build script that hides metadata from the final HTML.

## Structure
- `HOME.md` — homepage content rendered with the `home` layout. Dynamic sections (like featured writing) are injected at build time.
- `writing/` — topic-oriented writing, grouped by directory. Set `status: live` in the front matter to surface an entry across navigation and the homepage.
- `templates/` — HTML layouts consumed by the build script. Each layout feeds into the shared base template for consistent chrome.

## Local development
1. Install dependencies (none required beyond Node.js)
   ```bash
   npm install
   ```
2. Generate the site
   ```bash
   npm run build
   ```
3. Open the generated `_site/index.html` in a browser or serve the directory with your preferred static server.

## Production build
Generate a production build with:
```bash
npm run build
```
The compiled site will be emitted to the `_site/` directory.

## Deployment
GitHub Actions (see `.github/workflows/deploy.yml`) build the site and publish the generated `_site/` contents to the `gh-pages` branch. The workflow runs on pushes to `main`.
