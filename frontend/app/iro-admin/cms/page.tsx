'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { fetchApi, getToken } from '@/lib/api';

type TabId = 'news' | 'press' | 'gallery' | 'stats';

interface LatestUpdate {
  id: string;
  title: string;
  excerpt: string;
  body: string | null;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
}

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const [newsFormOpen, setNewsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<LatestUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    excerpt: '',
    body: '',
    imageUrl: '',
  });
  const [statsOverride, setStatsOverride] = useState({
    totalReformers: '',
    states: '',
    districts: '',
    growthPercent: '',
    useOverride: false,
  });

  const loadUpdates = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ updates: LatestUpdate[] }>('/admin/latest-updates', { token });
      setUpdates(res.updates || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load updates');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatsOverride = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetchApi<{
        totalReformers: number | null;
        states: number | null;
        districts: number | null;
        growthPercent: string | null;
        useOverride: boolean;
      }>('/admin/homepage-stats-override', { token });
      setStatsOverride({
        totalReformers: res.totalReformers != null ? String(res.totalReformers) : '',
        states: res.states != null ? String(res.states) : '',
        districts: res.districts != null ? String(res.districts) : '',
        growthPercent: res.growthPercent ?? '',
        useOverride: res.useOverride ?? false,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'news') loadUpdates();
    if (activeTab === 'stats') loadStatsOverride();
  }, [activeTab, loadUpdates, loadStatsOverride]);

  const handleSaveNews = async () => {
    const token = getToken();
    if (!token || !newsForm.title || !newsForm.excerpt) {
      setError('Title and excerpt are required');
      return;
    }
    try {
      if (editingId) {
        await fetchApi(`/admin/latest-updates/${editingId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            title: newsForm.title,
            excerpt: newsForm.excerpt,
            body: newsForm.body || undefined,
            imageUrl: newsForm.imageUrl || undefined,
          }),
        });
      } else {
        await fetchApi('/admin/latest-updates', {
          method: 'POST',
          token,
          body: JSON.stringify({
            title: newsForm.title,
            excerpt: newsForm.excerpt,
            body: newsForm.body || undefined,
            imageUrl: newsForm.imageUrl || undefined,
          }),
        });
      }
      setNewsFormOpen(false);
      setEditingId(null);
      setNewsForm({ title: '', excerpt: '', body: '', imageUrl: '' });
      loadUpdates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const token = getToken();
    if (!token) return;
    try {
      await fetchApi(`/admin/latest-updates/${id}`, { method: 'DELETE', token });
      loadUpdates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleSaveStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await fetchApi('/admin/homepage-stats-override', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          totalReformers: statsOverride.totalReformers ? parseInt(statsOverride.totalReformers, 10) : undefined,
          states: statsOverride.states ? parseInt(statsOverride.states, 10) : undefined,
          districts: statsOverride.districts ? parseInt(statsOverride.districts, 10) : undefined,
          growthPercent: statsOverride.growthPercent ? parseFloat(statsOverride.growthPercent) : undefined,
          useOverride: statsOverride.useOverride,
        }),
      });
      loadStatsOverride();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleUseLiveData = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await fetchApi('/admin/homepage-stats-override', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ useOverride: false }),
      });
      setStatsOverride((s) => ({ ...s, useOverride: false }));
      loadStatsOverride();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const openEditNews = (u: LatestUpdate) => {
    setEditingId(u.id);
    setNewsForm({
      title: u.title,
      excerpt: u.excerpt,
      body: u.body || '',
      imageUrl: u.imageUrl || '',
    });
    setNewsFormOpen(true);
  };

  const openCreateNews = () => {
    setEditingId(null);
    setNewsForm({ title: '', excerpt: '', body: '', imageUrl: '' });
    setNewsFormOpen(true);
  };

  const tabs = [
    { id: 'news' as TabId, label: 'News Posts' },
    { id: 'press' as TabId, label: 'Press Releases' },
    { id: 'gallery' as TabId, label: 'Media Gallery' },
    { id: 'stats' as TabId, label: 'Homepage Stats Override' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-gray-500">Media / CMS</nav>
      </div>

      <h1 className="font-display font-bold text-[#0D1B2A] text-2xl mb-6">
        CMS
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-[#E8892C] text-[#E8892C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* News Posts tab */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateNews}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#E8892C]/90"
            >
              <Plus size={18} />
              Create Post
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {updates.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#0D1B2A]">
                      {post.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditNews(post)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(post.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {/* Press Releases tab - placeholder */}
      {activeTab === 'press' && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          Press Releases – Coming soon
        </div>
      )}

      {/* Media Gallery tab - placeholder */}
      {activeTab === 'gallery' && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">
          Media Gallery – Coming soon
        </div>
      )}

      {/* Homepage Stats Override tab */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-xl">
          <p className="text-sm text-gray-500 mb-6">
            These override the live count. Use only if live count is wrong.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="useOverride"
              checked={statsOverride.useOverride}
              onChange={(e) =>
                setStatsOverride({ ...statsOverride, useOverride: e.target.checked })
              }
            />
            <label htmlFor="useOverride" className="text-sm font-medium">
              Use override values on homepage
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Reformers
              </label>
              <input
                type="number"
                value={statsOverride.totalReformers}
                onChange={(e) =>
                  setStatsOverride({ ...statsOverride, totalReformers: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="e.g. 1250"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                States
              </label>
              <input
                type="number"
                value={statsOverride.states}
                onChange={(e) =>
                  setStatsOverride({ ...statsOverride, states: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="e.g. 28"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Districts
              </label>
              <input
                type="number"
                value={statsOverride.districts}
                onChange={(e) =>
                  setStatsOverride({ ...statsOverride, districts: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="e.g. 750"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Growth %
              </label>
              <input
                type="number"
                value={statsOverride.growthPercent}
                onChange={(e) =>
                  setStatsOverride({ ...statsOverride, growthPercent: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="e.g. 12.5"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSaveStats}
              className="px-4 py-2 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#E8892C]/90"
            >
              Save Overrides
            </button>
            <button
              onClick={handleUseLiveData}
              className="px-4 py-2 text-[#E8892C] hover:underline"
            >
              Use Live Data
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Post form modal */}
      {newsFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="font-display font-bold text-xl mb-6">
              {editingId ? 'Edit Post' : 'Create Post'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt * (max 500 chars)
                </label>
                <textarea
                  value={newsForm.excerpt}
                  onChange={(e) =>
                    setNewsForm({ ...newsForm, excerpt: e.target.value.slice(0, 500) })
                  }
                  maxLength={500}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="Short excerpt"
                />
                <p className="text-xs text-gray-500 mt-1">{newsForm.excerpt.length}/500</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={newsForm.body}
                  onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="Full content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={newsForm.imageUrl}
                  onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button
                onClick={() => {
                  setNewsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNews}
                disabled={!newsForm.title || !newsForm.excerpt}
                className="px-4 py-2 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#E8892C]/90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
