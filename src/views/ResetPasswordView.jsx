import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { updatePassword, requestPasswordReset, getCurrentBusiness } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';

/**
 * Reached only two ways, both decided in App.jsx:
 *
 *  - Valid recovery link: Supabase's client auto-detects the recovery
 *    token in the URL hash on load (detectSessionInUrl, on by default),
 *    exchanges it for a session, and fires a PASSWORD_RECOVERY auth event.
 *    App.jsx listens for that and renders this with expiredMessage unset —
 *    show the new-password form.
 *
 *  - Expired or already-used link: Supabase instead redirects with
 *    #error=...&error_description=... in the hash. Supabase's client sees
 *    that too, but only debug-logs it internally — no event is emitted,
 *    the hash is left untouched (verified against @supabase/auth-js
 *    2.106.2's _getSessionFromURL). App.jsx has to detect this itself and
 *    passes the decoded description down as expiredMessage — offer a
 *    fresh link instead of failing silently.
 */
export default function ResetPasswordView({ expiredMessage, onSuccess, onBackToLogin }) {
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [done, setDone]                       = useState(false);

  // ── Request a new link (expired/used-link branch only) ──────────────────
  const [resetEmail, setResetEmail]         = useState('');
  const [resetLoading, setResetLoading]     = useState(false);
  const [resetError, setResetError]         = useState('');
  const [resetSent, setResetSent]           = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await updatePassword(password);
      const business = await getCurrentBusiness();
      setDone(true);
      setTimeout(() => onSuccess(business), 1200);
    } catch (err) {
      setError(err.message || 'Could not update your password. Please request a new link and try again.');
    } finally {
      setLoading(false);
    }
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

  // ── Expired / already-used link ──────────────────────────────────────────
  if (expiredMessage) {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8">

          <div className="flex justify-center mb-6">
            <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
              <SabiLogo size="lg" />
            </button>
          </div>

          <h1 className="font-serif text-3xl font-medium text-white text-center mb-1">Link expired</h1>
          <p className="text-sabi-muted text-sm text-center mb-8">{expiredMessage}</p>

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
                {resetLoading ? 'Sending…' : 'Send new link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-sabi-muted mt-6">
            <button
              className="text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              onClick={onBackToLogin}
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Valid recovery session — set a new password ──────────────────────────
  return (
    <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8">

        <div className="flex justify-center mb-6">
          <SabiLogo size="lg" />
        </div>

        <h1 className="font-serif text-3xl font-medium text-white text-center mb-1">Set a new password</h1>
        <p className="text-sabi-muted text-sm text-center mb-8">Choose a new password for your account</p>

        {done ? (
          <div className="flex items-center gap-2 bg-sabi-green/10 border border-sabi-green/20 rounded-lg px-4 py-3 text-sabi-green text-sm">
            <CheckCircle size={14} className="flex-shrink-0" />
            Password updated. Taking you to your dashboard…
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">New password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
                <input
                  className="input-dark pl-9"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  autoComplete="new-password"
                  autoFocus
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
                <input
                  className="input-dark pl-9"
                  type="password"
                  placeholder="Retype your new password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
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
              disabled={loading || !password || !confirmPassword}
            >
              {loading && <Loader2 size={15} className="lv-spin" />}
              {loading ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
