'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  age: number | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  city: string | null;
  area: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  referralCode: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: '',
    state: '',
    district: '',
    tehsil: '',
    city: '',
    area: '',
    pincode: '',
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push('/login');
          return;
        }
        setUser(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          age: data.age?.toString() || '',
          state: data.state || '',
          district: data.district || '',
          tehsil: data.tehsil || '',
          city: data.city || '',
          area: data.area || '',
          pincode: data.pincode || '',
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email || undefined,
          age: form.age ? parseInt(form.age, 10) : undefined,
          state: form.state || undefined,
          district: form.district || undefined,
          tehsil: form.tehsil || undefined,
          city: form.city || undefined,
          area: form.area || undefined,
          pincode: form.pincode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setUser((u) => (u ? { ...u, ...data } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleGetLocation = async () => {
    setLocationError('');
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const res = await fetch('/api/auth/me/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save location');
      setForm((f) => ({
        ...f,
        state: data.location?.state || f.state,
        district: data.location?.district || f.district,
        tehsil: data.location?.block || f.tehsil,
        area: data.location?.village || f.area,
        city: data.location?.city || f.city,
        pincode: data.location?.pincode || f.pincode,
      }));
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLocationLoading(false);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur border-b border-white/10">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <Logo variant="nav" href="/" />
            <Link
              href="/"
              className="text-neutral-300 hover:text-white text-sm transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Profile</h1>
          <p className="text-slate-600 mt-1">
            Manage your details and location
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSave}
          className="space-y-4 bg-white rounded-xl p-6 shadow-lg border border-slate-200"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Age (optional)</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              min={1}
              max={120}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-2">Location</h2>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="mb-4 py-2.5 px-5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light disabled:opacity-50 transition active:scale-[0.98]"
            >
              {locationLoading ? 'Getting location...' : '📍 Use my location'}
            </button>
            {locationError && <p className="text-red-600 text-sm mb-2">{locationError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Block</label>
                <input
                  type="text"
                  value={form.tehsil}
                  onChange={(e) => setForm((f) => ({ ...f, tehsil: e.target.value }))}
                  placeholder="e.g. Andheri"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Area / Place</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  placeholder="e.g. Village name"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                  placeholder="e.g. 400001"
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {user?.referralCode && (
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1">Referral Code</label>
              <p className="text-accent font-mono font-semibold">{user.referralCode}</p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-light disabled:opacity-50 transition active:scale-[0.99]"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </motion.form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          <Link href="/" className="text-accent hover:underline">Back to Home</Link>
        </p>
      </main>
    </div>
  );
}
