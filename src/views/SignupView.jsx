import { useState } from 'react';
import {
  Scissors, Eye, Leaf, User, Sparkles, MoreHorizontal,
  Check, AlertCircle, Loader2, ChevronLeft,
  Shirt, Camera, Home, GraduationCap, Dumbbell, PartyPopper,
  ChefHat, Video, Music2, Briefcase,
} from 'lucide-react';
import { signUp } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';

// ── Business type config ───────────────────────────────────────────────────────

const BEAUTY_TYPES = [
  { id: 'nail_studio',  label: 'Nail Studio',  Icon: Scissors,      desc: 'Manicures, pedicures, nail art', services: ['Gel Manicure','Nail Extensions','Nail Art','Acrylic Nails','Nail Removal','Pedicure'] },
  { id: 'lash_studio',  label: 'Lash Studio',  Icon: Eye,           desc: 'Lash lifts, extensions, tints',  services: ['Lash Lift','Lash Extensions','Lash Tint'] },
  { id: 'spa',          label: 'Spa',           Icon: Leaf,          desc: 'Massages, facials, body treatments', services: ['Swedish Massage','Deep Tissue Massage','Body Scrub','Facial','Waxing','Aromatherapy'] },
  { id: 'barbershop',   label: 'Barbershop',    Icon: User,          desc: 'Cuts, trims, and styling',       services: ['Haircut','Beard Trim','Shape Up','Hair Treatment'] },
  { id: 'mua',          label: 'MUA',           Icon: Sparkles,      desc: 'Glam, bridal, editorial makeup', services: ['Full Glam Makeup','Natural Makeup','Bridal Makeup','Gele Tying'] },
  { id: 'other',        label: 'Other',         Icon: MoreHorizontal,desc: 'Any other beauty or service type', services: [] },
];

const OTHER_TYPES = [
  { id: 'tailor',          label: 'Tailor & Fashion',      Icon: Shirt,         desc: 'Bespoke outfits, alterations, aso-ebi', services: ['Dress Sewing','Trouser','Agbada/Senator','Skirt & Blouse','Alterations','Aso-Ebi Sewing'] },
  { id: 'photography',     label: 'Photographer',          Icon: Camera,        desc: 'Portraits, events, product photography', services: ['Portrait Session','Event Coverage','Passport Photos','Product Photography','Editing Only'] },
  { id: 'home_services',   label: 'Home Services',         Icon: Home,          desc: 'Plumbing, electrical, AC, repairs', services: ['Plumbing Repair','Electrical Repair','AC Service','Painting','Tiling'] },
  { id: 'tutor',           label: 'Private Tutor',         Icon: GraduationCap, desc: 'Primary, secondary, exam-prep lessons', services: ['Primary Lessons','Secondary Lessons','JAMB Prep','WAEC Prep','Coding Lessons'] },
  { id: 'fitness',         label: 'Fitness & Wellness',    Icon: Dumbbell,      desc: 'Training, nutrition, group classes', services: ['Personal Training Session','Monthly Training Plan','Nutrition Consultation','Group Class'] },
  { id: 'events',          label: 'Event Services',        Icon: PartyPopper,   desc: 'MC, DJ, decoration, catering', services: ['MC/Compere','DJ Services','Decoration','Catering Per Head','Small Chops'] },
  { id: 'private_chef',    label: 'Private Chef',          Icon: ChefHat,       desc: 'Home dinners, catering, cooking classes', services: ['Home Dinner Experience','Meal Prep Weekly','Event Catering','Cooking Class','Diet Meal Plan'] },
  { id: 'content_creator', label: 'Content Creator',       Icon: Video,         desc: 'Reels, videos, brand content', services: ['Instagram Reel','YouTube Video','Product Review','Brand Photoshoot','Monthly Content Package'] },
  { id: 'dj',              label: 'Music DJ',              Icon: Music2,        desc: 'Clubs, weddings, parties, corporate events', services: ['Club Night','Wedding DJ','House Party','Corporate Event','Mix/Edit Only'] },
  { id: 'other_professional', label: 'Other — Tell us what you do', Icon: Briefcase, desc: 'Any profession not listed above', services: [] },
];

const ALL_BUSINESS_TYPES = [...BEAUTY_TYPES, ...OTHER_TYPES];
const STEPS = ['Business Info', 'Business Type', 'Account Setup'];

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

// ── Shared input class ─────────────────────────────────────────────────────────

const inputCls = (hasErr) =>
  `w-full bg-sabi-dark border rounded-xl px-4 py-3 text-white placeholder:text-sabi-muted outline-none transition-colors ${hasErr ? 'border-red-500' : 'border-sabi-border focus:border-sabi-green'}`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupView({ onBack, onSuccess, onLogin }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [businessName, setBusinessName] = useState('');
  const [ownerName,    setOwnerName]    = useState('');
  const [whatsapp,     setWhatsapp]     = useState('');
  const [address,      setAddress]      = useState('');
  const [city,         setCity]         = useState('');
  const [state,        setState]        = useState('');
  const [step1Errors,  setStep1Errors]  = useState({});

  // Step 2
  const [businessType,       setBusinessType]       = useState(null);
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [step2Error,         setStep2Error]         = useState('');

  // Step 3
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [step3Errors, setStep3Errors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  // ── Validation ───────────────────────────────────────────────────────────────

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

  const selectedType = ALL_BUSINESS_TYPES.find(t => t.id === businessType);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-sabi-card border border-sabi-border rounded-2xl p-6 md:p-8">

        {/* Logo */}
        <button className="mb-6 bg-transparent border-0 cursor-pointer p-0" onClick={() => { window.location.href = '/'; }}>
          <SabiLogo size="md" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => {
            const n      = i + 1;
            const done   = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active ? 'bg-sabi-gold text-sabi-dark' : done ? 'bg-sabi-green text-sabi-dark' : 'bg-sabi-border text-sabi-muted'}`}>
                    {done ? <Check size={12} strokeWidth={3} /> : n}
                  </div>
                  <span className={`text-xs ${active ? 'text-white font-semibold' : 'text-sabi-muted'} whitespace-nowrap hidden sm:block`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${done ? 'bg-sabi-green' : 'bg-sabi-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1 ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 className="font-serif text-3xl font-medium text-white mb-1">Tell us about your business</h1>
            <p className="text-sabi-muted text-sm mb-6">This appears on your public booking page.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Business Name</label>
                <input className={inputCls(step1Errors.businessName)} placeholder="e.g. Chi's Nail Studio" value={businessName} autoFocus onChange={e => { setBusinessName(e.target.value); setStep1Errors(p => ({ ...p, businessName: '' })); }} />
                {step1Errors.businessName && <span className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={12} />{step1Errors.businessName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Your Full Name</label>
                <input className={inputCls(step1Errors.ownerName)} placeholder="e.g. Chioma Ohanusi" value={ownerName} onChange={e => { setOwnerName(e.target.value); setStep1Errors(p => ({ ...p, ownerName: '' })); }} />
                {step1Errors.ownerName && <span className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={12} />{step1Errors.ownerName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">WhatsApp Number <span className="text-sabi-border normal-case tracking-normal">(optional)</span></label>
                <input className={inputCls(false)} placeholder="e.g. 2348012345678" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Business Address <span className="text-sabi-border normal-case tracking-normal">(optional)</span></label>
                <input className={inputCls(false)} placeholder="e.g. 15 Admiralty Way, Lekki Phase 1" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">City <span className="text-sabi-border normal-case tracking-normal">(opt.)</span></label>
                  <input className={inputCls(false)} placeholder="e.g. Lagos" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">State <span className="text-sabi-border normal-case tracking-normal">(opt.)</span></label>
                  <select className={`${inputCls(false)} bg-sabi-dark`} value={state} onChange={e => setState(e.target.value)}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button className="btn-gold w-full justify-center py-3 mt-2" onClick={nextFromStep1}>
                Continue
              </button>
            </div>

            <p className="text-center text-sm text-sabi-muted mt-6">
              Already have an account?{' '}
              <button className="text-sabi-green font-semibold hover:underline bg-transparent border-0 cursor-pointer" onClick={onLogin}>Log in</button>
            </p>
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <button className="flex items-center gap-1 text-sabi-muted text-sm mb-5 hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={() => setStep(1)}>
              <ChevronLeft size={14} /> Back
            </button>
            <h1 className="font-serif text-3xl font-medium text-white mb-1">What type of business is this?</h1>
            <p className="text-sabi-muted text-sm mb-6">We&apos;ll set up your services automatically.</p>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Beauty &amp; Wellness</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BEAUTY_TYPES.map(({ id, label, Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setBusinessType(id); setStep2Error(''); }}
                    className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all ${businessType === id ? 'border-sabi-gold bg-sabi-gold/10' : 'border-sabi-border bg-sabi-dark hover:border-sabi-green'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${businessType === id ? 'bg-sabi-gold/20' : 'bg-sabi-card'}`}>
                      <Icon size={18} strokeWidth={1.5} className={businessType === id ? 'text-sabi-gold' : 'text-sabi-muted'} />
                    </div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-sabi-muted leading-tight mt-0.5">{desc}</p>
                    {businessType === id && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-sabi-gold rounded-full flex items-center justify-center">
                        <Check size={10} strokeWidth={3} className="text-sabi-dark" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Other Professionals</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {OTHER_TYPES.map(({ id, label, Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setBusinessType(id); setStep2Error(''); }}
                    className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all ${businessType === id ? 'border-sabi-gold bg-sabi-gold/10' : 'border-sabi-border bg-sabi-dark hover:border-sabi-green'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${businessType === id ? 'bg-sabi-gold/20' : 'bg-sabi-card'}`}>
                      <Icon size={18} strokeWidth={1.5} className={businessType === id ? 'text-sabi-gold' : 'text-sabi-muted'} />
                    </div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-sabi-muted leading-tight mt-0.5">{desc}</p>
                    {businessType === id && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-sabi-gold rounded-full flex items-center justify-center">
                        <Check size={10} strokeWidth={3} className="text-sabi-dark" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {businessType === 'other_professional' && (
              <div className="mb-4">
                <input
                  className={inputCls(false)}
                  placeholder="What's your profession?"
                  value={customBusinessType}
                  autoFocus
                  onChange={e => setCustomBusinessType(e.target.value)}
                />
              </div>
            )}

            {selectedType && selectedType.services.length > 0 && (
              <div className="bg-sabi-dark border border-sabi-border rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-sabi-muted mb-2">Services included with {selectedType.label}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedType.services.map(s => (
                    <span key={s} className="text-xs bg-sabi-card border border-sabi-border rounded-full px-2.5 py-1 text-sabi-muted">{s}</span>
                  ))}
                </div>
                <p className="text-xs text-sabi-border">You can edit, add, or remove services after setup.</p>
              </div>
            )}

            {step2Error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                <AlertCircle size={13} />{step2Error}
              </div>
            )}

            <button className="btn-gold w-full justify-center py-3" onClick={nextFromStep2}>
              Continue
            </button>
          </div>
        )}

        {/* ── Step 3 ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            {!success && (
              <button className="flex items-center gap-1 text-sabi-muted text-sm mb-5 hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={() => setStep(2)}>
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <h1 className="font-serif text-3xl font-medium text-white mb-1">
              {success ? "You're in." : 'Create your account'}
            </h1>
            {!success && <p className="text-sabi-muted text-sm mb-6">This is how you&apos;ll log into your dashboard.</p>}

            {success ? (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-16 h-16 rounded-full bg-sabi-green/20 border border-sabi-green flex items-center justify-center">
                  <Check size={28} strokeWidth={2} className="text-sabi-green" />
                </div>
                <p className="text-sabi-muted text-sm">Setting up your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Email Address</label>
                  <input className={inputCls(step3Errors.email)} type="email" placeholder="you@example.com" value={email} autoComplete="email" autoFocus onChange={e => { setEmail(e.target.value); setStep3Errors(p => ({ ...p, email: '' })); }} />
                  {step3Errors.email && <span className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={12} />{step3Errors.email}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Password</label>
                  <input className={inputCls(step3Errors.password)} type="password" placeholder="At least 6 characters" value={password} autoComplete="new-password" onChange={e => { setPassword(e.target.value); setStep3Errors(p => ({ ...p, password: '' })); }} />
                  {step3Errors.password && <span className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={12} />{step3Errors.password}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input className={inputCls(step3Errors.confirm)} type="password" placeholder="Repeat your password" value={confirm} autoComplete="new-password" onChange={e => { setConfirm(e.target.value); setStep3Errors(p => ({ ...p, confirm: '' })); }} />
                  {step3Errors.confirm && <span className="flex items-center gap-1 text-red-400 text-xs mt-1"><AlertCircle size={12} />{step3Errors.confirm}</span>}
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    <AlertCircle size={14} className="flex-shrink-0" />{submitError}
                  </div>
                )}

                <button className="btn-gold w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                  {loading && <Loader2 size={15} className="sv-spin" />}
                  {loading ? 'Creating your account…' : 'Create Account & Go to Dashboard'}
                </button>

                <p className="text-xs text-sabi-muted text-center">
                  By signing up you agree to our{' '}
                  <a href="/#/terms"   className="text-sabi-green hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}
                  and{' '}
                  <a href="/#/privacy" className="text-sabi-green hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
