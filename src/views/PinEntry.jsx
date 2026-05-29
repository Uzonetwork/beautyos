import { useState } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './PinEntry.css';

export default function PinEntry({ onSuccess, onBack }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: dbError } = await supabase
      .from('businesses')
      .select('id, pin')
      .limit(1)
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError('Unable to verify PIN. Please try again.');
      return;
    }

    if (data.pin === pin) {
      onSuccess(data.id);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  }

  return (
    <div className="pe-root">
      <div className="pe-card">
        <div className="pe-icon-wrap">
          <Lock size={22} strokeWidth={1.5} />
        </div>
        <h1 className="pe-title">Owner Access</h1>
        <p className="pe-sub">Enter your 4-digit PIN to continue</p>

        <form className="pe-form" onSubmit={handleSubmit} noValidate>
          <input
            className={`pe-input${error ? ' pe-input--error' : ''}`}
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            autoFocus
          />
          {error && (
            <div className="pe-error">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          <button
            className="pe-btn"
            type="submit"
            disabled={loading || pin.length !== 4}
          >
            {loading && <Loader2 size={15} className="pe-spin" />}
            {loading ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>

        <button className="pe-back" onClick={onBack}>
          Back to public view
        </button>
      </div>
    </div>
  );
}
