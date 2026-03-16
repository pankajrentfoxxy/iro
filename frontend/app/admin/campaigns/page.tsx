'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface Campaign {
  id: string;
  title: string;
  status: string;
  campaignType: string;
  _count: { campaignLogs: number; bulkSmsQueue: number };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []))
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
        <h1 className="text-3xl font-bold text-primary mb-6">Campaigns</h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4"
        >
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-neutral-500">
              No campaigns yet. Create one via API or add campaign creation UI.
            </div>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl p-6 shadow border border-neutral-200"
              >
                <h3 className="font-semibold text-primary">{c.title}</h3>
                <div className="flex gap-4 mt-2 text-sm text-neutral-500">
                  <span>Type: {c.campaignType}</span>
                  <span>Status: {c.status}</span>
                  <span>Targets: {c._count.bulkSmsQueue}</span>
                  <span>Logs: {c._count.campaignLogs}</span>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
}
