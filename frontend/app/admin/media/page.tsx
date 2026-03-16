'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getToken } from '@/lib/api';

interface MediaItem {
  id: string;
  type: string;
  title: string;
  caption: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'video', label: 'Videos' },
] as const;

export default function AdminMediaPage() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'all' | 'gallery' | 'video'>('all');
  const [form, setForm] = useState({
    type: 'gallery' as 'gallery' | 'video',
    title: '',
    caption: '',
    imageUrl: '',
    videoUrl: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const typeParam = tab === 'all' ? '' : tab;
    const url = typeParam ? `/api/admin/media?type=${typeParam}` : '/api/admin/media';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 403) router.replace('/');
        return r.json();
      })
      .then((d) => setItems(d.items || []))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router, tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          caption: form.caption || undefined,
          imageUrl: form.type === 'gallery' ? form.imageUrl || undefined : undefined,
          videoUrl: form.type === 'video' ? form.videoUrl || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setItems((prev) => [data, ...prev]);
      setForm({ type: 'gallery', title: '', caption: '', imageUrl: '', videoUrl: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <p className="text-[#2C3E50]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-[#0D1B2A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-lg font-bold hover:text-[#E8892C] transition">
            ← IRO Admin
          </Link>
          <span className="text-sm text-white/70">Media (Gallery & Videos)</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-[#0D1B2A] mb-6">Media Library</h1>
        <p className="text-[#2C3E50]/70 mb-6">
          Add photos to Gallery and videos (YouTube links) to Videos. These appear on the public Media page.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-lg shadow border border-[#E8892C]/10 w-fit mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t.id ? 'bg-[#E8892C] text-white' : 'text-[#2C3E50] hover:bg-[#2C3E50]/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="bg-white rounded-xl p-6 shadow border border-[#E8892C]/10 mb-8"
        >
          <h2 className="font-semibold text-[#0D1B2A] mb-4">Add New Item</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                checked={form.type === 'gallery'}
                onChange={() => setForm((f) => ({ ...f, type: 'gallery' }))}
              />
              <span className="text-sm">Gallery (Photo)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                checked={form.type === 'video'}
                onChange={() => setForm((f) => ({ ...f, type: 'video' }))}
              />
              <span className="text-sm">Video (YouTube)</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2C3E50] mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-[#2C3E50]/20 bg-[#F7F4EF]"
                placeholder="e.g. IRO State Meet 2024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C3E50] mb-1">Caption (optional)</label>
              <input
                type="text"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-[#2C3E50]/20 bg-[#F7F4EF]"
                placeholder="Brief description"
              />
            </div>
            {form.type === 'gallery' && (
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-[#2C3E50]/20 bg-[#F7F4EF]"
                  placeholder="https://..."
                  required
                />
              </div>
            )}
            {form.type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-[#2C3E50]/20 bg-[#F7F4EF]"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-6 py-2.5 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#B8692A] disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Item'}
          </button>
        </motion.form>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl overflow-hidden shadow border border-[#E8892C]/10"
            >
              {item.type === 'gallery' && item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full aspect-square object-cover"
                />
              ) : item.type === 'video' && item.videoUrl ? (
                <div className="aspect-video bg-[#2C3E50]/10 flex items-center justify-center">
                  <span className="text-[#2C3E50]/60 text-sm">Video</span>
                </div>
              ) : (
                <div className="aspect-square bg-[#2C3E50]/10 flex items-center justify-center">
                  <span className="text-[#2C3E50]/60 text-sm">No preview</span>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-[#0D1B2A] truncate">{item.title}</h3>
                {item.caption && (
                  <p className="text-sm text-[#2C3E50]/70 truncate mt-0.5">{item.caption}</p>
                )}
                <p className="text-xs text-[#2C3E50]/50 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()} · {item.type}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="mt-2 text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-[#2C3E50]/60 text-center py-12">
            No media items yet. Add photos or videos above.
          </p>
        )}
      </main>
    </div>
  );
}
