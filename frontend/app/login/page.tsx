'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import IROLogo from '@/components/ui/IROLogo';
import OTPInput from '@/components/ui/OTPInput';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '').slice(-10),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      const isAdmin = ['NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'TEHSIL_ADMIN', 'BOOTH_COORDINATOR'].includes(data.user?.role);
      router.push(isAdmin ? '/iro-admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, '').slice(-10),
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      localStorage.setItem('token', data.token);
      const isAdmin = ['NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'TEHSIL_ADMIN', 'BOOTH_COORDINATOR'].includes(data.user?.role);
      router.push(isAdmin ? '/iro-admin' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'iro-input text-sm py-2.5';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[42%] bg-card border-r border-border flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
        <Link href="/">
          <IROLogo variant="light" size={42} showText={false} />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-2 text-primary">
            Indian Reformer Organisation
          </h2>
          <p className="text-secondary text-sm leading-relaxed max-w-xs font-medium">
            Reforming India, Together.
          </p>
        </div>
        <p className="text-muted-foreground/70 text-xs">© Indian Reformer Organisation</p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
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

          <h1 className="font-display text-xl font-semibold text-primary mb-1">Sign in</h1>
          <p className="text-muted-foreground/70 text-sm mb-6">Access your account</p>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-lg border border-secondary/10 mb-5">
            <button
              type="button"
              onClick={() => { setMode('password'); setOtpSent(false); setOtp(''); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                mode === 'password' ? 'bg-secondary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setOtpSent(false); setOtp(''); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                mode === 'otp' ? 'bg-secondary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              OTP
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'password' ? (
              <motion.form
                key="password"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handlePasswordLogin}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || phone.length !== 10 || !password}
                  className="w-full py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <div>
                      <label className={labelClass}>Phone</label>
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
                      className="w-full py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition"
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <p className="text-muted-foreground text-xs">OTP sent to ****{phone.slice(-4)}</p>
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
                      className="w-full py-2.5 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary-dark disabled:opacity-50 transition"
                    >
                      {loading ? 'Verifying...' : 'Verify & sign in'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtp(''); setOtpSent(false); setError(''); }}
                      className="w-full py-1.5 text-muted-foreground/60 hover:text-primary text-xs"
                    >
                      Change number
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            No account?{' '}
            <Link href="/signup" className="font-medium text-secondary hover:text-secondary-dark">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
