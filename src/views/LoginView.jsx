import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { signIn, getCurrentBusiness, requestPasswordReset } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';

export default function LoginView({ onSuccess, onSignup }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ── Forgot password ──────────────────────────────────────────────────────
  const [mode, setMode]                     = useState('login'); // 'login' | 'forgot'
  const [resetEmail, setResetEmail]         = useState('');
  const [resetLoading, setResetLoading]     = useState(false);
  const [resetError, setResetError]         = useState('');
  const [resetSent, setResetSent]           = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  function openForgotPassword() {
    setResetEmail(email.trim());
    setResetError('');
    setResetSent(false);
    setMode('forgot');
  }

  // Shared by the initial send and the "Resend link" retry.
  async function handleSendReset(e) {
    e?.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError('');
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSent(true);
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setResetError(err.message || 'Could not send the reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  // ── Forgot-password screen ───────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8">

          <div className="flex justify-center mb-6">
            <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
              <SabiLogo size="lg" />
            </button>
          </div>

          <h1 className="font-serif text-3xl font-medium text-white text-center mb-1">Reset password</h1>
          <p className="text-sabi-muted text-sm text-center mb-8">
            {resetSent
              ? 'Check your inbox for the link.'
              : "Enter your email and we'll send you a link to reset your password."}
          </p>

          {resetSent ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 bg-sabi-green/10 border border-sabi-green/20 rounded-lg px-4 py-3 text-sabi-green text-sm">
                <CheckCircle size={14} className="flex-shrink-0" />
                Sent to {resetEmail.trim()}. It can take a few minutes to arrive.
              </div>
              <p className="text-center text-sm text-sabi-muted">
                Didn&apos;t get it?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-sabi-border">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    className="text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                    onClick={handleSendReset}
                  >
                    Resend link
                  </button>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendReset} noValidate className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
                  <input
                    className="input-dark pl-9"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    autoComplete="email"
                    autoFocus
                    onChange={e => { setResetEmail(e.target.value); setResetError(''); }}
                  />
                </div>
              </div>

              {resetError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {resetError}
                </div>
              )}

              <button
                className="btn-gold w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={resetLoading || !resetEmail.trim()}
              >
                {resetLoading && <Loader2 size={15} className="lv-spin" />}
                {resetLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-sabi-muted mt-6">
            <button
              className="text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => setMode('login')}
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider">Password</label>
              <button
                type="button"
                className="text-xs text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                onClick={openForgotPassword}
              >
                Forgot password?
              </button>
            </div>
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
