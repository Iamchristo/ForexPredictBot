'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
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
          <h1 className="text-2xl font-bold text-slate-100">Welcome Back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your trading account</p>
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
                  placeholder="Password"
                  autoComplete="current-password"
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

            <ShimmerButton type="submit" disabled={loading} className="w-full justify-center" size="lg">
              {loading ? 'Signing in...' : 'Sign In'}
            </ShimmerButton>
          </form>

          <div className="text-center text-sm text-muted">
            New here?{' '}
            <Link href="/register" className="text-gold hover:text-gold-light transition-colors font-medium">
              Create account
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 bg-surface/50 border border-border rounded-xl"
        >
          <p className="text-xs text-muted font-medium mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs font-mono">
            <p className="text-slate-300">admin@forexpredictbot.com</p>
            <p className="text-slate-300">Admin@2024!</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
