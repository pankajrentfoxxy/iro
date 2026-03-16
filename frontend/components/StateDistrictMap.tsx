'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { STATE_TO_SVG_SLUG } from '@/lib/stateDistrictMaps';

interface DistrictData {
  district: string;
  count: number;
}

function getHeatColor(count: number, max: number): string {
  if (max === 0) return '#F7F4EF';
  const intensity = count / max;
  if (intensity < 0.2) return '#FEF3C7';
  if (intensity < 0.4) return '#FDBA74';
  if (intensity < 0.6) return '#FB923C';
  if (intensity < 0.8) return '#F97316';
  return '#E8892C';
}

function normalizeDistrictName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface Props {
  state: string;
  districts: DistrictData[];
  totalReformers: number;
  onBack: () => void;
}

export default function StateDistrictMap({ state, districts, totalReformers, onBack }: Props) {
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const slug = STATE_TO_SVG_SLUG[state];
  const maxCount = Math.max(...districts.map((d) => d.count), 1);
  const districtMapRef = useRef<Record<string, number>>({});
  districtMapRef.current = Object.fromEntries(districts.map((d) => [normalizeDistrictName(d.district), d.count]));

  useEffect(() => {
    if (!slug) {
      setSvgLoaded(false);
      return;
    }
    let cancelled = false;
    const map = districtMapRef.current;
    fetch(`/state-maps/${slug}.svg`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Not found'))))
      .then((html) => {
        if (cancelled || !svgRef.current) return;
        svgRef.current.innerHTML = html;
        const svg = svgRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('class', 'w-full h-auto');
          svg.style.minHeight = '200px';
          svg.style.cursor = 'pointer';
          const paths = svg.querySelectorAll('path[id], path[aria-label]');
          paths.forEach((path) => {
            const id = path.getAttribute('id') || '';
            const label = path.getAttribute('aria-label') || id;
            const districtName = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
            const normalized = normalizeDistrictName(districtName);
            const count = map[normalized] ?? map[normalized.replace(/\s*district\s*/i, '')] ?? 0;
            (path as SVGPathElement).style.transition = 'fill 0.2s, filter 0.2s';
            (path as SVGPathElement).style.fill = getHeatColor(count, maxCount);
            path.setAttribute('role', 'button');
            path.setAttribute('tabIndex', '0');

            path.addEventListener('mouseenter', function (e) {
              setSelectedDistrict(districtName);
              (path as SVGPathElement).style.filter = 'brightness(1.15)';
              const rect = (e.target as SVGPathElement).getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (containerRect) {
                setTooltip({
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top - 8,
                  text: `${districtName}: ${count} Reformers`,
                });
              }
            });
            path.addEventListener('mouseleave', () => {
              setSelectedDistrict(null);
              setTooltip(null);
              (path as SVGPathElement).style.filter = 'none';
            });
            path.addEventListener('click', () => setSelectedDistrict((s) => (s === districtName ? null : districtName)));
          });
        }
        setSvgLoaded(true);
      })
      .catch(() => setSvgLoaded(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Update path colors when district data changes
  useEffect(() => {
    if (!svgRef.current || !svgLoaded) return;
    const map = districtMapRef.current;
    const paths = svgRef.current.querySelectorAll('path[id], path[aria-label]');
    paths.forEach((path) => {
      const label = path.getAttribute('aria-label') || path.getAttribute('id') || '';
      const districtName = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const normalized = normalizeDistrictName(districtName);
      const count = map[normalized] ?? map[normalized.replace(/\s*district\s*/i, '')] ?? 0;
      (path as SVGPathElement).style.fill = getHeatColor(count, maxCount);
    });
  }, [svgLoaded, districts, maxCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#2C3E50] hover:text-[#E8892C] flex items-center gap-1"
        >
          ← Back to India map
        </button>
        <span className="text-lg font-bold text-[#E8892C]">{totalReformers} Reformers</span>
      </div>
      <h3 className="text-xl font-semibold text-[#0D1B2A] mb-4">{state} – District-wise</h3>

      {/* Interactive SVG map (when available) */}
      {slug && svgLoaded ? (
        <div
          ref={containerRef}
          className="mb-6 rounded-xl overflow-hidden border border-slate-200 bg-white relative"
        >
          <div ref={svgRef} className="w-full" />
          {tooltip && (
            <div
              className="absolute pointer-events-none z-10 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-lg text-sm font-medium text-slate-800 whitespace-nowrap -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
            </div>
          )}
          <p className="text-xs text-slate-500 px-3 py-2 border-t border-slate-100">
            Hover for district name & Reformers · Click to select
          </p>
        </div>
      ) : slug ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-slate-500 text-sm mb-2">
            Add <code className="bg-slate-200 px-1 rounded">state-maps/{slug}.svg</code> for interactive map.
          </p>
          <a
            href="https://commons.wikimedia.org/wiki/File:Districts_of_Uttar_Pradesh.svg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E8892C] hover:underline text-sm"
          >
            Download from Wikimedia Commons →
          </a>
        </div>
      ) : null}

      {/* District list – always visible, hoverable, clickable */}
      <h4 className="text-sm font-medium text-slate-600 mb-2">
        Districts & Reformer count {selectedDistrict && `· Selected: ${selectedDistrict}`}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-2">
        {districts.length === 0 ? (
          <p className="col-span-full text-slate-500 text-sm py-4">No district data yet</p>
        ) : (
          districts.map((d) => {
            const isSelected = selectedDistrict === d.district;
            return (
              <motion.button
                key={d.district}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedDistrict((s) => (s === d.district ? null : d.district))}
                className={`p-3 rounded-lg border-2 text-left transition text-sm ${
                  isSelected ? 'border-[#E8892C] ring-2 ring-[#E8892C]/30' : 'border-[#2C3E50]/20 hover:border-[#E8892C]/50'
                }`}
                style={{ backgroundColor: getHeatColor(d.count, maxCount) }}
                title={`${d.district}: ${d.count} Reformers`}
              >
                <p className="font-medium text-slate-800 truncate">{d.district}</p>
                <p className="text-xs text-slate-600 mt-0.5">{d.count} Reformers</p>
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
