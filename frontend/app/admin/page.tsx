'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const adminRoles = ['NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'TEHSIL_ADMIN', 'BOOTH_COORDINATOR'];
        if (!adminRoles.includes(data.role)) {
          router.replace('/');
          return;
        }
        setUser(data);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const modules = [
    { href: '/admin/users', label: 'Members', desc: 'View & manage members' },
    { href: '/admin/campaigns', label: 'Campaigns', desc: 'Bulk SMS & messaging' },
    { href: '/admin/analytics', label: 'Analytics', desc: 'Ideology & engagement' },
    { href: '/admin/referrals', label: 'Referrals', desc: 'Referral leaderboard' },
    { href: '/admin/latest-updates', label: 'Latest Updates', desc: 'Home hero news & updates' },
    { href: '/admin/media', label: 'Media', desc: 'Gallery photos & videos' },
    { href: '/dashboard', label: 'Public Dashboard', desc: 'View public stats' },
  ];

  return (
    <div className="min-h-screen bg-neutral">
      <nav className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            IRO Admin
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-300">{user.role}</span>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.replace('/login');
              }}
              className="px-4 py-2 bg-accent/80 rounded-lg text-sm hover:bg-accent transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-primary mb-2"
        >
          Welcome, {user.name || 'Admin'}
        </motion.h1>
        <p className="text-neutral-500 mb-8">Select a module to get started</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, i) => (
            <motion.div
              key={m.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={m.href}
                className="block bg-white rounded-xl p-6 shadow-lg border border-neutral-200 hover:border-accent hover:shadow-xl transition"
              >
                <h3 className="font-semibold text-primary text-lg">{m.label}</h3>
                <p className="text-neutral-500 text-sm mt-1">{m.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
