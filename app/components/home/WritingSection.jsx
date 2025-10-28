export default function WritingSection({ sections }) {
  const writingSections = sections ?? [];

  return (
    <section className="home-section" aria-label="Writing">
      <p className="section-label">Writing</p>
      {writingSections.map(({ label, entries }) => {
        const hasEntries = entries && entries.length > 0;

        return (
          <div className="home-writing-category" key={label}>
            <p className="subsection-label">{label}</p>
            {hasEntries ? (
              <ul>
                {entries.map(({ title, description, href }) => {
                  const isExternal = /^https?:\/\//i.test(href);
                  const linkHref = isExternal ? href : `/${href}`;

                  return (
                    <li key={href}>
                      <a
                        href={linkHref}
                        {...(isExternal
                          ? {
                              target: '_blank',
                              rel: 'noopener noreferrer',
                            }
                          : {})}
                      >
                        {title}
                      </a>
                      {description && <p>{description}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>COMING SOON</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
