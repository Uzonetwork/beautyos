import { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signIn, getCurrentBusiness } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';
import './LoginView.css';

export default function LoginView({ onSuccess, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="lv-root">
      <div className="lv-card">
        <div className="lv-brand"><SabiLogo size="lg" dark={false} /></div>
        <h1 className="lv-title">Welcome back</h1>
        <p className="lv-sub">Sign in to your dashboard</p>

        <form className="lv-form" onSubmit={handleSubmit} noValidate>
          <div className="lv-field">
            <label className="lv-label">Email</label>
            <div className="lv-input-wrap">
              <Mail size={15} className="lv-input-icon" />
              <input
                className="lv-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                autoFocus
                onChange={e => { setEmail(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div className="lv-field">
            <label className="lv-label">Password</label>
            <div className="lv-input-wrap">
              <Lock size={15} className="lv-input-icon" />
              <input
                className="lv-input"
                type="password"
                placeholder="Your password"
                value={password}
                autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {error && (
            <div className="lv-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button className="lv-btn" type="submit" disabled={loading || !email || !password}>
            {loading && <Loader2 size={15} className="lv-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="lv-footer-text">
          Don&apos;t have an account?{' '}
          <button className="lv-link" onClick={onSignup}>Sign up free</button>
        </p>
      </div>
    </div>
  );
}
