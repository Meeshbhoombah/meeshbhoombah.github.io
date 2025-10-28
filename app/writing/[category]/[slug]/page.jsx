import { notFound } from 'next/navigation';

import {
  getLiveWritingStaticParams,
  getWritingEntry,
  WRITING_CATEGORY_LABELS,
} from '../../../lib/writing';
import { renderMarkdownToHtml } from '../../../lib/markdown';

export function generateStaticParams() {
  return getLiveWritingStaticParams();
}

export function generateMetadata({ params }) {
  const entry = getWritingEntry(params.category, params.slug);

  if (!entry || entry.status !== 'live') {
    return {};
  }

  return {
    title: `${entry.title} · ${WRITING_CATEGORY_LABELS[entry.category] || 'Writing'}`,
    description: entry.description || undefined,
  };
}

export default function WritingArticlePage({ params }) {
  const entry = getWritingEntry(params.category, params.slug);

  if (!entry || entry.status !== 'live') {
    notFound();
  }

  const html = renderMarkdownToHtml(entry.content, { stripHeading: entry.title });
  const categoryLabel = WRITING_CATEGORY_LABELS[entry.category] || 'Writing';

  return (
    <main className="content">
      <article className="markdown writing-article" aria-labelledby="writing-article-title">
        <p className="section-label">{categoryLabel}</p>
        <h1 id="writing-article-title">{entry.title}</h1>
        {entry.description ? (
          <p className="writing-article-description">{entry.description}</p>
        ) : null}
        <div
          className="writing-article-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
