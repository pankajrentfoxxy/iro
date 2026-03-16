'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateData {
  state: string | null;
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

interface Props {
  data: StateData[];
  onStateClick?: (state: string) => void;
  hideDetailPanel?: boolean;
  selectedState?: string | null;
  memberLabel?: string;
}

// Normalize API state names to match SVG (e.g. "NCT of Delhi" -> "Delhi")
const STATE_NAME_NORMALIZE: Record<string, string> = {
  'NCT of Delhi': 'Delhi',
  'National Capital Territory of Delhi': 'Delhi',
  'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
};

const STATE_ID_TO_NAME: Record<string, string> = {
  an: 'Andaman and Nicobar Islands',
  ap: 'Andhra Pradesh',
  ar: 'Arunachal Pradesh',
  as: 'Assam',
  br: 'Bihar',
  ch: 'Chandigarh',
  ct: 'Chhattisgarh',
  dn: 'Dadra and Nagar Haveli',
  dd: 'Daman and Diu',
  dl: 'Delhi',
  ga: 'Goa',
  gj: 'Gujarat',
  hr: 'Haryana',
  hp: 'Himachal Pradesh',
  jk: 'Jammu and Kashmir',
  jh: 'Jharkhand',
  ka: 'Karnataka',
  kl: 'Kerala',
  ld: 'Lakshadweep',
  mp: 'Madhya Pradesh',
  mh: 'Maharashtra',
  mn: 'Manipur',
  ml: 'Meghalaya',
  mz: 'Mizoram',
  nl: 'Nagaland',
  or: 'Odisha',
  py: 'Puducherry',
  pb: 'Punjab',
  rj: 'Rajasthan',
  sk: 'Sikkim',
  tn: 'Tamil Nadu',
  tg: 'Telangana',
  tr: 'Tripura',
  up: 'Uttar Pradesh',
  ut: 'Uttarakhand',
  wb: 'West Bengal',
};

export default function IndiaMap({ data, onStateClick, hideDetailPanel, selectedState: externalSelected, memberLabel = 'members' }: Props) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const selectedState = externalSelected ?? internalSelected;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const dataMap = Object.fromEntries(
    data.reduce((acc, d) => {
      const raw = d.state || '';
      const normalized = STATE_NAME_NORMALIZE[raw] || raw;
      acc.set(normalized, (acc.get(normalized) || 0) + (d.count || 0));
      return acc;
    }, new Map<string, number>()).entries()
  ) as Record<string, number>;
  const dataMapRef = useRef(dataMap);
  dataMapRef.current = dataMap;


  const onStateClickRef = useRef(onStateClick);
  onStateClickRef.current = onStateClick;
  const handleStateClick = (state: string) => {
    setInternalSelected(state);
    onStateClickRef.current?.(state);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/india-map.svg')
      .then((r) => r.text())
      .then((html) => {
        if (cancelled || !svgRef.current) return;
        svgRef.current.innerHTML = html;
        const svg = svgRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('class', 'w-full max-w-md h-auto');
          svg.style.minHeight = '280px';
          svg.style.cursor = 'pointer';
          const paths = svg.querySelectorAll('path[id]');
          paths.forEach((path) => {
            const id = path.getAttribute('id') || '';
            const stateName = STATE_ID_TO_NAME[id] || path.getAttribute('aria-label') || id;
            (path as SVGPathElement).style.transition = 'fill 0.2s, filter 0.2s';
            path.setAttribute('role', 'button');
            path.setAttribute('tabIndex', '0');

            path.addEventListener('mouseenter', function (e) {
              const count = dataMapRef.current[stateName] ?? 0;
              setHoverState(stateName);
              (path as SVGPathElement).style.filter = 'brightness(1.1)';
              const rect = (e.target as SVGPathElement).getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (containerRect) {
                setTooltip({
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top - 8,
                  text: `${stateName} (${count} ${memberLabel})`,
                });
              }
            });
            path.addEventListener('mouseleave', () => {
              setHoverState(null);
              setTooltip(null);
              (path as SVGPathElement).style.filter = 'none';
            });
            path.addEventListener('click', () => handleStateClick(stateName));
          });
        }
        setSvgLoaded(true);
      })
      .catch(() => !cancelled && setSvgLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !svgLoaded) return;
    const map = Object.fromEntries(data.map((d) => [d.state || '', d.count]));
    const paths = svgRef.current.querySelectorAll('path[id]');
    paths.forEach((path) => {
      const id = path.getAttribute('id') || '';
      const stateName = STATE_ID_TO_NAME[id] || path.getAttribute('aria-label') || id;
      const count = map[stateName] ?? 0;
      (path as SVGPathElement).style.fill = getHeatColor(count, maxCount);
    });
  }, [data, maxCount, svgLoaded]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div
        ref={containerRef}
        className="flex-1 min-h-[300px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-slate-200 relative"
      >
        <div ref={svgRef} className="w-full flex justify-center items-center" />
        {!svgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-400 text-sm">Loading map...</span>
          </div>
        )}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-lg text-sm font-medium text-slate-800 whitespace-nowrap -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedState && !hideDetailPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-800">{selectedState}</h3>
              <button
                onClick={() => setInternalSelected(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                ×
              </button>
            </div>
            <p className="text-2xl font-bold text-[#E8892C]">
              {dataMap[selectedState] ?? 0} members
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Click districts in admin panel for drill-down
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
