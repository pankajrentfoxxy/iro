'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  engagementScore: number;
  ideologyScore: number;
  referralCode: string;
  signupSource: string;
  createdAt: string;
}

interface Paginated {
  users: User[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function UsersPage() {
  const router = useRouter();
  const [data, setData] = useState<Paginated | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch(`/api/users?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => router.replace('/login'));
  }, [router, page]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-primary mb-6">Members</h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">State</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">District</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Engagement</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">{u.name || '—'}</td>
                    <td className="px-4 py-3">{u.state || '—'}</td>
                    <td className="px-4 py-3">{u.district || '—'}</td>
                    <td className="px-4 py-3">{u.engagementScore}</td>
                    <td className="px-4 py-3">{u.signupSource || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-neutral-50 flex justify-between items-center">
            <span className="text-sm text-neutral-500">
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= data.pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
