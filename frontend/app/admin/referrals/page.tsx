'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface LeaderboardEntry {
  name: string | null;
  referralCount: number;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('/api/referral/leaderboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral">
      <nav className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-xl font-bold">
            IRO Admin
          </Link>
          <Link href="/admin" className="text-neutral-300 hover:text-white">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6">Referral Leaderboard</h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                      No referrals yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((e, i) => (
                    <tr key={i} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{e.name || 'Anonymous'}</td>
                      <td className="px-4 py-3 font-semibold text-accent">{e.referralCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
