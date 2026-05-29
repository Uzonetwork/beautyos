import { useState } from 'react';
import {
  Scissors, Eye, Leaf, User, Sparkles, MoreHorizontal,
  Check, AlertCircle, Loader2, ChevronLeft,
} from 'lucide-react';
import { signUp } from '../lib/auth';
import './SignupView.css';

// ── Business type config ───────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  {
    id: 'nail_studio',
    label: 'Nail Studio',
    Icon: Scissors,
    desc: 'Manicures, pedicures, nail art',
    services: ['Gel Manicure', 'Nail Extensions', 'Nail Art', 'Acrylic Nails', 'Nail Removal', 'Pedicure'],
  },
  {
    id: 'lash_studio',
    label: 'Lash Studio',
    Icon: Eye,
    desc: 'Lash lifts, extensions, tints',
    services: ['Lash Lift', 'Lash Extensions', 'Lash Tint'],
  },
  {
    id: 'spa',
    label: 'Spa',
    Icon: Leaf,
    desc: 'Massages, facials, body treatments',
    services: ['Swedish Massage', 'Deep Tissue Massage', 'Body Scrub', 'Facial', 'Waxing', 'Aromatherapy'],
  },
  {
    id: 'barbershop',
    label: 'Barbershop',
    Icon: User,
    desc: 'Cuts, trims, and styling',
    services: ['Haircut', 'Beard Trim', 'Shape Up', 'Hair Treatment'],
  },
  {
    id: 'mua',
    label: 'MUA',
    Icon: Sparkles,
    desc: 'Glam, bridal, editorial makeup',
    services: ['Full Glam Makeup', 'Natural Makeup', 'Bridal Makeup', 'Gele Tying'],
  },
  {
    id: 'other',
    label: 'Other',
    Icon: MoreHorizontal,
    desc: 'Any other beauty service',
    services: [],
  },
];

const STEPS = ['Business Info', 'Business Type', 'Account Setup'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupView({ onSuccess, onLogin }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [step1Errors, setStep1Errors] = useState({});

  // Step 2
  const [businessType, setBusinessType] = useState(null);
  const [step2Error, setStep2Error] = useState('');

  // Step 3
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step3Errors, setStep3Errors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Step navigation ──────────────────────────────────────────────────────────

  function validateStep1() {
    const errs = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (!ownerName.trim())    errs.ownerName    = 'Your full name is required';
    return errs;
  }

  function nextFromStep1() {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setStep1Errors(errs); return; }
    setStep1Errors({});
    setStep(2);
  }

  function nextFromStep2() {
    if (!businessType) { setStep2Error('Please select your business type'); return; }
    setStep2Error('');
    setStep(3);
  }

  function validateStep3() {
    const errs = {};
    if (!email.trim())            errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password)                errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirm)     errs.confirm  = 'Passwords do not match';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateStep3();
    if (Object.keys(errs).length) { setStep3Errors(errs); return; }
    setStep3Errors({});
    setSubmitError('');
    setLoading(true);

    try {
      const { business } = await signUp(email.trim(), password, {
        name:         businessName.trim(),
        ownerName:    ownerName.trim(),
        businessType,
        whatsapp:     whatsapp.trim(),
      });
      setSuccess(true);
      setTimeout(() => onSuccess(business), 1200);
    } catch (err) {
      setSubmitError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Selected business type metadata ─────────────────────────────────────────

  const selectedType = BUSINESS_TYPES.find(t => t.id === businessType);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="sv-root">
      <div className="sv-card">

        {/* Brand */}
        <p className="sv-brand">BeautyOS</p>

        {/* Progress indicator */}
        <div className="sv-progress">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done    = n < step;
            const active  = n === step;
            return (
              <div key={label} className="sv-step-wrap">
                <div className={`sv-step-circle${active ? ' sv-step-circle--active' : done ? ' sv-step-circle--done' : ''}`}>
                  {done ? <Check size={12} strokeWidth={3} /> : n}
                </div>
                <span className={`sv-step-label${active ? ' sv-step-label--active' : ''}`}>{label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`sv-step-line${done ? ' sv-step-line--done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Business info ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="sv-panel">
            <h1 className="sv-title">Tell us about your business</h1>
            <p className="sv-sub">This appears on your public booking page.</p>

            <div className="sv-form">
              <div className="sv-field">
                <label className="sv-label">Business Name</label>
                <input
                  className={`sv-input${step1Errors.businessName ? ' sv-input--error' : ''}`}
                  placeholder="e.g. Chi's Nail Studio"
                  value={businessName}
                  autoFocus
                  onChange={e => { setBusinessName(e.target.value); setStep1Errors(p => ({ ...p, businessName: '' })); }}
                />
                {step1Errors.businessName && <span className="sv-field-error"><AlertCircle size={12} />{step1Errors.businessName}</span>}
              </div>

              <div className="sv-field">
                <label className="sv-label">Your Full Name</label>
                <input
                  className={`sv-input${step1Errors.ownerName ? ' sv-input--error' : ''}`}
                  placeholder="e.g. Chioma Ohanusi"
                  value={ownerName}
                  onChange={e => { setOwnerName(e.target.value); setStep1Errors(p => ({ ...p, ownerName: '' })); }}
                />
                {step1Errors.ownerName && <span className="sv-field-error"><AlertCircle size={12} />{step1Errors.ownerName}</span>}
              </div>

              <div className="sv-field">
                <label className="sv-label">
                  WhatsApp Number <span className="sv-label-opt">(optional)</span>
                </label>
                <input
                  className="sv-input"
                  placeholder="e.g. 2348012345678"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>

              <button className="sv-btn-next" onClick={nextFromStep1}>
                Continue
              </button>
            </div>

            <p className="sv-footer-text">
              Already have an account?{' '}
              <button className="sv-link" onClick={onLogin}>Log in</button>
            </p>
          </div>
        )}

        {/* ── Step 2: Business type ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="sv-panel">
            <button className="sv-back" onClick={() => setStep(1)}>
              <ChevronLeft size={14} /> Back
            </button>
            <h1 className="sv-title">What type of business is this?</h1>
            <p className="sv-sub">We&apos;ll set up your services automatically.</p>

            <div className="sv-type-grid">
              {BUSINESS_TYPES.map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  className={`sv-type-card${businessType === id ? ' sv-type-card--selected' : ''}`}
                  onClick={() => { setBusinessType(id); setStep2Error(''); }}
                >
                  <div className="sv-type-icon">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <p className="sv-type-label">{label}</p>
                  <p className="sv-type-desc">{desc}</p>
                  {businessType === id && (
                    <span className="sv-type-check"><Check size={11} strokeWidth={3} /></span>
                  )}
                </button>
              ))}
            </div>

            {/* Services preview */}
            {selectedType && selectedType.services.length > 0 && (
              <div className="sv-services-preview">
                <p className="sv-preview-label">
                  Services included with {selectedType.label}
                </p>
                <div className="sv-preview-tags">
                  {selectedType.services.map(s => (
                    <span key={s} className="sv-preview-tag">{s}</span>
                  ))}
                </div>
                <p className="sv-preview-note">You can edit, add, or remove services after setup.</p>
              </div>
            )}

            {selectedType && selectedType.services.length === 0 && (
              <div className="sv-services-preview">
                <p className="sv-preview-note sv-preview-note--center">
                  You can add your own services after setup.
                </p>
              </div>
            )}

            {step2Error && <p className="sv-step2-error"><AlertCircle size={13} />{step2Error}</p>}

            <button className="sv-btn-next" onClick={nextFromStep2}>
              Continue
            </button>
          </div>
        )}

        {/* ── Step 3: Account setup ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="sv-panel">
            {!success && (
              <button className="sv-back" onClick={() => setStep(2)}>
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <h1 className="sv-title">
              {success ? 'You\'re in.' : 'Create your account'}
            </h1>
            {!success && <p className="sv-sub">This is how you&apos;ll log into your dashboard.</p>}

            {success ? (
              <div className="sv-success">
                <div className="sv-success-icon">
                  <Check size={28} strokeWidth={2} />
                </div>
                <p className="sv-success-text">Setting up your dashboard&hellip;</p>
              </div>
            ) : (
              <form className="sv-form" onSubmit={handleSubmit} noValidate>
                <div className="sv-field">
                  <label className="sv-label">Email Address</label>
                  <input
                    className={`sv-input${step3Errors.email ? ' sv-input--error' : ''}`}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    autoComplete="email"
                    autoFocus
                    onChange={e => { setEmail(e.target.value); setStep3Errors(p => ({ ...p, email: '' })); }}
                  />
                  {step3Errors.email && <span className="sv-field-error"><AlertCircle size={12} />{step3Errors.email}</span>}
                </div>

                <div className="sv-field">
                  <label className="sv-label">Password</label>
                  <input
                    className={`sv-input${step3Errors.password ? ' sv-input--error' : ''}`}
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    autoComplete="new-password"
                    onChange={e => { setPassword(e.target.value); setStep3Errors(p => ({ ...p, password: '' })); }}
                  />
                  {step3Errors.password && <span className="sv-field-error"><AlertCircle size={12} />{step3Errors.password}</span>}
                </div>

                <div className="sv-field">
                  <label className="sv-label">Confirm Password</label>
                  <input
                    className={`sv-input${step3Errors.confirm ? ' sv-input--error' : ''}`}
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    autoComplete="new-password"
                    onChange={e => { setConfirm(e.target.value); setStep3Errors(p => ({ ...p, confirm: '' })); }}
                  />
                  {step3Errors.confirm && <span className="sv-field-error"><AlertCircle size={12} />{step3Errors.confirm}</span>}
                </div>

                {submitError && (
                  <div className="sv-submit-error">
                    <AlertCircle size={14} />
                    {submitError}
                  </div>
                )}

                <button className="sv-btn-next sv-btn-submit" type="submit" disabled={loading}>
                  {loading && <Loader2 size={15} className="sv-spin" />}
                  {loading ? 'Creating your account...' : 'Create Account & Go to Dashboard'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
