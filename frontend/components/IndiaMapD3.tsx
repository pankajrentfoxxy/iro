'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';

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

export default function IndiaMapD3({
  data,
  onStateClick,
  hideDetailPanel,
  selectedState: externalSelected,
  memberLabel = 'members',
}: Props) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
        if (cancelled || !containerRef.current || !svgRef.current) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'image/svg+xml');
        const sourceSvg = doc.querySelector('svg');
        if (!sourceSvg) return;

        const viewBox = sourceSvg.getAttribute('viewBox') || '0 0 612 696';
        svgRef.current.setAttribute('viewBox', viewBox);
        svgRef.current.setAttribute('aria-label', 'Map of India');

        const zoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        zoomGroup.setAttribute('class', 'zoom-group');
        const paths = sourceSvg.querySelectorAll('path[id]');
        paths.forEach((path) => {
          const clone = path.cloneNode(true) as SVGPathElement;
          zoomGroup.appendChild(clone);
        });
        svgRef.current.appendChild(zoomGroup);

        const svg = d3.select(svgRef.current);
        const zoomGroupSel = svg.select('.zoom-group');

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.5, 4])
          .on('zoom', (event) => {
            zoomGroupSel.attr('transform', event.transform.toString());
          });

        svg.call(zoom);

        zoomGroupSel.selectAll('path').each(function () {
          const path = this as SVGPathElement;
          const id = path.getAttribute('id') || '';
          const stateName = STATE_ID_TO_NAME[id] || path.getAttribute('aria-label') || id;
          path.style.transition = 'fill 0.2s, filter 0.2s';
          path.setAttribute('role', 'button');
          path.setAttribute('tabIndex', '0');
          path.style.cursor = 'pointer';

          path.addEventListener('mouseenter', function (e) {
            const count = dataMapRef.current[stateName] ?? 0;
            path.style.filter = 'brightness(1.1)';
            const rect = path.getBoundingClientRect();
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
            path.style.filter = 'none';
            setTooltip(null);
          });
          path.addEventListener('click', () => handleStateClick(stateName));
        });

        setSvgLoaded(true);
      })
      .catch(() => !cancelled && setSvgLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [memberLabel]);

  useEffect(() => {
    if (!svgRef.current || !svgLoaded) return;
    const paths = svgRef.current.querySelectorAll('.zoom-group path[id]');
    paths.forEach((path) => {
      const id = path.getAttribute('id') || '';
      const stateName = STATE_ID_TO_NAME[id] || path.getAttribute('aria-label') || id;
      const count = dataMapRef.current[stateName] ?? 0;
      (path as SVGPathElement).style.fill = getHeatColor(count, maxCount);
    });
  }, [data, maxCount, svgLoaded]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div
        ref={containerRef}
        className="flex-1 min-h-[400px] bg-[#F7F4EF] rounded-xl overflow-hidden flex items-center justify-center border border-[#E8892C]/10 relative"
      >
        <svg
          ref={svgRef}
          className="w-full h-full min-h-[350px] touch-none"
          style={{ maxWidth: '100%' }}
        />
        {!svgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F4EF]">
            <span className="text-[#2C3E50] text-sm">Loading map...</span>
          </div>
        )}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-3 py-1.5 bg-white/95 backdrop-blur border border-[#E8892C]/20 rounded-lg shadow-lg text-sm font-medium text-[#0D1B2A] whitespace-nowrap -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[#2C3E50]/60 text-xs">
          Scroll to zoom • Drag to pan
        </div>
      </div>
      <AnimatePresence>
        {selectedState && !hideDetailPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:w-80 bg-white rounded-xl p-4 border border-[#E8892C]/10 shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-[#0D1B2A]">{selectedState}</h3>
              <button
                onClick={() => setInternalSelected(null)}
                className="text-[#2C3E50] hover:text-[#E8892C]"
              >
                ×
              </button>
            </div>
            <p className="text-2xl font-bold text-[#E8892C]">
              {dataMap[selectedState] ?? 0} {memberLabel}
            </p>
            <p className="text-sm text-[#2C3E50]/70 mt-1">
              Click districts in admin panel for drill-down
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
