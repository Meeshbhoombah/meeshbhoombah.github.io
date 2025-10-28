const stats = [
  { value: '12', description: 'Years in tech' },
  { value: '>136', description: 'Web3 Vulnerabilities assessed' },
  { value: '21/46', description: 'Programming Competitions Won/Attended' },
  { value: '~900', description: 'Workshop Attendees' },
  {
    value: '~700',
    description: (
      <>
        Consistent readers on{' '}
        <a href="https://dev.to/meeshbhoombah">dev.to</a>
      </>
    ),
  },
  {
    value: '> 3,098',
    description: 'Hours dedicated to diversifying tech through education',
  },
  { value: '~100', description: 'Projects Built' },
];

export default function DigestSection() {
  return (
    <section className="home-section" aria-labelledby="home-digest-heading">
      <h2 id="home-digest-heading">🔢</h2>
      <div className="home-digest-grid">
        {stats.map(({ value, description }, index) => (
          <div className="home-digest-item" key={`${value}-${index}`}>
            <h3>{value}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
