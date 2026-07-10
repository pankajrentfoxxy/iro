'use client';

import Image from 'next/image';

interface IROLogoProps {
  variant?: 'dark' | 'light';
  showText?: boolean;
  size?: number;
  className?: string;
}

function IROEmblem({
  size = 46,
  variant = 'dark',
}: {
  size?: number;
  variant?: 'dark' | 'light';
}) {
  const stroke = variant === 'dark' ? '#FF9933' : '#0B3C6F';
  const textFill = variant === 'dark' ? '#FFFFFF' : '#0B3C6F';
  const c = size / 2;
  const r1 = size * 0.457;
  const r2 = size * 0.293;
  const dot = size * 0.076;
  const spokeOut = size * 0.207;
  const diagOut = c - r1 * Math.cos(Math.PI / 4);
  const diagIn = c - r2 * Math.cos(Math.PI / 4);
  const fontSize = size * 0.174;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx={c} cy={c} r={r1} stroke={stroke} strokeWidth="2" />
      <circle cx={c} cy={c} r={r2} stroke={stroke} strokeWidth="1.2" strokeOpacity="0.45" />
      <circle cx={c} cy={c} r={dot} fill={stroke} />
      <line x1={c} y1={size * 0.043} x2={c} y2={spokeOut} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1={c} y1={size - spokeOut} x2={c} y2={size * 0.957} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1={size * 0.043} y1={c} x2={spokeOut} y2={c} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1={size - spokeOut} y1={c} x2={size * 0.957} y2={c} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1={c} y1={spokeOut} x2={c} y2={size * 0.348} stroke={stroke} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={c} y1={size - size * 0.348} x2={c} y2={size - spokeOut} stroke={stroke} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={spokeOut} y1={c} x2={size * 0.348} y2={c} stroke={stroke} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={size - size * 0.348} y1={c} x2={size - spokeOut} y2={c} stroke={stroke} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={diagOut} y1={diagOut} x2={diagIn} y2={diagIn} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={size - diagOut} y1={size - diagOut} x2={size - diagIn} y2={size - diagIn} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={size - diagOut} y1={diagOut} x2={size - diagIn} y2={diagIn} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={diagOut} y1={size - diagOut} x2={diagIn} y2={size - diagIn} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <text
        x={c}
        y={c + dot + fontSize * 0.4}
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize={fontSize}
        fontWeight="700"
        fill={textFill}
        letterSpacing="1.5"
      >
        IRO
      </text>
    </svg>
  );
}

export { IROEmblem };

export default function IROLogo({
  variant = 'dark',
  showText = true,
  size = 46,
  className = '',
}: IROLogoProps) {
  if (showText) {
    const height = size;
    const onDarkBg = variant === 'dark';

    return (
      <div
        className={`inline-flex items-center shrink-0 ${
          onDarkBg
            ? 'bg-white rounded-lg px-2.5 py-1 shadow-sm ring-1 ring-black/5 dark:bg-transparent dark:shadow-none dark:ring-0 dark:px-0 dark:py-0'
            : ''
        } ${className}`}
      >
        <Image
          src="/images/iro-logo.png"
          alt="Indian Reformers Organisation — Reforming Society, Empowering People"
          width={Math.round(height * 2.6)}
          height={height}
          className="w-auto object-contain transition-[filter] duration-200 dark:brightness-0 dark:invert"
          style={{ height: `${height}px`, width: 'auto' }}
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex shrink-0 ${
        variant === 'light' ? 'dark:brightness-0 dark:invert' : ''
      } ${className}`}
    >
      <IROEmblem size={size} variant={variant} />
    </div>
  );
}
