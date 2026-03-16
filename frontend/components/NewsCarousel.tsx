'use client';

import { useState, useEffect } from 'react';
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
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const item = items[index] || items[0];

  return (
    <div className="relative bg-white rounded-xl overflow-hidden border border-[#E8892C]/10 shadow-lg">
      <div className="flex flex-col md:flex-row min-h-[280px]">
        {/* Image */}
        <div className="md:w-1/2 h-48 md:h-auto min-h-[200px] bg-[#F7F4EF] relative">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1B2A]/10 to-[#E8892C]/20">
              <span className="text-[#2C3E50]/50 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="md:w-1/2 p-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display text-lg md:text-xl font-bold text-[#0D1B2A] mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-[#2C3E50]/80 text-sm mb-3 line-clamp-3">{item.excerpt}</p>
              {item.publishedAt && (
                <p className="text-[#E8892C] text-xs font-medium">
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

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'bg-[#E8892C] w-6' : 'bg-[#2C3E50]/30 hover:bg-[#2C3E50]/50 w-2'
              }`}
              aria-label={`Go to news ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
