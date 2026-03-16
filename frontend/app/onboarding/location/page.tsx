'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LocationOnboardingPage() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{
    state?: string;
    district?: string;
    block?: string;
    village?: string;
    city?: string;
    pincode?: string;
  } | null>(null);

  const handleGetLocation = async () => {
    setError('');
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const res = await fetch('/api/auth/me/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        throw new Error(data.error || 'Failed to save location');
      }
      setLocation(data.location);
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'GeolocationPositionError') {
          setError('Location access denied. You can add it later in Profile.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Could not get location');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-slate-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Share your location</h1>
          <p className="text-slate-600 mt-1">
            We&apos;ll use it to find your State, District, Block, Area/Place and Pincode
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={loading}
            className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-light disabled:opacity-50 transition"
          >
            {loading ? 'Getting location...' : 'Allow & Get Location'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-2 text-slate-500 hover:text-slate-800 text-sm"
          >
            Skip for now (add in Profile later)
          </button>
        </div>

        {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
        {location && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-700">
            <p><strong>State:</strong> {location.state || '-'}</p>
            <p><strong>District:</strong> {location.district || '-'}</p>
            <p><strong>Block:</strong> {location.block || '-'}</p>
            <p><strong>Area/Place:</strong> {location.village || '-'}</p>
            <p><strong>Pincode:</strong> {location.pincode || '-'}</p>
          </div>
        )}

        <p className="mt-6 text-center text-slate-600 text-sm">
          <Link href="/" className="text-accent font-medium hover:underline">
            Go to Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
