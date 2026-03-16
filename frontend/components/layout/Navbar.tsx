'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import IROLogo from '@/components/ui/IROLogo';

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

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0D1B2A] border-b border-[#E8892C]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <IROLogo variant="dark" size={40} />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-[#E8892C] font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Desktop CTAs / User menu ── */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition flex items-center gap-2 min-w-[140px]"
              >
                <span className="text-white font-medium text-sm truncate">
                  {user?.name?.trim() || 'My Account'}
                </span>
                <span className="text-[10px] text-white/70">▼</span>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-[#E8892C]/20 z-50"
                  >
                    <Link
                      href="/my-account"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-[#0D1B2A] hover:bg-[#E8892C]/10 text-sm font-medium"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/my-account/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-[#2C3E50] hover:bg-[#E8892C]/10 text-sm"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/my-account/refer"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-[#2C3E50] hover:bg-[#E8892C]/10 text-sm"
                    >
                      Refer & Grow
                    </Link>
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-[#2C3E50] hover:bg-red-50 hover:text-red-600 text-sm"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg transition-all"
              >
                Login
              </Link>
              <Link
                href="/join-the-movement"
                className="text-sm font-semibold text-white bg-[#E8892C] hover:bg-[#B8692A] px-4 py-2 rounded-lg transition-all"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-white transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={`md:hidden bg-[#0D1B2A] border-t border-white/10 overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-[#E8892C] bg-[#E8892C]/10' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
            {loggedIn ? (
              <>
                <Link
                  href="/my-account"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm font-medium text-white border border-white/20 py-3 rounded-lg"
                >
                  My Account
                </Link>
                <Link
                  href="/my-account/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm text-white/90 py-3 rounded-lg hover:bg-white/5"
                >
                  Profile
                </Link>
                <Link
                  href="/my-account/refer"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm text-white/90 py-3 rounded-lg hover:bg-white/5"
                >
                  Refer & Grow
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="text-center text-sm text-white/80 py-3 rounded-lg hover:bg-red-500/20 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm font-medium text-white border border-white/20 py-3 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/join-the-movement"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm font-semibold text-white bg-[#E8892C] hover:bg-[#B8692A] py-3 rounded-lg transition-colors"
                >
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
