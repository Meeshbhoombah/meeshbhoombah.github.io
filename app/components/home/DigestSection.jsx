const stats = [
  { value: '12', description: 'Years in tech' },
  { value: '>136', description: 'Web3 Vulnerabilities assessed' },
  { value: '21/46', description: 'Programming Competitions Won/Attended' },
  { value: '~900', description: 'Workshop Attendees' },
  {
    value: '~700',
    description: (
      <span className="digest-devto">
        Consistent readers on
        <br className="digest-devto__break" />{' '}
        <a
          href="https://dev.to/meeshbhoombah"
          target="_blank"
          rel="noopener noreferrer"
        >
          dev.to
        </a>
      </span>
    ),
  },
  {
    value: '>3,098',
    description: 'Hours dedicated to diversifying tech through education',
  },
  { value: '~100', description: 'Projects Built' },
];

export default function DigestSection() {
  return (
    <section className="home-section" aria-label="Digest">
      <p className="section-label">Digest</p>
      <div className="home-digest-grid">
        {stats.map(({ value, description }, index) => (
          <div className="home-digest-item" key={`${value}-${index}`}>
            <p className="stat-value">{value}</p>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
