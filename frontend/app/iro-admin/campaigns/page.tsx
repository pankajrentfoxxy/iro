'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Eye, Pause, Trash2, LayoutGrid, List } from 'lucide-react';
import { fetchApi, getToken } from '@/lib/api';

type ViewMode = 'table' | 'grid';
type CampaignType = 'SMS' | 'WHATSAPP' | 'PUSH' | 'EVENT';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  campaignType: CampaignType;
  status: string;
  targetState: string | null;
  createdAt: string;
  completedAt: string | null;
  _count?: { bulkSmsQueue: number };
}

export default function CampaignsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    campaignType: 'SMS' as CampaignType,
    messageContent: '',
    targetState: '',
    targetDistrict: '',
    targetTehsil: '',
  });

  const loadCampaigns = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Please log in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ campaigns: Campaign[] }>('/campaigns', { token });
      setCampaigns(res.campaigns || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      campaignType: 'SMS',
      messageContent: '',
      targetState: '',
      targetDistrict: '',
      targetTehsil: '',
    });
    setPanelOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description || '',
      campaignType: c.campaignType,
      messageContent: '',
      targetState: c.targetState || '',
      targetDistrict: '',
      targetTehsil: '',
    });
    setPanelOpen(true);
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token || !form.title || !form.messageContent) {
      setError('Title and message content are required');
      return;
    }
    try {
      await fetchApi('/campaigns', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          campaignType: form.campaignType,
          messageContent: form.messageContent,
          targetState: form.targetState || undefined,
          targetDistrict: form.targetDistrict || undefined,
          targetTehsil: form.targetTehsil || undefined,
        }),
      });
      setPanelOpen(false);
      loadCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign');
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    paused: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-gray-500">Campaigns</nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-[#0D1B2A] text-2xl">
          Campaigns
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8892C] text-white rounded-lg font-medium hover:bg-[#E8892C]/90"
        >
          <Plus size={18} />
          Create New Campaign
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <List size={18} />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <LayoutGrid size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Campaigns list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading campaigns...</div>
        ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Start
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                End
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Participants
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#0D1B2A]">{c.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.campaignType}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-sm">{c.completedAt ? new Date(c.completedAt).toISOString().slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-sm">{c._count?.bulkSmsQueue ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                      title="Pause/Resume"
                    >
                      <Pause size={16} />
                    </button>
                    <button
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      title="Delete"
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

      {/* Create/Edit panel */}
      {panelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
            <div className="p-6">
              <h2 className="font-display font-bold text-xl mb-6">
                {editingId ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="Campaign title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Type *
                  </label>
                  <select
                    value={form.campaignType}
                    onChange={(e) => setForm({ ...form, campaignType: e.target.value as CampaignType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PUSH">Push</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content * (max 1600 chars)
                  </label>
                  <textarea
                    value={form.messageContent}
                    onChange={(e) =>
                      setForm({ ...form, messageContent: e.target.value.slice(0, 1600) })
                    }
                    maxLength={1600}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="Message to send"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.messageContent.length}/1600</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target State
                  </label>
                  <input
                    type="text"
                    value={form.targetState}
                    onChange={(e) => setForm({ ...form, targetState: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="e.g. Uttar Pradesh (leave empty for all)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target District
                  </label>
                  <input
                    type="text"
                    value={form.targetDistrict}
                    onChange={(e) => setForm({ ...form, targetDistrict: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Tehsil
                  </label>
                  <input
                    type="text"
                    value={form.targetTehsil}
                    onChange={(e) => setForm({ ...form, targetTehsil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-8">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!!editingId || !form.title || !form.messageContent}
                  className="px-4 py-2 bg-[#E8892C] text-white rounded-lg hover:bg-[#E8892C]/90 disabled:opacity-50"
                  title={editingId ? 'Campaign edit not supported' : ''}
                >
                  {editingId ? 'View only' : 'Create & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
