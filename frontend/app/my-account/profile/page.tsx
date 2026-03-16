'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
  referralCode: string;
}

export default function MyAccountProfilePage() {
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
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
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
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-[#2C3E50]">Loading profile...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0D1B2A] mb-1">Profile</h1>
        <p className="text-[#2C3E50]/70 text-sm">Manage your details and location</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow border border-[#E8892C]/10 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg bg-[#F7F4EF] border border-[#2C3E50]/20 text-[#0D1B2A] focus:ring-2 focus:ring-[#E8892C]/30 focus:border-[#E8892C] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2">Email (optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg bg-[#F7F4EF] border border-[#2C3E50]/20 text-[#0D1B2A] focus:ring-2 focus:ring-[#E8892C]/30 focus:border-[#E8892C] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C3E50] mb-2">Age (optional)</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            min={1}
            max={120}
            className="w-full px-4 py-3 rounded-lg bg-[#F7F4EF] border border-[#2C3E50]/20 text-[#0D1B2A] focus:ring-2 focus:ring-[#E8892C]/30 focus:border-[#E8892C] transition"
          />
        </div>

        <div className="pt-4 border-t border-[#E8892C]/10">
          <h2 className="font-semibold text-[#0D1B2A] mb-2">Location</h2>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="mb-4 py-2.5 px-5 bg-[#E8892C] text-white rounded-lg text-sm font-medium hover:bg-[#B8692A] disabled:opacity-50 transition"
          >
            {locationLoading ? 'Getting location...' : '📍 Use my location'}
          </button>
          {locationError && <p className="text-red-600 text-sm mb-2">{locationError}</p>}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra' },
              { key: 'district', label: 'District', placeholder: 'e.g. Mumbai' },
              { key: 'tehsil', label: 'Block', placeholder: 'e.g. Andheri' },
              { key: 'area', label: 'Area / Place', placeholder: 'e.g. Village name' },
              { key: 'city', label: 'City', placeholder: 'e.g. Mumbai' },
              { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 400001' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#2C3E50] mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-2 rounded-lg bg-[#F7F4EF] border border-[#2C3E50]/20 text-[#0D1B2A] focus:ring-2 focus:ring-[#E8892C]/30 focus:border-[#E8892C] transition"
                />
              </div>
            ))}
          </div>
        </div>

        {user?.referralCode && (
          <div className="pt-4 border-t border-[#E8892C]/10">
            <label className="block text-sm font-medium text-[#2C3E50] mb-1">Referral Code</label>
            <p className="text-[#E8892C] font-mono font-semibold">{user.referralCode}</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-[#E8892C] text-white rounded-lg font-semibold hover:bg-[#B8692A] disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </motion.div>
  );
}
