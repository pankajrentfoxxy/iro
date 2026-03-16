'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import IndiaMapD3 from '@/components/IndiaMapD3';
import StateDistrictMap from '@/components/StateDistrictMap';

interface PublicStats {
  totalMembers: number;
  byState: { state: string | null; count: number }[];
}

export default function ReformerMapPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<{ district: string; count: number }[]>([]);

  useEffect(() => {
    fetch('/api/public/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setDistrictData([]);
      return;
    }
    fetch(`/api/public/stats/districts?state=${encodeURIComponent(selectedState)}`)
      .then((r) => r.json())
      .then((d) => setDistrictData(d.districts || []))
      .catch(() => setDistrictData([]));
  }, [selectedState]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F7F4EF]">
        <div className="animate-pulse text-[#2C3E50] font-medium">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#E8892C] font-medium hover:text-[#B8692A] mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-2">
            Reformer Map
          </h1>
          <p className="text-[#2C3E50]/70">
            Explore Reformer distribution across India. Hover on a state for count, click for district-wise breakdown.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-[#E8892C]/10"
        >
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {selectedState ? (
                <motion.div
                  key="districts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <StateDistrictMap
                    state={selectedState}
                    districts={districtData}
                    totalReformers={stats?.byState?.find((s) => s.state === selectedState)?.count ?? 0}
                    onBack={() => setSelectedState(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1"
                >
                  <IndiaMapD3
                    data={stats?.byState ?? []}
                    onStateClick={(state) => setSelectedState(state)}
                    hideDetailPanel
                    memberLabel="Reformers"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
