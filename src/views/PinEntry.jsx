import { useState } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PinEntry({ onSuccess, onBack }) {
  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return; }
    setLoading(true); setError('');

    const { data, error: dbError } = await supabase.from('businesses').select('id, pin').limit(1).single();
    setLoading(false);

    if (dbError || !data) { setError('Unable to verify PIN. Please try again.'); return; }
    if (data.pin === pin) { onSuccess(data.id); }
    else { setError('Incorrect PIN'); setPin(''); }
  }

  return (
    <div className="min-h-screen bg-sabi-dark flex items-center justify-center px-4">
      <div className="w-full max-w-xs bg-sabi-card border border-sabi-border rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-sabi-dark border border-sabi-border flex items-center justify-center text-sabi-muted">
          <Lock size={22} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-2xl font-medium text-white">Owner Access</h1>
        <p className="text-sabi-muted text-sm text-center">Enter your 4-digit PIN to continue</p>

        <form className="w-full flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <input
            className={`w-full bg-sabi-dark border rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest outline-none transition-colors placeholder:text-sabi-muted ${error ? 'border-red-500' : 'border-sabi-border focus:border-sabi-green'}`}
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={13} />{error}
            </div>
          )}
          <button
            className="btn-gold w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading || pin.length !== 4}
          >
            {loading && <Loader2 size={15} className="pv-spin" />}
            {loading ? 'Verifying…' : 'Enter Dashboard'}
          </button>
        </form>

        <button className="text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={onBack}>
          Back to public view
        </button>
      </div>
    </div>
  );
}
