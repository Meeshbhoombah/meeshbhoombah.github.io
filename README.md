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

## Deployment
GitHub Actions (see `.github/workflows/deploy.yml`) run on pushes to `main`, so merging a pull request into that branch automatically triggers the publish pipeline. The workflow installs dependencies, builds the static export, drops a `.nojekyll` file into `out/` so GitHub Pages serves the generated assets instead of rebuilding the README, and deploys the directory to `https://meeshbhoombah.github.io/`. You can also run the workflow manually from the Actions tab because it exposes a `workflow_dispatch` trigger.
