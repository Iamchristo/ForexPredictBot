'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await registerUser(data.name, data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 relative">
      <BackgroundBeams />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="text-muted text-sm mt-1">Start trading smarter today &mdash; it&apos;s free</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  className="input-field pl-9"
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  className="input-field pl-9"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Password (min 8 chars)"
                  autoComplete="new-password"
                  className="input-field pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-300"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                <input
                  {...register('confirmPassword')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="input-field pl-9"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <ShimmerButton type="submit" disabled={loading} className="w-full justify-center" size="lg">
              {loading ? 'Creating Account...' : 'Create Account'}
            </ShimmerButton>
          </form>

          <p className="text-xs text-muted text-center leading-relaxed">
            By creating an account, you agree to our Terms of Service.
            Trading involves risk of loss.
          </p>

          <div className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
