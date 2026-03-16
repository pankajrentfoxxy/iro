'use client';

import Link from 'next/link';

interface LogoProps {
  variant?: 'nav' | 'hero' | 'compact' | 'compactLight';
  href?: string;
}

export default function Logo({ variant = 'nav', href = '/' }: LogoProps) {
  const isLight = variant === 'compactLight';
  const content = (
    <>
      <span className={`font-bold tracking-tight ${isLight ? 'text-primary' : 'text-white'}`}>IRO</span>
      {variant === 'nav' && (
        <span className="text-[10px] text-neutral-400 -mt-0.5 block leading-tight">
          Indian Reform Organisation
        </span>
      )}
      {variant === 'hero' && (
        <span className="text-slate-500 text-lg block mt-1">
          Reforming India, Together
        </span>
      )}
    </>
  );

  const className =
    variant === 'nav'
      ? 'flex flex-col items-start'
      : variant === 'hero'
        ? 'block'
        : '';

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
