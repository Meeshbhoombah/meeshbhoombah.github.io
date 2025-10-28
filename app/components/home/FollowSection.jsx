const links = [
  { label: 'Twitter', href: 'https://twitter.com/meeshbhoombah' },
  { label: 'Medium', href: 'https://meeshbhoombah.medium.com/' },
  { label: 'dev.to', href: 'https://dev.to/meeshbhoombah' },
  { label: 'GitHub', href: 'https://github.com/meeshbhoombah/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/meeshbhoombah/' },
];

export default function FollowSection() {
  return (
    <section className="home-section" aria-label="Follow">
      <p className="section-label">Follow</p>
      <ul>
        {links.map(({ label, href }) => (
          <li key={label}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
