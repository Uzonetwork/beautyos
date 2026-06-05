import { useState } from 'react';
import {
  Scissors, Eye, Leaf, User, Sparkles, MoreHorizontal,
  Check, AlertCircle, Loader2, ChevronLeft,
  Shirt, Camera, Home, GraduationCap, Dumbbell, PartyPopper,
  ChefHat, Video, Music2, Briefcase,
} from 'lucide-react';
import { signUp } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';
import './SignupView.css';

// ── Business type config ───────────────────────────────────────────────────────

const BEAUTY_TYPES = [
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
    desc: 'Any other beauty or service type',
    services: [],
  },
];

const OTHER_TYPES = [
  {
    id: 'tailor',
    label: 'Tailor & Fashion',
    Icon: Shirt,
    desc: 'Bespoke outfits, alterations, aso-ebi',
    services: ['Dress Sewing', 'Trouser', 'Agbada/Senator', 'Skirt & Blouse', 'Alterations', 'Aso-Ebi Sewing'],
  },
  {
    id: 'photography',
    label: 'Photographer',
    Icon: Camera,
    desc: 'Portraits, events, product photography',
    services: ['Portrait Session', 'Event Coverage', 'Passport Photos', 'Product Photography', 'Editing Only'],
  },
  {
    id: 'home_services',
    label: 'Home Services',
    Icon: Home,
    desc: 'Plumbing, electrical, AC, repairs',
    services: ['Plumbing Repair', 'Electrical Repair', 'AC Service', 'Painting', 'Tiling'],
  },
  {
    id: 'tutor',
    label: 'Private Tutor',
    Icon: GraduationCap,
    desc: 'Primary, secondary, exam-prep lessons',
    services: ['Primary Lessons', 'Secondary Lessons', 'JAMB Prep', 'WAEC Prep', 'Coding Lessons'],
  },
  {
    id: 'fitness',
    label: 'Fitness & Wellness',
    Icon: Dumbbell,
    desc: 'Training, nutrition, group classes',
    services: ['Personal Training Session', 'Monthly Training Plan', 'Nutrition Consultation', 'Group Class'],
  },
  {
    id: 'events',
    label: 'Event Services',
    Icon: PartyPopper,
    desc: 'MC, DJ, decoration, catering',
    services: ['MC/Compere', 'DJ Services', 'Decoration', 'Catering Per Head', 'Small Chops'],
  },
  {
    id: 'private_chef',
    label: 'Private Chef',
    Icon: ChefHat,
    desc: 'Home dinners, catering, cooking classes',
    services: ['Home Dinner Experience', 'Meal Prep Weekly', 'Event Catering', 'Cooking Class', 'Diet Meal Plan'],
  },
  {
    id: 'content_creator',
    label: 'Content Creator',
    Icon: Video,
    desc: 'Reels, videos, brand content',
    services: ['Instagram Reel', 'YouTube Video', 'Product Review', 'Brand Photoshoot', 'Monthly Content Package'],
  },
  {
    id: 'dj',
    label: 'Music DJ',
    Icon: Music2,
    desc: 'Clubs, weddings, parties, corporate events',
    services: ['Club Night', 'Wedding DJ', 'House Party', 'Corporate Event', 'Mix/Edit Only'],
  },
  {
    id: 'other_professional',
    label: 'Other — Tell us what you do',
    Icon: Briefcase,
    desc: 'Any profession not listed above',
    services: [],
  },
];

const ALL_BUSINESS_TYPES = [...BEAUTY_TYPES, ...OTHER_TYPES];

const STEPS = ['Business Info', 'Business Type', 'Account Setup'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupView({ onBack, onSuccess, onLogin }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [step1Errors, setStep1Errors] = useState({});

  // Step 1 — extra fields
  const [address, setAddress]   = useState('');
  const [city, setCity]         = useState('');
  const [state, setState]       = useState('');

  // Step 2
  const [businessType, setBusinessType] = useState(null);
  const [customBusinessType, setCustomBusinessType] = useState('');
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
        name:               businessName.trim(),
        ownerName:          ownerName.trim(),
        businessType,
        whatsapp:           whatsapp.trim(),
        address:            address.trim() || null,
        city:               city.trim()    || null,
        state:              state          || null,
        customBusinessType: businessType === 'other_professional' ? customBusinessType.trim() : undefined,
      });
      setSuccess(true);
      setTimeout(() => onSuccess(business, email.trim()), 1200);
    } catch (err) {
      setSubmitError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Selected business type metadata ─────────────────────────────────────────

  const selectedType = ALL_BUSINESS_TYPES.find(t => t.id === businessType);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="sv-root">
      <div className="sv-card">

        {/* Brand — click to return to landing */}
        <button className="sv-brand" onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <SabiLogo size="md" dark={false} />
        </button>

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

              <div className="sv-field">
                <label className="sv-label">
                  Business Address <span className="sv-label-opt">(optional)</span>
                </label>
                <input
                  className="sv-input"
                  placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className="sv-field">
                <label className="sv-label">
                  City <span className="sv-label-opt">(optional)</span>
                </label>
                <input
                  className="sv-input"
                  placeholder="e.g. Lagos, Abuja, Port Harcourt"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div className="sv-field">
                <label className="sv-label">
                  State <span className="sv-label-opt">(optional)</span>
                </label>
                <select
                  className="sv-input sv-select"
                  value={state}
                  onChange={e => setState(e.target.value)}
                >
                  <option value="">Select your state</option>
                  {['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
                    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
                    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
                    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
                    'Yobe','Zamfara'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
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

            <div className="sv-type-group">
              <p className="sv-type-group-label">Beauty &amp; Wellness</p>
              <div className="sv-type-grid">
                {BEAUTY_TYPES.map(({ id, label, Icon, desc }) => (
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
            </div>

            <div className="sv-type-group">
              <p className="sv-type-group-label">Other Professionals</p>
              <div className="sv-type-grid">
                {OTHER_TYPES.map(({ id, label, Icon, desc }) => (
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
            </div>

            {/* Custom profession input — only for "other_professional" */}
            {businessType === 'other_professional' && (
              <div className="sv-custom-type-field">
                <input
                  className="sv-input"
                  placeholder="What's your profession?"
                  value={customBusinessType}
                  autoFocus
                  onChange={e => setCustomBusinessType(e.target.value)}
                />
              </div>
            )}

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
                <p className="sv-terms-note">
                  By signing up you agree to our{' '}
                  <a href="/#/terms" className="sv-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/#/privacy" className="sv-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
