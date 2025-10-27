# meeshbhoombah.github.io

Static site for [meeshbhoombah.github.io](https://meeshbhoombah.github.io) built with [Jekyll](https://jekyllrb.com/) and published via GitHub Pages.

## Structure

- `index.md` composes the homepage by stitching together `HERO.md`, `WORK.md`, `DIGEST.md`, and the live writing feed grouped by category.
- `_writing/` contains Markdown sources for long-form posts. Files marked `status: live` are published to `/writing/...` and surface automatically on the homepage.
- `_layouts/` defines the base, writing entry, and writing index layouts. Titles fall back to the first Markdown heading, so posts do not need explicit `title` front matter.
- `_plugins/writing_metadata.rb` reads git history at build time to capture first-live dates and heading-derived titles for published articles.

## Local development

1. Install Ruby (>= 3.0) and Bundler.
2. Install dependencies:
   ```bash
   bundle install --path vendor/bundle
   ```
3. Serve the site locally:
   ```bash
   bundle exec jekyll serve
   ```
   The site will be available at `http://localhost:4000`.

Ensure your clone has full git history so first-live dates can be discovered while the site builds.

## Deployment

GitHub Actions builds and deploys the static site on every push to `main` using the checked-in workflow.
