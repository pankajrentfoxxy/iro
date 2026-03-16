'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import IROLogo from '@/components/ui/IROLogo';
import OTPInput from '@/components/ui/OTPInput';

type Step = 1 | 2 | 3;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.trim());
  }, [searchParams]);

  const inputClass =
    'w-full px-3 py-2.5 text-sm rounded-lg border border-[#2C3E50]/20 bg-white text-[#0D1B2A] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#E8892C]/30 focus:border-[#E8892C] transition';
  const labelClass = 'block text-xs font-medium text-[#2C3E50] mb-1.5';

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '').slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    setStep(3);
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '').slice(-10),
          otp,
          name: name.trim(),
          email: email.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
        }),
      });
      const text = await res.text();
      let data: { error?: string; token?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Registration failed (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('token', data.token!);
      router.push('/onboarding/location');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0D1B2A] flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#E8892C]" />
        <Link href="/">
          <IROLogo variant="dark" size={42} showText={false} />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">
            Indian Reformer Organisation
          </h2>
          <p className="text-[#E8892C] text-sm leading-relaxed max-w-xs font-medium">
            Reforming India, Together.
          </p>
        </div>
        <p className="text-white/40 text-xs">© Indian Reformer Organisation</p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F4EF] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm py-6"
        >
          <div className="lg:hidden mb-6">
            <Link href="/">
              <IROLogo variant="light" size={36} showText={false} />
            </Link>
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  step >= s ? 'bg-[#E8892C]' : 'bg-[#2C3E50]/20'
                }`}
              />
            ))}
          </div>

          <h1 className="font-display text-xl font-semibold text-[#0D1B2A] mb-1">Create account</h1>
          <p className="text-[#2C3E50]/70 text-sm mb-6">
            {step === 1 && 'Enter your phone number'}
            {step === 2 && 'Enter the OTP sent to your phone'}
            {step === 3 && 'Complete your profile'}
          </p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRequestOTP}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className={inputClass}
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-2.5 bg-[#E8892C] text-white text-sm font-semibold rounded-lg hover:bg-[#B8692A] disabled:opacity-50 transition"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyAndContinue}
                className="space-y-4"
              >
                <p className="text-[#2C3E50] text-xs">
                  OTP sent to ****{phone.slice(-4)}
                </p>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={loading}
                  error={!!error}
                />
                {error && <p className="text-red-600 text-xs text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-2.5 bg-[#E8892C] text-white text-sm font-semibold rounded-lg hover:bg-[#B8692A] disabled:opacity-50 transition"
                >
                  Verify & Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className="w-full py-1.5 text-[#2C3E50]/60 hover:text-[#0D1B2A] text-xs"
                >
                  Change number
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleCompleteSignup}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>Full name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Referral code (optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="From a friend"
                    className={inputClass}
                  />
                </div>
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full py-2.5 bg-[#E8892C] text-white text-sm font-semibold rounded-lg hover:bg-[#B8692A] disabled:opacity-50 transition"
                >
                  {loading ? 'Creating account...' : 'Complete Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-1.5 text-[#2C3E50]/60 hover:text-[#0D1B2A] text-xs"
                >
                  ← Back to OTP
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-[#2C3E50] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#E8892C] hover:text-[#B8692A]">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
          <div className="animate-pulse text-[#2C3E50]">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
