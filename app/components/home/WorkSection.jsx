import { isValidElement } from 'react';

const previousRoles = [
  {
    name: 'Sigma Prime',
    href: 'https://sigmaprime.io/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          'An off-chain rollup sub-system securing $330M',
          (
            <span>
              A Bitcoin L2 based on{' '}
              <a
                href="https://github.com/paradigmxyz/reth/releases/tag/v1.0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                reth v1.5.0
              </a>{' '}
              with ~27M+ tx &amp; 180K+ unique addresses
            </span>
          ),
          'An internal log auditing system for a company worth $2B',
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
        items: ['Core product, leading to >$1M ARR and a $2.5M raise'],
      },
    ],
  },
  {
    name: 'Common',
    href: 'https://landing.common.xyz/',
    contributions: [
      { label: 'Worked on:', items: ['Core product, scaling DAU by 33%'] },
    ],
  },
  {
    name: 'Tru-Breed',
    href: 'https://www.tru-breed.com/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          (
            <span>
              A private, pipelined, optimized fork of{' '}
              <a
                href="https://github.com/dereneaton/ipyrad"
                target="_blank"
                rel="noopener noreferrer"
              >
                ipyrad
              </a>
            </span>
          ),
        ],
      },
    ],
  },
  {
    name: 'Make School',
    href: 'https://makeschool.org/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          'Teaching ~200 students (economics, software engineering, computer science, security, game theory, NFTs, DAOs)',
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
  { 
    name: 'CodeDay', 
    href: 'https://www.codeday.org/',
    contributions: [
      {
        label: 'Worked on:',
        items: ['Scaling community from 1.2K to 20K'],
      },
    ],
  },
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

  if (isValidElement(contribution)) {
    return <li key={`${keyPrefix}-element`}>{contribution}</li>;
  }

  return (
    <li key={`${keyPrefix}-${typeof contribution.label === 'string' ? contribution.label : 'group'}`}>
      {contribution.label}
      {contribution.items && contribution.items.length > 0 && (
        <ul>
          {contribution.items.map((item, index) =>
            renderContribution(item, `${keyPrefix}-${index}`),
          )}
        </ul>
      )}
    </li>
  );
}

export default function WorkSection() {
  return (
    <section className="home-section" aria-label="Work">
      <p className="section-label">Work</p>
      <div className="home-subsection">
        <p className="subsection-label">Now</p>
        <ul>
          {nowRoles.map(({ name, href }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="home-subsection">
        <p className="subsection-label">Previously</p>
        <ul>
          {previousRoles.map(({ name, href, contributions = [] }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
              {contributions.length > 0 && (
                <ul>
                  {contributions.map((contribution, index) =>
                    renderContribution(contribution, `${name}-${index}`),
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
