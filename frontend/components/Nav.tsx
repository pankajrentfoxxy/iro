'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

interface UserMe {
  name: string | null;
  referralCode: string;
}

interface NavProps {
  loggedIn?: boolean;
  user?: UserMe | null;
}

export default function Nav({ loggedIn = false, user = null }: NavProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLink = 'text-neutral-300 hover:text-white text-sm font-medium transition px-3 py-2 rounded-lg hover:bg-white/5';
  const navLinkActive = 'text-white';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur border-b border-white/10">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo variant="nav" href="/" />

          <div className="flex items-center gap-1">
            <Link href="/" className={navLink}>
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1`}>
                About / Know Us
                <span className="text-[10px]">▼</span>
              </button>
              <AnimatePresence>
                {aboutOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                  >
                    <Link href="/about" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                      Vision & Mission
                    </Link>
                    <Link href="/about#faq" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                      FAQ
                    </Link>
                    <Link href="/about#timeline" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                      Timeline
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/join" className={navLink}>
              Join the Movement
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setMediaOpen(true)}
              onMouseLeave={() => setMediaOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1`}>
                Media
                <span className="text-[10px]">▼</span>
              </button>
              <AnimatePresence>
                {mediaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 top-full mt-1 py-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                  >
                    <Link href="/media/gallery" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                      Gallery
                    </Link>
                    <Link href="/media/videos" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                      Videos
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {loggedIn ? (
              <div
                className="relative ml-2"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition cursor-pointer min-w-[120px] text-center">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.name?.trim() || 'Anonymous'}
                  </p>
                  <p className="text-neutral-400 text-xs mt-0.5 truncate">
                    {user?.referralCode ? `ID: ${user.referralCode}` : 'Member'}
                  </p>
                </div>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                    >
                      <Link href="/my-account" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                        My Account
                      </Link>
                      <Link href="/my-account/profile" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                        Profile
                      </Link>
                      <Link href="/my-account/refer" className="block px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm">
                        Refer
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('token');
                          window.location.href = '/';
                        }}
                        className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 text-sm"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="ml-2 px-4 py-2 bg-accent rounded-lg text-white font-medium hover:bg-accent-light transition text-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
