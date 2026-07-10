'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  campaignType: string;
  status: string;
  targetState?: string | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
            Campaigns
          </h1>
          <p className="text-muted-foreground">
            Our initiatives and outreach programmes across India
          </p>
        </motion.section>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-muted-foreground">Loading campaigns...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 md:p-16 text-center shadow-lg border border-secondary/10"
          >
            <div className="max-w-md mx-auto">
              <h2 className="font-display text-xl font-semibold text-primary mb-3">
                No active campaigns yet
              </h2>
              <p className="text-muted-foreground/70 text-sm mb-6">
                We are building campaigns to drive change across India. Join the movement to be part of future initiatives.
              </p>
              <Link
                href="/join-the-movement"
                className="inline-block px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark transition-colors"
              >
                Join the Movement
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 md:grid-cols-2 gap-6"
          >
            {campaigns.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="bg-white rounded-xl p-6 shadow-lg border border-secondary/10"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-display text-lg font-semibold text-primary">
                    {c.title}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.status === 'completed'
                        ? 'bg-muted text-muted-foreground'
                        : c.status === 'running'
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                {c.description && (
                  <p className="text-muted-foreground/70 text-sm mb-3 line-clamp-3">{c.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/60">
                  <span className="capitalize">{c.campaignType.toLowerCase()}</span>
                  {c.targetState && <span>• {c.targetState}</span>}
                  <span>
                    • {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <p className="mt-12 text-center">
          <Link href="/" className="text-secondary hover:text-secondary-dark font-medium text-sm">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
