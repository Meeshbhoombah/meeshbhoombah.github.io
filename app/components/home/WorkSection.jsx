const previousRoles = [
  {
    name: 'Sigma Prime',
    href: 'https://sigmaprime.io/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          'An off-chain rollup system securing $330,000,000',
          'A Bitcoin L2 based on reth v1.5.0 with 10,000,000+ tx & 150,000+ unique addresses',
          'An internal log auditing system for a company worth $2,000,000,000',
        ],
      },
    ],
  },
  {
    name: 'JusticeText',
    href: 'https://justicetext.com/',
    contributions: [
      {
        label: 'Worked on:',
        items: ['Core product, leading to $25,000 MRR a $2,000,000 raise'],
      },
    ],
  },
  {
    name: 'Commonwealth',
    href: 'https://commonwealth.im/',
    contributions: [
      { label: 'Worked on:', items: ['Core product, scaling DAU by 33%'] },
    ],
  },
  {
    name: 'Tru-Breed',
    href: 'https://www.tru-breed.com/',
    contributions: [
      { label: 'Worked on:', items: ['A private, pipelined, optimized fork of ipyrad'] },
    ],
  },
  {
    name: 'Make School',
    href: 'https://makeschool.org/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          'Teaching ~200 students cryptocurrency concepts (economics, computer science, game theory, NFTs, DAOs)',
          {
            label: 'Delivering three products quarterly, of note:',
            items: [
              'A markov-chain based Eminem lyric generator',
              'An ecommerce system for cannabis dispenaries',
              'A StackOverflow-esque system for Slack',
            ],
          },
          'Building community',
        ],
      },
    ],
  },
  { name: 'CodeDay', href: 'https://www.codeday.org/' },
  { name: 'BlockchainEDU', href: 'https://www.blockchainedu.org/' },
];

const nowRoles = [
  {
    name: 'Architect',
    href: 'https://twitter.com/_thearchproj_',
  },
];

function renderContribution(contribution, keyPrefix) {
  if (typeof contribution === 'string') {
    return <li key={`${keyPrefix}-text`}>{contribution}</li>;
  }

  return (
    <li key={`${keyPrefix}-${contribution.label}`}>
      {contribution.label}
      {contribution.items && contribution.items.length > 0 && (
        <ul>
          {contribution.items.map((item, index) =>
            renderContribution(item, `${keyPrefix}-${index}`)
          )}
        </ul>
      )}
    </li>
  );
}

export default function WorkSection() {
  return (
    <section className="home-section" aria-labelledby="home-work-heading">
      <h2 id="home-work-heading">🤔</h2>
      <div className="home-subsection">
        <h3>Now</h3>
        <ul>
          {nowRoles.map(({ name, href }) => (
            <li key={name}>
              <a href={href}>{name}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="home-subsection">
        <h3>Previously</h3>
        <ul>
          {previousRoles.map(({ name, href, contributions = [] }) => (
            <li key={name}>
              <a href={href}>{name}</a>
              {contributions.length > 0 && (
                <ul>
                  {contributions.map((contribution, index) =>
                    renderContribution(contribution, `${name}-${index}`)
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
