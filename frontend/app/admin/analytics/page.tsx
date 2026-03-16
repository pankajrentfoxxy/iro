'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface Influencer {
  id: string;
  name: string | null;
  state: string | null;
  district: string | null;
  engagementScore: number;
  ideologyScore: number;
  referralCode: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('/api/analytics/influencers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setInfluencers(d.influencers || []))
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
        <h1 className="text-3xl font-bold text-primary mb-6">Ideology & Engagement Analytics</h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden"
        >
          <h2 className="px-6 py-4 bg-neutral-50 font-semibold text-primary">
            Top Influencers / Volunteers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">State</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">District</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Engagement</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Ideology</th>
                </tr>
              </thead>
              <tbody>
                {influencers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      No influencers yet
                    </td>
                  </tr>
                ) : (
                  influencers.map((u) => (
                    <tr key={u.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3">{u.name || '—'}</td>
                      <td className="px-4 py-3">{u.state || '—'}</td>
                      <td className="px-4 py-3">{u.district || '—'}</td>
                      <td className="px-4 py-3">{u.engagementScore}</td>
                      <td className="px-4 py-3">{u.ideologyScore.toFixed(1)}</td>
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
