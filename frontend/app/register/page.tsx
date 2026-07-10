'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, ArrowRight, BadgeCheck } from 'lucide-react';

const registrationSchema = z.object({
  firstName: z.string().trim().max(80).optional().or(z.literal('')),
  lastName: z.string().trim().max(80).optional().or(z.literal('')),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Mobile number must be exactly 10 digits'),
  age: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  reason: z.string().trim().max(1000).optional().or(z.literal('')),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const inputClass = 'iro-input';
const labelClass = 'iro-label';

function displayName(data: { firstName?: string; lastName?: string }) {
  return [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{message}</p>;
}

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationForm) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      const name =
        body.fullName ||
        displayName({ firstName: body.firstName, lastName: body.lastName }) ||
        displayName(data);
      if (res.status === 409 && body.memberId) {
        setMemberId(body.memberId);
        setMemberName(name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!res.ok) {
        const msg =
          body.error ||
          (body.details?.fieldErrors
            ? Object.values(body.details.fieldErrors as Record<string, string[]>)
                .flat()
                .filter(Boolean)
                .join(', ')
            : '') ||
          (res.status === 500
            ? 'Server unavailable. Please ensure the backend is running and try again.'
            : 'Something went wrong, please try again.');
        throw new Error(msg);
      }
      setMemberId(body.memberId);
      setMemberName(name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background py-10 md:py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {memberId ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="rounded-3xl bg-white/85 dark:bg-muted backdrop-blur-xl border border-white/60 dark:border-border shadow-glass p-8 md:p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
                className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="font-display text-2xl md:text-3xl font-bold text-primary dark:text-foreground mb-3">
                  Welcome aboard{memberName ? `, ${memberName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-muted-foreground dark:text-foreground/70 max-w-md mx-auto mb-8">
                  Thank you for joining the Indian Reformer Organisation. Together, we can build a
                  stronger and better India.
                </p>
                <div className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 mb-8">
                  <BadgeCheck size={22} className="text-secondary" />
                  <div className="text-left">
                    <p className="text-white/60 text-xs uppercase tracking-wider">Your Member ID</p>
                    <p className="text-white font-bold text-lg tracking-wide">{memberId}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground/70 mb-8">
                  Please save your Member ID. A confirmation via SMS / WhatsApp will be sent once
                  messaging is enabled.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/"
                    className="px-6 py-3 bg-secondary text-white rounded-xl font-semibold hover:bg-secondary-dark transition-colors"
                  >
                    Go to Home
                  </Link>
                  <Link
                    href="/campaigns"
                    className="px-6 py-3 border border-border dark:border-border text-primary dark:text-foreground rounded-xl font-medium hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                  >
                    Explore Campaigns
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-primary dark:text-foreground mb-2">
                  Member Registration
                </h1>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Fill in your details to become a registered reformer.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="rounded-3xl bg-white/85 dark:bg-muted backdrop-blur-xl border border-white/60 dark:border-border shadow-glass p-6 md:p-10 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="e.g. Rahul"
                      className={inputClass}
                      {...register('firstName')}
                    />
                    <FieldError message={errors.firstName?.message} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="e.g. Sharma"
                      className={inputClass}
                      {...register('lastName')}
                    />
                    <FieldError message={errors.lastName?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="mobile" className={labelClass}>
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className={inputClass}
                      {...register('mobile')}
                    />
                    <FieldError message={errors.mobile?.message} />
                  </div>
                  <div>
                    <label htmlFor="age" className={labelClass}>
                      Age
                    </label>
                    <input
                      id="age"
                      type="text"
                      inputMode="numeric"
                      placeholder="Your age"
                      className={inputClass}
                      {...register('age')}
                    />
                    <FieldError message={errors.age?.message} />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className={labelClass}>
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    placeholder="House / street / village / town"
                    className={`${inputClass} resize-none`}
                    {...register('address')}
                  />
                  <FieldError message={errors.address?.message} />
                </div>

                <div>
                  <label htmlFor="reason" className={labelClass}>
                    Why do you want to join?
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    placeholder="Tell us in a few words what motivates you..."
                    className={`${inputClass} resize-none`}
                    {...register('reason')}
                  />
                  <FieldError message={errors.reason?.message} />
                </div>

                {serverError && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-4 text-white font-semibold hover:bg-secondary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-secondary/25"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Join the Movement
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground/80 dark:text-muted-foreground/70">
                  By registering you agree to be contacted by IRO about the movement.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
