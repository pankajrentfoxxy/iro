'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'vision', title: 'Vision & Mission' },
  { id: 'faq', title: 'FAQ' },
  { id: 'timeline', title: 'Our Timeline' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#0D1B2A] mb-2">
            Know Us
          </h1>
          <p className="text-[#E8892C] text-lg font-semibold tracking-wide">
            Indian Reformer Organisation — Reforming India, Together
          </p>
        </motion.section>

        {/* Quick nav */}
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 flex flex-wrap gap-3"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-4 py-2 rounded-lg bg-white border border-[#E8892C]/20 text-[#2C3E50] text-sm font-medium hover:bg-[#E8892C]/10 hover:border-[#E8892C]/40 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </motion.nav>

        {/* Vision & Mission */}
        <motion.section
          id="vision"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="font-display text-2xl font-bold text-[#0D1B2A] mb-4">Vision & Mission</h2>
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-[#E8892C]/10">
            <p className="text-[#2C3E50] leading-relaxed mb-4">
              For the welfare of India and its citizens, the Indian Reform Organisation stands as a
              self-confident, transparent movement for civic engagement and reform. Our vision is to
              carry the nation forward through collective action and citizen participation.
            </p>
            <p className="text-[#2C3E50] leading-relaxed">
              Our mission is to build scalable systems for citizen engagement, reform, and
              organisational growth across every state and district of India.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          id="faq"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-display text-2xl font-bold text-[#0D1B2A] mb-4">FAQ</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 md:p-6 shadow border border-[#E8892C]/10">
              <h3 className="font-semibold text-[#0D1B2A] mb-2">What is IRO?</h3>
              <p className="text-[#2C3E50] text-sm leading-relaxed">
                Indian Reform Organisation (IRO) is a platform for citizen engagement and reform
                across India. We connect reformers, track membership, and drive grassroots change.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 md:p-6 shadow border border-[#E8892C]/10">
              <h3 className="font-semibold text-[#0D1B2A] mb-2">How do I join?</h3>
              <p className="text-[#2C3E50] text-sm leading-relaxed">
                Click{' '}
                <Link href="/join-the-movement" className="text-[#E8892C] hover:text-[#B8692A] font-medium">
                  Join the Movement
                </Link>{' '}
                to sign up. You can register with your phone number and complete your profile with
                location details.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 md:p-6 shadow border border-[#E8892C]/10">
              <h3 className="font-semibold text-[#0D1B2A] mb-2">How does referral work?</h3>
              <p className="text-[#2C3E50] text-sm leading-relaxed">
                Every member gets a unique referral code. Share your code or link with friends. When
                they join, you both benefit from the growing network.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          id="timeline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="font-display text-2xl font-bold text-[#0D1B2A] mb-4">Our Timeline</h2>
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-[#E8892C]/10">
            <p className="text-[#2C3E50] leading-relaxed mb-6">
              IRO is building the future of citizen-led reform in India. Our journey continues
              with every new reformer who joins the movement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#E8892C] text-white font-semibold rounded-lg hover:bg-[#B8692A] transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href="/join-the-movement"
                className="px-5 py-2.5 bg-[#0D1B2A] text-white font-semibold rounded-lg hover:bg-[#1a2d42] transition-colors"
              >
                Join the Movement
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
