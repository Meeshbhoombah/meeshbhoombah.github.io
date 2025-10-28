# Meeshbhoombah · WWW

This repository powers the personal site with [Next.js](https://nextjs.org/) and a GitHub Pages deployment pipeline. The home page is composed from modular React components under `app/components/home/`, while a helper surfaces live writing entries from the Markdown files in `writing/`.

## Structure
- `app/components/home/` — home page sections authored as dedicated React components.
- `app/lib/writing.js` — helper for surfacing `writing/**/*.md` entries that are marked as `status: live` in their front matter.
- `app/` — the Next.js App Router implementation, including global styles and the home page composition.
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
3. Open `http://localhost:3000` to view the site. Component changes and edits to the `writing/` Markdown files will hot reload automatically.

## Production build
To generate the static site locally:
```bash
npm run build
```
The exported HTML will be available in the `out/` directory.

## Writing preview
The RSS classifier can be previewed without network access by pointing the helper at a JSON fixture and running the bundled script:

```bash
RSS_FEED_FIXTURE=fixtures/rss-preview.json node scripts/preview-writing.mjs
```

The fixture file must be an array of objects that include `title`, `link`, `description`, optional `categories`, and an optional `publishedAt` timestamp. When present, entries are merged with any live Markdown posts so you can confirm category assignments end-to-end.

## Deployment
GitHub Actions (see `.github/workflows/deploy.yml`) run on both pull requests and pushes to `main`. Every PR gets a **Deploy Next.js site / build** check that compiles the static export and uploads it as the Pages artifact so you can inspect the output before merging. Once the pull request lands (or you push directly to `main`), the accompanying **Deploy Next.js site / deploy** job publishes that artifact through `actions/deploy-pages`.

The workflow installs dependencies, runs `npm run build`, writes a `.nojekyll` marker into `out/` (preventing Pages from rebuilding the README), and uploads the exported `out/` directory. The deploy job is skipped for pull requests, but the build logs—visible from the workflow run—include the `Disable Jekyll processing` step so you can confirm the safeguard executed. You can also run the workflow manually from the Actions tab because it exposes a `workflow_dispatch` trigger.
