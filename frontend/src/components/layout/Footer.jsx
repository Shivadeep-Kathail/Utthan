import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { to: '#', label: 'About' },
  { to: '#', label: 'Contact' },
  { to: '#', label: 'Terms' },
  { to: '#', label: 'Privacy' },
];

/**
 * Simple responsive footer.
 * Links are placeholders for now — real pages will be added in later phases.
 */
function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}{' '}
          <Link to="/" className="font-medium text-foreground hover:text-primary transition-colors">
            Utthan
          </Link>
          . All rights reserved.
        </p>
        <nav aria-label="Footer navigation" className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export { Footer };
