'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

interface Props {
  /** Path the QR should open, e.g. /register. Origin is resolved at runtime. */
  path?: string;
  size?: number;
}

/**
 * QR code generated dynamically from the current domain, so it always points
 * to the live registration page even if the site moves to a new domain.
 */
export default function RegistrationQRCode({ path = '/register', size = 240 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'iro-registration-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!url) {
    return (
      <div
        className="mx-auto animate-pulse rounded-2xl bg-black/5 dark:bg-muted"
        style={{ width: size + 32, height: size + 32 }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={wrapperRef}
        className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5"
      >
        <QRCodeCanvas
          value={url}
          size={size}
          level="M"
          fgColor="#0D1B2A"
          bgColor="#FFFFFF"
          imageSettings={{
            src: '/images/iro-logo.png',
            height: Math.round(size * 0.16),
            width: Math.round(size * 0.4),
            excavate: true,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground/60 dark:text-muted-foreground/80 break-all text-center max-w-[280px]">{url}</p>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-border px-4 py-2 text-sm font-medium text-primary dark:text-foreground hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
      >
        <Download size={16} />
        Download QR as PNG
      </button>
    </div>
  );
}
