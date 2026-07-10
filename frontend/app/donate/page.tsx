'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const AMOUNTS = [100, 500, 1000, 2500, 5000];

export default function DonatePage() {
  const [amount, setAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedAmount = amount ?? (customAmount ? parseInt(customAmount, 10) : null);
  const isValidAmount = selectedAmount != null && selectedAmount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;
    setSubmitting(true);
    try {
      // Placeholder: payment integration will be added later
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 shadow-lg border border-secondary/10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Thank You!</h2>
            <p className="text-muted-foreground/70 mb-6">
              Your donation intent has been recorded. Our team will reach out shortly to complete the payment process.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark transition-colors"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2 text-center">
            Donate to IRO
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Support the Indian Reformer Organisation and help drive change across India.
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-secondary/10 space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">Select amount (₹)</label>
              <div className="flex flex-wrap gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount('');
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium transition ${
                      amount === a
                        ? 'bg-secondary text-white'
                        : 'bg-background text-muted-foreground hover:bg-secondary/20'
                    }`}
                  >
                    ₹{a}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground/60 mb-1">Or enter custom amount (₹)</label>
                <input
                  type="number"
                  min={10}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount(null);
                  }}
                  placeholder="e.g. 250"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-primary focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-primary focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-primary focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                required
              />
            </div>

            {message && <p className="text-red-600 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={!isValidAmount || submitting}
              className="w-full py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition"
            >
              {submitting ? 'Processing...' : `Donate ₹${selectedAmount ?? 0}`}
            </button>
          </form>

          <p className="mt-6 text-center text-muted-foreground/60 text-sm">
            Payment gateway integration coming soon. Your details will be used to complete the donation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
