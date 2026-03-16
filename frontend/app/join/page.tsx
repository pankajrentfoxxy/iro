'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MISSED_CALL_NUMBER, MISSED_CALL_DISPLAY } from '@/lib/config';

interface UserMe {
  name: string | null;
  referralCode: string;
}

export default function JoinPage() {
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
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <main className="pt-8 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-2">
              Join the Movement
            </h1>
            <p className="text-[#2C3E50] text-lg">
              Become a Reformer and help shape India&apos;s future.
            </p>
          </motion.section>

          {loggedIn ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-lg border border-[#E8892C]/10"
            >
              <p className="text-[#2C3E50] mb-6 text-center">
                You&apos;re already a member. Welcome back!{user?.name && `, ${user.name}`}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/"
                  className="px-6 py-3 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#B8692A] transition"
                >
                  Go to Home
                </Link>
                <Link
                  href="/my-account/refer"
                  className="px-6 py-3 bg-[#0D1B2A] text-white rounded-lg font-medium hover:bg-[#1a2d42] transition"
                >
                  Refer & Grow
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Missed Call Section */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-8"
              >
                <div className="bg-[#0D1B2A] rounded-xl p-6 md:p-8 text-center border-2 border-[#E8892C]/30">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8892C]/20 mb-4">
                    <svg className="w-6 h-6 text-[#E8892C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white mb-2">
                    Give a Missed Call
                  </h2>
                  <p className="text-white/80 text-sm mb-4 max-w-md mx-auto">
                    Call us and we&apos;ll call you back to complete your registration. Free, quick, and easy.
                  </p>
                  <a
                    href={`tel:${MISSED_CALL_NUMBER}`}
                    className="inline-block text-2xl md:text-3xl font-bold text-[#E8892C] hover:text-[#F0A04D] transition tracking-wide"
                  >
                    {MISSED_CALL_DISPLAY}
                  </a>
                  <p className="text-white/50 text-xs mt-2">Toll-free • India</p>
                </div>
              </motion.section>

              {/* Or Sign Up */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-8 shadow-lg border border-[#E8892C]/10"
              >
                <p className="text-[#2C3E50] text-center mb-2 text-sm">— or sign up online —</p>
                <p className="text-[#2C3E50] mb-6 text-center">
                  Create your account in under a minute.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link
                    href="/signup"
                    className="px-6 py-3 bg-[#E8892C] text-white rounded-lg font-semibold hover:bg-[#B8692A] transition"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-[#0D1B2A] text-white rounded-lg font-medium hover:bg-[#1a2d42] transition"
                  >
                    Login
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
