'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import IROLogo from '@/components/ui/IROLogo';

const SIDEBAR_LINKS = [
  { label: 'Overview', href: '/my-account' },
  { label: 'Profile', href: '/my-account/profile' },
  { label: 'Refer & Grow', href: '/my-account/refer' },
];

export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

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
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <div className="animate-pulse text-[#2C3E50]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 shrink-0"
          >
            <div className="bg-white rounded-xl shadow-lg border border-[#E8892C]/10 overflow-hidden">
              <div className="p-4 border-b border-[#E8892C]/10">
                <Link href="/">
                  <IROLogo variant="light" size={36} showText={false} />
                </Link>
                <h2 className="font-display text-lg font-bold text-[#0D1B2A] mt-3">
                  My Account
                </h2>
              </div>
              <nav className="p-2">
                {SIDEBAR_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
                      pathname === link.href
                        ? 'bg-[#E8892C]/15 text-[#E8892C]'
                        : 'text-[#2C3E50] hover:bg-[#2C3E50]/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-[#E8892C]/10">
                <Link
                  href="/"
                  className="text-sm text-[#2C3E50]/70 hover:text-[#E8892C]"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </motion.aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
