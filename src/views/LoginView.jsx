import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signIn, getCurrentBusiness } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';

export default function LoginView({ onSuccess, onSignup }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      const business = await getCurrentBusiness();
      onSuccess(business);
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8">

        <div className="flex justify-center mb-6">
          <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
            <SabiLogo size="lg" />
          </button>
        </div>

        <h1 className="font-serif text-3xl font-medium text-white text-center mb-1">Welcome back</h1>
        <p className="text-sabi-muted text-sm text-center mb-8">Sign in to your dashboard</p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
              <input
                className="input-dark pl-9"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                autoFocus
                onChange={e => { setEmail(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
              <input
                className="input-dark pl-9"
                type="password"
                placeholder="Your password"
                value={password}
                autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            className="btn-gold w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading || !email || !password}
          >
            {loading && <Loader2 size={15} className="lv-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-sabi-muted mt-6">
          Don&apos;t have an account?{' '}
          <button className="text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer" onClick={onSignup}>
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
