'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import IROLogo from '@/components/ui/IROLogo';

const NAV_LINKS = [
  { label: 'Home',          href: '/' },
  { label: 'About',         href: '/about' },
  { label: 'Campaigns',     href: '/campaigns' },
  { label: 'Media',         href: '/media' },
  { label: 'Reformer Map',  href: '/reformer-map' },
  { label: 'Donate',        href: '/donate' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
                pathname === link.href
                  ? 'text-[#E8892C] font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Desktop CTAs ── */}
        <div className="hidden md:flex items-center gap-3">
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
                pathname === link.href
                  ? 'text-[#E8892C] bg-[#E8892C]/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
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
          </div>
        </div>
      </div>
    </header>
  );
}
