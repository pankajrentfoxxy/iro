'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface User {
  name: string | null;
  referralCode: string;
  state: string | null;
  district: string | null;
}

export default function MyAccountOverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{ totalMembers: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => !d.error && setUser({ name: d.name, referralCode: d.referralCode || '', state: d.state, district: d.district }))
      .catch(() => {});
    fetch('/api/public/stats')
      .then((r) => r.json())
      .then((d) => setStats({ totalMembers: d.totalMembers ?? 0 }))
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0D1B2A] mb-1">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-[#2C3E50]/70 text-sm">
          Manage your profile and grow the movement.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/my-account/profile"
          className="block bg-white rounded-xl p-6 shadow border border-[#E8892C]/10 hover:border-[#E8892C]/30 transition"
        >
          <h3 className="font-semibold text-[#0D1B2A] mb-2">Profile</h3>
          <p className="text-[#2C3E50]/70 text-sm mb-3">
            Update your name, location, and contact details.
          </p>
          <span className="text-[#E8892C] font-medium text-sm">Edit profile →</span>
        </Link>
        <Link
          href="/my-account/refer"
          className="block bg-white rounded-xl p-6 shadow border border-[#E8892C]/10 hover:border-[#E8892C]/30 transition"
        >
          <h3 className="font-semibold text-[#0D1B2A] mb-2">Refer & Grow</h3>
          <p className="text-[#2C3E50]/70 text-sm mb-3">
            Share your referral code and invite others to join.
          </p>
          <span className="text-[#E8892C] font-medium text-sm">Get link →</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl p-6 shadow border border-[#E8892C]/10">
        <h3 className="font-semibold text-[#0D1B2A] mb-4">Quick Stats</h3>
        <div className="flex gap-6">
          <div>
            <p className="text-[#2C3E50]/60 text-sm">Reformers in movement</p>
            <p className="text-2xl font-bold text-[#E8892C]">{stats?.totalMembers ?? '—'}</p>
          </div>
          {user?.referralCode && (
            <div>
              <p className="text-[#2C3E50]/60 text-sm">Your referral code</p>
              <p className="text-lg font-mono font-semibold text-[#0D1B2A]">{user.referralCode}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
