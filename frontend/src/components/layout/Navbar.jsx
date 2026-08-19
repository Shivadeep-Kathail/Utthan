import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/campaigns', label: 'Discover' },
];

/**
 * Responsive navbar with auth-conditional rendering.
 *
 * Logged out: NAV_LINKS + Login/Signup
 * Logged in:  NAV_LINKS + Dashboard + user greeting + Logout
 * Admin/Mod:  Also shows Admin link
 */
function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('utthan-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('utthan-theme', next ? 'dark' : 'light');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  // Build navigation links based on auth state
  const authedNavLinks = [
    ...NAV_LINKS,
    { to: '/dashboard', label: 'Dashboard' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const navLinks = isAuthenticated ? authedNavLinks : NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
        >
          <span className="text-2xl" aria-hidden="true">✦</span>
          Utthan
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop right section */}
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {!isLoading && isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user?.name?.split(' ')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="size-3.5" />
                Log out
              </Button>
            </>
          ) : !isLoading ? (
            <>
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
              >
                Sign up
              </Link>
            </>
          ) : null}
        </div>

        {/* Mobile right section */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-md md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
              {!isLoading && isAuthenticated ? (
                <>
                  <span className="px-3 text-sm text-muted-foreground">
                    Signed in as <span className="font-medium text-foreground">{user?.name}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start gap-1.5 text-muted-foreground"
                  >
                    <LogOut className="size-3.5" />
                    Log out
                  </Button>
                </>
              ) : !isLoading ? (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'w-full justify-center',
                    )}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'sm' }),
                      'w-full justify-center',
                    )}
                  >
                    Sign up
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export { Navbar };
