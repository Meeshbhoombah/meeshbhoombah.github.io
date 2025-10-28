"use client";

import { isValidElement, useEffect, useMemo, useState } from 'react';

const activityUrl =
  'https://wakatime.com/share/@Meeshbhoombah/6d82282c-df01-46bf-b408-7b359f933419.json';
const languagesUrl =
  'https://wakatime.com/share/@Meeshbhoombah/8c7ee140-809e-4f98-bd17-3d553ec2bd75.json';

const previousRoles = [
  {
    name: 'Sigma Prime',
    href: 'https://sigmaprime.io/',
    contributions: [
      {
        label: 'Worked on:',
        items: [
          'An off-chain rollup system securing $330,000,000',
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
              with 10,000,000+ tx &amp; 150,000+ unique addresses
            </span>
          ),
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

function formatDuration(totalSeconds) {
  if (!totalSeconds) {
    return '0m';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  const parts = [];
  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes || parts.length === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
}

function getWeekdayLabel(dateString) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

function normalizeActivityData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => {
      const totalSeconds = entry?.grand_total?.total_seconds ?? 0;
      const label = getWeekdayLabel(entry?.range?.date);
      return {
        label,
        totalSeconds,
        displayValue: formatDuration(totalSeconds),
      };
    })
    .filter((entry) => entry.label);
}

function normalizeLanguageData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  const trimmed = data
    .map((entry) => ({
      name: entry?.name ?? 'Unknown',
      percent: entry?.percent ?? 0,
      color: entry?.color ?? 'var(--color-muted)',
    }))
    .filter((entry) => entry.percent > 0)
    .slice(0, 8);

  if (!trimmed.length) {
    return [];
  }

  const totalPercent = trimmed.reduce((sum, entry) => sum + entry.percent, 0);

  if (totalPercent <= 0) {
    return [];
  }

  return trimmed.map((entry) => ({
    ...entry,
    percent: (entry.percent / totalPercent) * 100,
  }));
}

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
            renderContribution(item, `${keyPrefix}-${index}`)
          )}
        </ul>
      )}
    </li>
  );
}

export default function WorkSection() {
  const [activityData, setActivityData] = useState([]);
  const [languagesData, setLanguagesData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);
  const [languagesError, setLanguagesError] = useState(false);
  const [hoveredLanguage, setHoveredLanguage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchActivity = async () => {
      try {
        const response = await fetch(activityUrl);
        const json = await response.json();
        if (isMounted) {
          setActivityData(normalizeActivityData(json?.data));
          setActivityLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setActivityError(true);
          setActivityLoading(false);
        }
      }
    };

    const fetchLanguages = async () => {
      try {
        const response = await fetch(languagesUrl);
        const json = await response.json();
        if (isMounted) {
          setLanguagesData(normalizeLanguageData(json?.data));
          setLanguagesLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setLanguagesError(true);
          setLanguagesLoading(false);
        }
      }
    };

    fetchActivity();
    fetchLanguages();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setHoveredLanguage(null);
  }, [languagesData]);

  const topLanguages = useMemo(() => {
    if (!languagesData.length) {
      return [];
    }

    return [...languagesData]
      .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
      .slice(0, 3);
  }, [languagesData]);

  const topLanguage = useMemo(() => {
    if (!languagesData.length) {
      return null;
    }

    return languagesData.reduce((currentTop, language) => {
      if (!currentTop || (language.percent ?? 0) > (currentTop.percent ?? 0)) {
        return language;
      }

      return currentTop;
    }, null);
  }, [languagesData]);

  const activeLanguage = hoveredLanguage ?? topLanguage;

  const maxActivitySeconds = useMemo(() => {
    if (!activityData.length) {
      return 0;
    }

    return activityData.reduce(
      (max, entry) => Math.max(max, entry.totalSeconds ?? 0),
      0,
    );
  }, [activityData]);

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
      <div className="work-activity-charts">
        <div className="work-chart-card">
          <p className="subsection-label work-chart-title">Last 7 Days of Coding Activity</p>
          {activityLoading ? (
            <p className="work-chart-message">Loading activity…</p>
          ) : activityError ? (
            <p className="work-chart-message" role="alert">
              Unable to load coding activity right now.
            </p>
          ) : activityData.length === 0 ? (
            <p className="work-chart-message">No recent coding activity recorded.</p>
          ) : (
            <div
              className="work-bar-chart"
              role="list"
              aria-label="Coding activity for the last seven days"
            >
              {activityData.map(({ label, totalSeconds, displayValue }) => {
                const height = maxActivitySeconds
                  ? Math.max((totalSeconds / maxActivitySeconds) * 100, 4)
                  : 4;
                return (
                  <div className="work-bar-chart__item" key={label} role="listitem">
                    <div className="work-bar-chart__column">
                      <div
                        className="work-bar-chart__bar"
                        style={{ height: `${height}%` }}
                        data-value={displayValue}
                        tabIndex={0}
                        aria-label={`${label}: ${displayValue}`}
                      />
                      <span className="sr-only">Time spent: {displayValue}</span>
                    </div>
                    <span className="work-bar-chart__label">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="work-chart-card">
          <p className="subsection-label work-chart-title work-chart-title--right">
            Languages Used (Last 30 Days)
          </p>
          {languagesLoading ? (
            <p className="work-chart-message">Loading languages…</p>
          ) : languagesError ? (
            <p className="work-chart-message" role="alert">
              Unable to load languages right now.
            </p>
          ) : languagesData.length === 0 ? (
            <p className="work-chart-message">No language data available.</p>
          ) : (
            <div className="work-donut-chart">
              <svg
                className="work-donut-chart__svg"
                viewBox="0 0 120 120"
                role="img"
                aria-label="Language usage for the past thirty days"
              >
                <title>Language usage for the past thirty days</title>
                {(() => {
                  const radius = 50;
                  const circumference = 2 * Math.PI * radius;
                  let cumulativePercent = 0;

                  return languagesData.map((language, index) => {
                    const { name, percent, color } = language;
                    const startPercent = cumulativePercent;
                    cumulativePercent += percent;
                    const dash = Math.max((percent / 100) * circumference, 0);
                    const gap = Math.max(circumference - dash, 0);

                    return (
                      <circle
                        key={`${name}-${index}`}
                        className="work-donut-chart__segment"
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="20"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={circumference * (1 - startPercent / 100)}
                        transform="rotate(-90 60 60)"
                        tabIndex={0}
                        aria-label={`${name}: ${percent.toFixed(1)} percent`}
                        onMouseEnter={() => setHoveredLanguage(language)}
                        onMouseLeave={() => setHoveredLanguage(null)}
                        onFocus={() => setHoveredLanguage(language)}
                        onBlur={() => setHoveredLanguage(null)}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="work-donut-chart__center" aria-live="polite">
                {activeLanguage && (
                  <>
                    <span className="work-donut-chart__center-name">
                      {activeLanguage.name}
                    </span>
                    <span className="work-donut-chart__center-value">
                      {activeLanguage.percent.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
              {topLanguages.length > 0 && (
                <ul className="work-donut-chart__summary" aria-label="Top three languages">
                  {topLanguages.map(({ name, percent, color }) => (
                    <li
                      className="work-donut-chart__summary-item"
                      key={`${name}-${percent.toFixed(1)}`}
                    >
                      <span
                        className="work-donut-chart__summary-color"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="work-donut-chart__summary-name">{name}</span>
                      <span className="work-donut-chart__summary-value">
                        {percent.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
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
