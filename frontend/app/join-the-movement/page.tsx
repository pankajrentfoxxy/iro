'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Megaphone,
  MapPinned,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ScanLine,
} from 'lucide-react';
import RegistrationQRCode from '@/components/join/RegistrationQRCode';

const BENEFITS = [
  {
    icon: Users,
    title: 'Be Part of a National Network',
    text: 'Connect with reformers across every state and district of India working for real change.',
  },
  {
    icon: Megaphone,
    title: 'Voice That Gets Heard',
    text: 'Raise local issues and be part of campaigns that push for transparent governance.',
  },
  {
    icon: MapPinned,
    title: 'Strengthen Your District',
    text: 'Join your district team and help build the organisation at the grassroots level.',
  },
  {
    icon: HeartHandshake,
    title: 'Serve Society',
    text: 'Take part in social, educational, and public-welfare initiatives near you.',
  },
  {
    icon: ShieldCheck,
    title: 'Official Member ID',
    text: 'Get a unique IRO Member ID recognising you as a registered reformer.',
  },
  {
    icon: Sparkles,
    title: 'Events & Programmes',
    text: 'Get invited to meetings, training sessions and campaigns before anyone else.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export default function JoinTheMovementPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden bg-card border-b border-border py-16 md:py-24 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 40%, rgba(255,153,51,0.12) 0%, transparent 45%)' }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
         
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4"
          >
            Join the Movement
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-secondary font-semibold tracking-[0.2em] uppercase text-sm md:text-base mb-6"
          >
            Reforming Society, Empowering People
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10"
          >
            The Indian Reformers Organisation is a citizen-led movement working for transparent
            governance, accountability, and systemic reform. Registration takes less than two
            minutes — join thousands of reformers building a stronger India.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link href="/register" className="iro-btn-primary px-8 py-4">
              Register Now
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary dark:text-foreground mb-2">
              Why Become a Member?
            </h2>
            <div className="h-1 w-20 bg-secondary rounded-full mx-auto" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="rounded-card-lg bg-card border border-border shadow-card-md p-6 hover:-translate-y-1 hover:shadow-card-lg transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/15 flex items-center justify-center mb-4">
                  <b.icon size={22} className="text-secondary" />
                </div>
                <h3 className="font-semibold text-primary dark:text-foreground mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">{b.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QR + Register ── */}
      <section className="pb-16 md:pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-card-lg bg-card border border-border shadow-card-lg p-8 md:p-12 text-center"
          >
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #E8892C 0%, transparent 55%)' }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 mb-6">
                <ScanLine size={14} className="text-secondary" />
                Scan to Register
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary dark:text-foreground mb-3">
                Register from Your Phone
              </h2>
              <p className="text-muted-foreground dark:text-muted-foreground max-w-md mx-auto mb-8">
                Point your phone camera at the QR code and the registration form opens
                instantly — or tap the button below to register right here.
              </p>

              <RegistrationQRCode path="/register" size={240} />

              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-secondary text-white text-lg font-semibold rounded-xl hover:bg-secondary-dark transition-colors shadow-lg shadow-secondary/25"
                >
                  Register Now
                  <ArrowRight size={20} />
                </Link>
                <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground/70 mt-4">
                  Free to join • Takes under 2 minutes • Open to all citizens
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
