'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function ReferPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <p className="text-primary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur border-b border-white/10">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
        <div className="max-w-3xl mx-auto px-4 flex justify-between items-center h-14">
          <Logo variant="nav" href="/" />
          <Link href="/" className="text-neutral-300 hover:text-white text-sm">← Back</Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <h1 className="text-xl font-bold text-primary mb-2">Refer & Grow</h1>
          <p className="text-slate-600 text-sm mb-6">
            Share your referral code with friends. When they join IRO, you both benefit.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Referral Code</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={user?.referralCode || '-'}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 font-mono font-semibold text-primary"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Share Link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-slate-500 text-xs">
            <Link href="/profile" className="text-accent hover:underline">Edit Profile</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
