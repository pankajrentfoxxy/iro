'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  className = '',
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(
    value.split('').concat(Array(length - value.length).fill(''))
  );

  useEffect(() => {
    const arr = value.split('');
    setDigits(arr.concat(Array(length - arr.length).fill('')).slice(0, length));
  }, [value, length]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      const num = char.replace(/\D/g, '');
      if (num.length > 1) {
        // Paste
        const pasted = num.slice(0, length).split('');
        const newDigits = Array(length).fill('');
        pasted.forEach((p, i) => {
          if (i < length) newDigits[i] = p;
        });
        setDigits(newDigits);
        onChange(newDigits.join(''));
        const nextIdx = Math.min(pasted.length, length) - 1;
        inputRefs.current[nextIdx]?.focus();
        return;
      }
      setDigits((prev) => {
        const next = [...prev];
        next[index] = num;
        onChange(next.join(''));
        return next;
      });
      if (num && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [length, onChange]
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      onChange(newDigits.join(''));
    }
  };

  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={`w-11 h-12 text-center text-lg font-bold rounded-lg border-2 bg-white transition outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
              : 'border-[#2C3E50]/20 focus:border-[#E8892C] focus:ring-[#E8892C]/30'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
