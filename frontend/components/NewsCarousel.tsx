'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsItem {
  id?: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt?: string;
}

interface Props {
  items: NewsItem[];
}

export default function NewsCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  const item = items[index] || items[0];
  if (!item) return null;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-secondary/10 shadow-lg">
      <div className="flex flex-col md:flex-row min-h-[320px] md:min-h-[360px]">
        {/* Image panel */}
        <div className="md:w-1/2 relative bg-background min-h-[220px] md:min-h-0">
          {item.imageUrl ? (
            <div className="relative w-full h-full min-h-[220px] md:min-h-[360px]">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-contain p-2 md:p-3"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
              <span className="text-muted-foreground/80 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Content panel */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center pb-12 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id ?? index}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display text-lg md:text-xl font-bold text-primary mb-3 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-5">{item.excerpt}</p>
              {item.publishedAt && (
                <p className="text-secondary text-xs font-semibold uppercase tracking-wide">
                  {new Date(item.publishedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((slide, i) => (
            <button
              key={slide.id ?? i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'bg-secondary w-7' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
              }`}
              aria-label={`Go to update ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
