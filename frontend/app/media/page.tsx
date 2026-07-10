'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface VideoItem {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
  } catch {
    return null;
  }
  return null;
}

function MediaTabContent({ activeTab }: { activeTab: 'gallery' | 'videos' }) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/public/media/gallery').then((r) => r.json()),
      fetch('/api/public/media/videos').then((r) => r.json()),
    ])
      .then(([g, v]) => {
        setGalleryItems(g.items || []);
        setVideoItems(v.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <span className="text-muted-foreground/60 animate-pulse">Loading...</span>
      </div>
    );
  }

  if (activeTab === 'gallery') {
    return (
      <motion.div
        key="gallery"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {galleryItems.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl overflow-hidden border border-secondary/10 aspect-square flex items-center justify-center text-muted-foreground/80 shadow min-h-[200px]">
            <span className="text-sm">No photos yet. Check back soon.</span>
          </div>
        ) : (
          galleryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden border border-secondary/10 shadow group"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-primary text-sm truncate">{item.title}</h3>
                {item.caption && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{item.caption}</p>
                )}
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      key="videos"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {videoItems.length === 0 ? (
        <div className="col-span-full bg-white rounded-xl overflow-hidden border border-secondary/10 aspect-video flex items-center justify-center text-muted-foreground/80 shadow min-h-[200px]">
          <span className="text-sm">No videos yet. Check back soon.</span>
        </div>
      ) : (
        videoItems.map((item) => {
          const embedUrl = item.videoUrl ? getYouTubeEmbedUrl(item.videoUrl) : null;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden border border-secondary/10 shadow"
            >
              <div className="aspect-video bg-primary">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={item.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
                    Invalid video URL
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-primary">{item.title}</h3>
                {item.caption && (
                  <p className="text-sm text-muted-foreground/70 mt-1">{item.caption}</p>
                )}
                <p className="text-xs text-muted-foreground/80 mt-2">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}

const TABS = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'videos', label: 'Videos' },
] as const;

function MediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'gallery' | 'videos'>(
    tabParam === 'videos' ? 'videos' : 'gallery'
  );

  useEffect(() => {
    if (tabParam === 'videos' || tabParam === 'gallery') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabClick = (tab: 'gallery' | 'videos') => {
    setActiveTab(tab);
    router.replace(`/media?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
            Media
          </h1>
          <p className="text-muted-foreground">
            Photos and videos from IRO events and activities
          </p>
        </motion.section>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 p-1 bg-white rounded-xl shadow border border-secondary/10 mb-6 w-fit"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-secondary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <MediaTabContent key={activeTab} activeTab={activeTab} />
        </AnimatePresence>

        <p className="mt-12 text-center">
          <Link href="/" className="text-secondary hover:text-secondary-dark font-medium text-sm">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <MediaContent />
    </Suspense>
  );
}
