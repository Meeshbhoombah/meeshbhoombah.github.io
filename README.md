# Meeshbhoombah · WWW

This repository now powers the personal site with [Next.js](https://nextjs.org/) and a GitHub Pages deployment pipeline. The home
page pulls directly from `HOME.md`, keeping the writing workflow focused on Markdown while relying on modern tooling for the buil
d and hosting story.

## Structure
- `HOME.md` — homepage content. The Next.js app reads the Markdown at build time and renders it as the root route.
- `app/` — the Next.js App Router implementation, including global styles and the Markdown renderer.
- `.github/workflows/deploy.yml` — GitHub Actions workflow that builds the static site and publishes it to GitHub Pages.
- `writing/` — additional long-form content that can be integrated into the site in the future.

## Local development
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to view the site. Edits to `HOME.md` will hot reload automatically.

## Production build
To generate the static site locally:
```bash
npm run build
npm run export
```
The exported HTML will be available in the `out/` directory.

## Deployment
GitHub Actions (see `.github/workflows/deploy.yml`) run on pushes to `main`. The workflow installs dependencies, builds the stat
ic export, and deploys the generated `out/` directory to GitHub Pages so the site is available at `https://meeshbhoombah.github.
io/`.
