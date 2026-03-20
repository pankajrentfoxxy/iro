'use client';

import { useState, useEffect, useCallback } from 'react';
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchApi, getToken } from '@/lib/api';

const INDIAN_STATES = [
  'All',
  'Andhra Pradesh',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
];

interface Member {
  id: string;
  name: string;
  phone: string;
  state: string;
  district: string;
  joinedDate: string;
  source: 'missed_call' | 'whatsapp' | 'direct' | 'referral';
  status: 'active' | 'blocked';
}

function mapSignupSourceToSource(signupSource: string | null): Member['source'] {
  if (!signupSource) return 'direct';
  const m: Record<string, Member['source']> = {
    MISSED_CALL: 'missed_call',
    WHATSAPP: 'whatsapp',
    WEB: 'direct',
    APP: 'direct',
    REFERRAL: 'referral',
  };
  return m[signupSource] ?? 'direct';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SourceBadge({ source }: { source: Member['source'] }) {
  const styles: Record<Member['source'], string> = {
    missed_call: 'bg-orange-100 text-orange-700',
    whatsapp: 'bg-green-100 text-green-700',
    direct: 'bg-blue-100 text-blue-700',
    referral: 'bg-purple-100 text-purple-700',
  };
  const labels: Record<Member['source'], string> = {
    missed_call: 'Missed Call',
    whatsapp: 'WhatsApp',
    direct: 'Direct',
    referral: 'Referral',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[source]}`}>
      {labels[source]}
    </span>
  );
}

interface UsersResponse {
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
    state: string | null;
    district: string | null;
    tehsil: string | null;
    city: string | null;
    signupSource: string | null;
    createdAt: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function MembersTable() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Please log in to view members');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(perPage));
      if (stateFilter !== 'All') params.set('state', stateFilter);
      if (sourceFilter !== 'All') {
        const srcMap: Record<string, string> = {
          missed_call: 'MISSED_CALL',
          whatsapp: 'WHATSAPP',
          direct: 'direct',
          referral: 'REFERRAL',
        };
        params.set('signupSource', srcMap[sourceFilter] ?? sourceFilter);
      }
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetchApi<UsersResponse>(`/users?${params}`, { token });
      const mapped: Member[] = (res.users || []).map((u) => ({
        id: u.id,
        name: u.name || '—',
        phone: u.phone,
        state: u.state || '—',
        district: u.district || '—',
        joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '—',
        source: mapSignupSourceToSource(u.signupSource),
        status: 'active' as const,
      }));
      setMembers(mapped);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, stateFilter, sourceFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const totalPages = Math.ceil(total / perPage) || 1;
  const paginated = members;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((m) => m.id)));
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="All">All</option>
            <option value="missed_call">Missed Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="direct">Direct</option>
            <option value="referral">Referral</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="To"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-[#E8892C] text-white rounded-lg text-sm font-medium hover:bg-[#E8892C]/90"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSearch('');
              setStateFilter('All');
              setSourceFilter('All');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading members...</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  District
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8892C]/20 flex items-center justify-center text-[#E8892C] font-semibold text-xs">
                        {getInitials(m.name)}
                      </div>
                      <span className="font-medium text-[#0D1B2A]">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.phone}</td>
                  <td className="px-4 py-3 text-sm">{m.state}</td>
                  <td className="px-4 py-3 text-sm">{m.district}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.joinedDate}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={m.source} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === m.id ? null : m.id)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === m.id && (
                      <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                          View Profile
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-orange-600">
                          Block
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        )}
        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of{' '}
            {total} results
          </span>
          <div className="flex items-center gap-4">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-gray-200 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#E8892C] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4">
          <span className="font-medium">{selected.size} members selected</span>
          <button className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30">
            Export Selected
          </button>
          <button className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30">
            Block Selected
          </button>
          <button className="px-3 py-1 bg-red-500/80 rounded-lg text-sm hover:bg-red-500">
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-white/80 hover:text-white text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
