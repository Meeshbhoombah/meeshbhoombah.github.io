import './globals.css';

export const metadata = {
  title: 'Meesh Bhoombah',
  description:
    'Governance-focused decentralized systems engineering and resilient coordination mechanisms.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page-container">
          <header className="page-header">
            <span className="site-title">Meesh Bhoombah</span>
          </header>
          {children}
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Meesh Bhoombah</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
