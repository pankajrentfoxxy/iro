'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import IndiaMap from '@/components/IndiaMap';
import StateDistrictMap from '@/components/StateDistrictMap';
import NewsCarousel from '@/components/NewsCarousel';
import { WELCOME_MESSAGE } from '@/lib/welcome';
import { LATEST_UPDATES_FALLBACK } from '@/lib/latestUpdatesFallback';

interface PublicStats {
  totalMembers: number;
  stateCount: number;
  districtCount: number;
  growthPercent: string;
  totalCampaigns: number;
  totalVolunteers: number;
  byState: { state: string | null; count: number }[];
  byDistrict: { state: string; district: string; count: number }[];
}

interface LatestUpdate {
  id?: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt?: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<{ district: string; count: number }[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<LatestUpdate[]>([]);

  useEffect(() => {
    fetch('/api/public/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/public/latest-updates')
      .then((r) => r.json())
      .then((d) => setLatestUpdates(d.updates?.length ? d.updates : LATEST_UPDATES_FALLBACK))
      .catch(() => setLatestUpdates(LATEST_UPDATES_FALLBACK));
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
        <div className="animate-pulse text-[#2C3E50] font-medium">Loading...</div>
      </div>
    );
  }

  const displayUpdates = latestUpdates.length > 0 ? latestUpdates : LATEST_UPDATES_FALLBACK;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* ── 1. Hero ───────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 flex items-center justify-center overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A] via-[#0D1B2A]/95 to-[#0D1B2A]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #E8892C 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
          >
            Indian Reformer Organisation
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[#E8892C] text-lg md:text-xl font-semibold tracking-[0.2em] uppercase mb-8"
          >
            Reforming India, Together
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-10"
          >
            A citizen-led movement for transparent governance and reform across every state of India.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link
              href="/join-the-movement"
              className="inline-block px-8 py-4 bg-[#E8892C] text-white font-semibold rounded-lg hover:bg-[#B8692A] transition-colors shadow-lg"
            >
              Join the Movement
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Stats Bar ─────────────────────────────────────── */}
      <section className="relative -mt-6 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Reformers', value: stats?.totalMembers ?? 0 },
              { label: 'States', value: stats?.stateCount ?? 0 },
              { label: 'Districts', value: stats?.districtCount ?? 0 },
              { label: 'Growth', value: `${stats?.growthPercent ?? 0}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl p-5 shadow-lg border border-[#E8892C]/10"
              >
                <p className="text-[#2C3E50]/60 text-sm font-medium">{item.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-[#0D1B2A] mt-1">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. News Carousel ─────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-2">
              Latest Updates
            </h2>
            <div className="h-1 w-20 bg-[#E8892C] rounded-full mb-6" />
            <NewsCarousel items={displayUpdates} />
          </motion.div>
        </div>
      </section>

      {/* ── 4. India Map Preview ──────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-[#E8892C]/10"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-2">
                  Reformer Distribution
                </h2>
                <p className="text-[#2C3E50]/70 text-sm">
                  Hover on a state to see Reformer count. Click to explore district-wise breakdown.
                </p>
              </div>
              <Link
                href="/reformer-map"
                className="inline-flex items-center gap-2 text-[#E8892C] font-semibold hover:text-[#B8692A] transition-colors text-sm"
              >
                Explore Full Map
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="min-h-[340px]">
              <AnimatePresence mode="wait">
                {selectedState ? (
                  <motion.div
                    key="districts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#F7F4EF] rounded-xl p-6 border border-[#E8892C]/10 h-full"
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
                    <IndiaMap
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
      </section>

      {/* ── 5. About Snippet ──────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-4">
                {WELCOME_MESSAGE.title}
              </h2>
              <p className="text-[#2C3E50] leading-relaxed mb-4">
                {WELCOME_MESSAGE.excerpt}
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[#E8892C] font-semibold hover:text-[#B8692A] transition-colors"
              >
                Know Us
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 border border-[#E8892C]/10 shadow">
                <p className="text-[#2C3E50]/70 text-sm font-medium">Total Campaigns</p>
                <p className="text-3xl font-bold text-[#E8892C] mt-1">{stats?.totalCampaigns ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#E8892C]/10 shadow">
                <p className="text-[#2C3E50]/70 text-sm font-medium">Volunteers</p>
                <p className="text-3xl font-bold text-[#E8892C] mt-1">{stats?.totalVolunteers ?? 0}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 6. Join CTA Banner ──────────────────────────────── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-[#0D1B2A] px-8 py-12 md:px-16 md:py-16 text-center"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #E8892C 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <h2 className="font-display text-2xl md:text-4xl font-bold text-white mb-3">
                Be Part of the Change
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of reformers working towards transparent governance and a better India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/join-the-movement"
                  className="inline-block px-8 py-4 bg-[#E8892C] text-white font-semibold rounded-lg hover:bg-[#B8692A] transition-colors"
                >
                  Join the Movement
                </Link>
                <Link
                  href="/donate"
                  className="inline-block px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Donate
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
