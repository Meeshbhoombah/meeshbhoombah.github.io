export default function WritingSection({ sections }) {
  const writingSections = (sections ?? []).filter(
    (section) => section.entries && section.entries.length > 0
  );

  return (
    <section className="home-section" aria-labelledby="home-writing-heading">
      <h2 id="home-writing-heading">🖋️</h2>
      {writingSections.map(({ label, entries }) => (
        <div className="home-writing-category" key={label}>
          <h3>{label}</h3>
          {entries.length > 0 ? (
            <ul>
              {entries.map(({ title, description, href }) => (
                <li key={href}>
                  <a href={`/${href}`}>{title}</a>
                  {description && <p>{description}</p>}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}
