import './globals.css';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './theme-provider';

export const metadata = {
  title: 'Meeshbhoombah',
  description: 'Governance-focused decentralized systems engineering.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="page-container">
            <header className="page-header">
              <span className="site-title">Meeshbhoombah</span>
              <ThemeToggle />
            </header>
            {children}
            <footer className="page-footer">
              <span>© {new Date().getFullYear()} Meeshbhoombah</span>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
