'use client';

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
  const stroke = variant === 'dark' ? '#E8892C' : '#0D1B2A';
  const textFill = variant === 'dark' ? '#FFFFFF' : '#0D1B2A';
  const c = size / 2;
  const r1 = size * 0.457;
  const r2 = size * 0.293;
  const dot = size * 0.076;
  const spokeOut = size * 0.207;
  const diagOut = c - r1 * Math.cos(Math.PI / 4);
  const diagIn  = c - r2 * Math.cos(Math.PI / 4);
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
      {/* Outer ring */}
      <circle cx={c} cy={c} r={r1} stroke={stroke} strokeWidth="2" />
      {/* Inner ring */}
      <circle cx={c} cy={c} r={r2} stroke={stroke} strokeWidth="1.2" strokeOpacity="0.45" />
      {/* Centre dot */}
      <circle cx={c} cy={c} r={dot} fill={stroke} />

      {/* Cardinal spokes — outer segment */}
      <line x1={c}       y1={size * 0.043} x2={c}       y2={spokeOut}        stroke={stroke} strokeWidth="2"   strokeLinecap="round" />
      <line x1={c}       y1={size - spokeOut} x2={c}    y2={size * 0.957}    stroke={stroke} strokeWidth="2"   strokeLinecap="round" />
      <line x1={size * 0.043} y1={c}         x2={spokeOut}    y2={c}          stroke={stroke} strokeWidth="2"   strokeLinecap="round" />
      <line x1={size - spokeOut} y1={c}      x2={size * 0.957} y2={c}         stroke={stroke} strokeWidth="2"   strokeLinecap="round" />

      {/* Cardinal spokes — inner segment */}
      <line x1={c}       y1={spokeOut}          x2={c}        y2={size * 0.348}   stroke={stroke} strokeWidth="1"   strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={c}       y1={size - size * 0.348} x2={c}      y2={size - spokeOut} stroke={stroke} strokeWidth="1"   strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={spokeOut}      y1={c}            x2={size * 0.348}  y2={c}         stroke={stroke} strokeWidth="1"   strokeLinecap="round" strokeOpacity="0.35" />
      <line x1={size - size * 0.348} y1={c}      x2={size - spokeOut} y2={c}       stroke={stroke} strokeWidth="1"   strokeLinecap="round" strokeOpacity="0.35" />

      {/* Diagonal spokes */}
      <line x1={diagOut}         y1={diagOut}         x2={diagIn}         y2={diagIn}         stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={size - diagOut}  y1={size - diagOut}  x2={size - diagIn}  y2={size - diagIn}  stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={size - diagOut}  y1={diagOut}         x2={size - diagIn}  y2={diagIn}         stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1={diagOut}         y1={size - diagOut}  x2={diagIn}         y2={size - diagIn}  stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

      {/* IRO text */}
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
  const nameColor  = variant === 'dark' ? '#FFFFFF' : '#0D1B2A';

  if (!showText) {
    return <IROEmblem size={size} variant={variant} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <IROEmblem size={size} variant={variant} />
      <div>
        <p
          style={{
            color: nameColor,
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: `${Math.round(size * 0.35)}px`,
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Indian Reformer Organisation
        </p>
        <p
          style={{
            color: '#E8892C',
            fontSize: `${Math.round(size * 0.196)}px`,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: '3px',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          Reforming India, Together
        </p>
      </div>
    </div>
  );
}
