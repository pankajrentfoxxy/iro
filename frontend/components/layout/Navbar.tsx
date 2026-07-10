'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import IROLogo from '@/components/ui/IROLogo';
import ThemeToggle from '@/components/theme/ThemeToggle';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Media', href: '/media' },
  { label: 'Reformer Map', href: '/reformer-map' },
  { label: 'Donate', href: '/donate' },
];

interface UserMe {
  name: string | null;
  referralCode: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setLoggedIn(!!token);
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => !d.error && setUser({ name: d.name, referralCode: d.referralCode || '' }))
        .catch(() => {});
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    window.location.href = '/';
  };

  const linkClass = (href: string) =>
    pathname === href
      ? 'text-secondary font-semibold'
      : 'text-muted-foreground hover:text-foreground';

  return (
    <header className="fixed top-0 w-full z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center shrink-0">
          <IROLogo variant="light" size={44} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${linkClass(link.href)}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {loggedIn ? (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-muted hover:bg-border/80 transition flex items-center gap-2 min-w-[140px] border border-border"
              >
                <span className="text-foreground font-medium text-sm truncate">
                  {user?.name?.trim() || 'My Account'}
                </span>
                <span className="text-[10px] text-muted-foreground">▼</span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 py-1 w-48 bg-card rounded-xl shadow-card-lg border border-border z-50"
                  >
                    <Link href="/my-account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-foreground hover:bg-muted text-sm font-medium">
                      My Account
                    </Link>
                    <Link href="/my-account/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-muted-foreground hover:bg-muted text-sm">
                      Profile
                    </Link>
                    <Link href="/my-account/refer" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-muted-foreground hover:bg-muted text-sm">
                      Refer & Grow
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button type="button" onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 text-sm">
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="iro-btn-ghost text-sm border border-border">
                Login
              </Link>
              <Link href="/join-the-movement" className="iro-btn-primary text-sm px-4 py-2">
                Join Now
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            className="flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-foreground transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-foreground transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-foreground transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className={`md:hidden bg-card border-t border-border overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-secondary bg-secondary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
            {loggedIn ? (
              <>
                <Link href="/my-account" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium text-foreground border border-border py-3 rounded-xl">
                  My Account
                </Link>
                <Link href="/my-account/profile" onClick={() => setMobileOpen(false)} className="text-center text-sm text-muted-foreground py-3 rounded-xl hover:bg-muted">
                  Profile
                </Link>
                <Link href="/my-account/refer" onClick={() => setMobileOpen(false)} className="text-center text-sm text-muted-foreground py-3 rounded-xl hover:bg-muted">
                  Refer & Grow
                </Link>
                <button type="button" onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-center text-sm text-muted-foreground py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium text-foreground border border-border py-3 rounded-xl">
                  Login
                </Link>
                <Link href="/join-the-movement" onClick={() => setMobileOpen(false)} className="text-center text-sm font-semibold text-secondary-foreground bg-secondary py-3 rounded-xl">
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
