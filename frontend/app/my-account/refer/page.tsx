'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MyAccountReferPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string | null; referralCode: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) router.push('/login');
        else setUser({ name: d.name, referralCode: d.referralCode || '' });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user?.referralCode || ''}` : '';

  const handleCopy = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-primary mb-1">Refer & Grow</h1>
        <p className="text-muted-foreground/70 text-sm">
          Share your referral code with friends. When they join IRO, you both benefit.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow border border-secondary/10 space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Your Referral Code</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={user?.referralCode || '-'}
              className="flex-1 px-4 py-3 rounded-lg bg-background border border-border font-mono font-semibold text-primary"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-secondary-dark transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Share Link</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-4 py-3 rounded-lg bg-background border border-border text-sm text-muted-foreground truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="text-center text-muted-foreground/60 text-sm pt-2">
          <a href="/my-account/profile" className="text-secondary hover:underline">Edit Profile</a>
        </p>
      </div>
    </motion.div>
  );
}
