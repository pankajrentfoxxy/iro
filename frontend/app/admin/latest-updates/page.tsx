'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface Update {
  id: string;
  title: string;
  excerpt: string;
  body: string | null;
  imageUrl: string | null;
  publishedAt: string;
}

export default function AdminLatestUpdatesPage() {
  const router = useRouter();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', excerpt: '', body: '', imageUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('/api/admin/latest-updates', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 403) router.replace('/');
        return r.json();
      })
      .then((d) => setUpdates(d.updates || []))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/latest-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          body: form.body || undefined,
          imageUrl: form.imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUpdates((prev) => [data, ...prev]);
      setForm({ title: '', excerpt: '', body: '', imageUrl: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this update?')) return;
    try {
      await fetch(`/api/admin/latest-updates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError('Failed to delete');
    }
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
      <nav className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-lg font-bold">
            ← IRO Admin
          </Link>
          <span className="text-sm text-neutral-300">Latest Updates</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Latest Updates (Home Hero)</h1>
        <p className="text-slate-600 mb-6">
          The most recent update appears in the full-page hero on the home page.
        </p>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="bg-white rounded-xl p-6 shadow border border-slate-200 mb-8"
        >
          <h2 className="font-semibold text-primary mb-4">Add New Update</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                placeholder="e.g. Welcome to IRO"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt (hero text)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                rows={2}
                placeholder="Short summary for the hero section"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (optional)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200"
                placeholder="https://..."
              />
            </div>
          </div>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Update'}
          </button>
        </motion.form>

        <div className="space-y-4">
          {updates.map((u) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow border border-slate-200"
            >
              <h3 className="font-semibold text-primary">{u.title}</h3>
              <p className="text-slate-600 text-sm mt-1">{u.excerpt}</p>
              <p className="text-slate-400 text-xs mt-2">
                {new Date(u.publishedAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  className="px-4 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {updates.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            No updates yet. Add one above. The default welcome message will show on the home page until you add an update.
          </p>
        )}
      </main>
    </div>
  );
}
