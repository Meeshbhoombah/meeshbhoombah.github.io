export default function WritingSection({ sections }) {
  const writingSections = sections ?? [];

  return (
    <section className="home-section" aria-label="Writing">
      <p className="section-label">Writing</p>
      {writingSections.map(({ label, entries }) => {
        const hasEntries = entries && entries.length > 0;
        const categoryClassName = hasEntries
          ? 'home-writing-category'
          : 'home-writing-category home-writing-category--empty';

        return (
          <div className={categoryClassName} key={label}>
            <p className="subsection-label">{label}</p>
            {hasEntries ? (
              entries.map(({ title, href, preview }) => {
                const isExternal = /^https?:\/\//i.test(href);
                const linkHref = isExternal ? href : `/${href}`;

                return (
                  <div className="home-writing-entry" key={href}>
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
                    {preview && <p>{preview}</p>}
                  </div>
                );
              })
            ) : (
              <p className="writing-coming-soon">COMING SOON</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
