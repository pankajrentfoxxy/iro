'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Registration {
  id: string;
  memberId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  mobile: string;
  age: number | null;
  reason: string | null;
  createdAt: string;
}

interface ListResponse {
  total: number;
  page: number;
  totalPages: number;
  registrations: Registration[];
}

const emptyFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
};

function buildQuery(filters: typeof emptyFilters, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  params.set('page', String(page));
  params.set('limit', '20');
  return params.toString();
}

function formatName(r: Registration) {
  const combined = [r.firstName, r.lastName].filter(Boolean).join(' ').trim();
  return combined || r.fullName || '—';
}

export default function RegistrationsAdminPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);

  const fetchData = useCallback(async (f: typeof emptyFilters, p: number) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/registrations?${buildQuery(f, p)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to load registrations');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(appliedFilters, page);
  }, [appliedFilters, page, fetchData]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleExport = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/registrations/export?${buildQuery(appliedFilters, 1)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iro-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    'rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/50';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-muted-foreground">
          <span>Registrations</span>
        </nav>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="font-display font-bold text-primary text-2xl">
          Join the Movement — Registrations
          {data && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-sm font-normal text-muted-foreground">
              {data.total}
            </span>
          )}
        </h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-muted"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
            <input
              type="text"
              placeholder="Search name, mobile or member ID"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className={`${inputClass} w-full pl-9`}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className={`${inputClass} flex-1 min-w-0`}
              title="Registered from"
            />
            <span className="text-muted-foreground/80 text-xs">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className={`${inputClass} flex-1 min-w-0`}
              title="Registered to"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-muted-foreground rounded-lg text-sm hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground/80 animate-pulse">Loading registrations...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-sm">{error}</div>
        ) : !data || data.registrations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground/80 text-sm">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Member ID</th>
                  <th className="px-4 py-3 font-medium">First Name</th>
                  <th className="px-4 py-3 font-medium">Last Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.registrations.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/60">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{r.memberId}</td>
                    <td className="px-4 py-3 font-medium text-primary">{r.firstName || r.fullName?.split(' ')[0] || '—'}</td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {r.lastName || r.fullName?.split(' ').slice(1).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.mobile}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.age ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary-dark font-medium text-xs"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {data.page} of {data.totalPages} • {data.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h2 className="font-display font-bold text-primary text-lg">{formatName(selected)}</h2>
                  <p className="font-mono text-xs text-secondary">{selected.memberId}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-muted-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ['First Name', selected.firstName || selected.fullName?.split(' ')[0] || '—'],
                  ['Last Name', selected.lastName || selected.fullName?.split(' ').slice(1).join(' ') || '—'],
                  ['Mobile', selected.mobile],
                  ['Age', selected.age != null ? String(selected.age) : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground/80 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-primary font-medium">{value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground/80 uppercase tracking-wide mb-0.5">
                    Why do they want to join?
                  </p>
                  <p className="text-primary">{selected.reason || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground/80 uppercase tracking-wide mb-0.5">Registered At</p>
                  <p className="text-primary">
                    {new Date(selected.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
