import { useState, useEffect, useRef } from 'react';
import {
  User,
  Image as ImageIcon,
  Scissors,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  Globe,
  LayoutDashboard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './PublicView.css';

// ── Business-type display helpers ─────────────────────────────────────────────

function firstName(fullName) {
  return fullName?.trim().split(/\s+/)[0] ?? 'Your artist';
}

const OWNER_TITLES = {
  nail_studio: 'Nail Technician',
  lash_studio: 'Lash Artist',
  spa:         'Spa Therapist',
  barbershop:  'Barber & Grooming Specialist',
  mua:         'Makeup Artist',
  other:       'Beauty Professional',
};

const MEET_SUBTITLES = {
  nail_studio: 'The nail artist behind every set',
  lash_studio: 'The lash artist perfecting every look',
  spa:         'Your guide to rest and renewal',
  barbershop:  'The barber shaping every look',
  mua:         'The artist behind every transformation',
  other:       'The professional behind every appointment',
};

function ownerTitle(type) {
  return OWNER_TITLES[type] ?? 'Beauty Professional';
}

function meetSubtitle(type) {
  return MEET_SUBTITLES[type] ?? 'The artist behind every appointment';
}

function ownerBio(type, ownerName, bizName) {
  const first = firstName(ownerName);
  switch (type) {
    case 'nail_studio':
      return `Based in Nigeria, ${first} has built a reputation for flawless nail work at ${bizName}. From everyday gel sets to intricate nail art, every client leaves looking and feeling their best.`;
    case 'lash_studio':
      return `${first} is a certified lash artist at ${bizName} with a passion for enhancing natural beauty. Whether you want a subtle lift or dramatic volume, every set is crafted with precision and care.`;
    case 'spa':
      return `At ${bizName}, ${first} creates a sanctuary where every treatment is a moment of pure relaxation and renewal. With expert hands and a calming presence, your wellness is always the priority.`;
    case 'barbershop':
      return `${first} and the team at ${bizName} deliver sharp cuts, clean fades, and precise grooming for every client. Walk in looking good — walk out looking your absolute best.`;
    case 'mua':
      return `${first} is a professional makeup artist at ${bizName} who transforms every look with skill and artistry. From natural glam to full bridal, your vision comes to life at every appointment.`;
    default:
      return `${first} at ${bizName} is dedicated to delivering exceptional beauty services tailored to every client. Book an appointment and experience the difference that expert care makes.`;
  }
}

export default function PublicView({
  businessId: propBusinessId,
  isOwner           = false,
  showWelcomeBanner = false,
  onWelcomeDismiss,
  onGoToDashboard,
}) {
  const bookingRef = useRef(null);

  // Welcome banner is locally dismissable; re-appears only if parent resets the prop
  const [bannerVisible, setBannerVisible] = useState(showWelcomeBanner);

  const [sessionUserId, setSessionUserId] = useState(null);
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service_name: '',
    price: 0,
    date: '',
    time: '',
    ampm: 'AM',
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Check whether the current visitor is the owner of this page.
  // Runs once on mount — doesn't block the business data load.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    async function loadAll() {
      // Fetch the business — by id if provided, otherwise the first row
      const bizQuery = propBusinessId
        ? supabase.from('businesses').select('id, name, owner_name, tagline, business_type, user_id').eq('id', propBusinessId).single()
        : supabase.from('businesses').select('id, name, owner_name, tagline, business_type, user_id').limit(1).single();

      const { data: biz } = await bizQuery;
      if (!biz) {
        setServicesLoading(false);
        setGalleryLoading(false);
        return;
      }
      setBusiness(biz);
      document.title = `${biz.name.toUpperCase()} | BeautyOS`;

      // Now fetch services and gallery scoped to this business
      const [svcRes, galRes] = await Promise.all([
        supabase
          .from('services')
          .select('id, name, price, category')
          .eq('business_id', biz.id)
          .eq('active', true)
          .order('category')
          .order('name'),
        supabase
          .from('gallery')
          .select('id, image_url, caption')
          .eq('business_id', biz.id)
          .order('created_at', { ascending: false }),
      ]);

      setServices(svcRes.data || []);
      setServicesLoading(false);
      setGallery(galRes.data || []);
      setGalleryLoading(false);
    }
    loadAll();
    return () => { document.title = 'BeautyOS'; };
  }, [propBusinessId]);

  function handleChange(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setFieldErrors((fe) => ({ ...fe, [field]: '' }));
    };
  }

  function handleServiceChange(e) {
    const selected = services.find((s) => s.name === e.target.value);
    setForm((f) => ({
      ...f,
      service_name: e.target.value,
      price: selected ? selected.price : 0,
    }));
    setFieldErrors((fe) => ({ ...fe, service_name: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.client_name.trim()) errors.client_name = 'Full name is required';
    if (!form.client_phone.trim()) errors.client_phone = 'Phone number is required';
    if (!form.service_name) errors.service_name = 'Please select a service';
    if (!form.date) errors.date = 'Please choose a date';
    if (!form.time.trim()) errors.time = 'Please enter a preferred time';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!business?.id) {
      setFormError('Unable to submit. Please refresh and try again.');
      return;
    }
    setFormLoading(true);
    setFormError('');

    const { error } = await supabase.from('bookings').insert({
      business_id: business.id,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      service_name: form.service_name,
      price: form.price,
      date: form.date,
      time: form.time.trim(),
      ampm: form.ampm,
      status: 'pending',
      notes: form.notes.trim(),
    });

    setFormLoading(false);
    if (error) {
      console.error('[BookingInsert]', error.code, error.message, error.details, error.hint);
      setFormError('Something went wrong. Please try again.');
    } else {
      setFormSuccess(true);
      setForm({
        client_name: '',
        client_phone: '',
        service_name: '',
        price: 0,
        date: '',
        time: '',
        ampm: 'AM',
        notes: '',
      });
    }
  }

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const today = new Date().toISOString().split('T')[0];

  function handleBannerDismiss() {
    setBannerVisible(false);
    onWelcomeDismiss?.();
  }

  // /api/og?business=ID gives WhatsApp the correct OG preview and redirects
  // real browsers to the React app automatically.
  const bookingLink = typeof window !== 'undefined'
    ? `${window.location.origin}/api/og?business=${propBusinessId}`
    : '';

  const isActualOwner = !!sessionUserId && !!business && business.user_id === sessionUserId;

  return (
    <div className="pv-root">

      {/* ── Owner sticky bar — visible only to the authenticated owner ── */}
      {isActualOwner && (
        <div className="pv-owner-bar">
          <span className="pv-owner-bar-text">Viewing your public page</span>
          <button className="pv-owner-bar-btn" onClick={onGoToDashboard}>
            <LayoutDashboard size={13} />
            Go to Dashboard
          </button>
        </div>
      )}

      {/* ── Welcome banner (new signups only, dismissable) ── */}
      {isOwner && bannerVisible && (
        <div className="pv-welcome-banner">
          <div className="pv-welcome-inner">
            <Globe size={15} className="pv-welcome-icon" />
            <p className="pv-welcome-text">
              <strong>Your booking page is live.</strong>{' '}
              Share this link with your clients:{' '}
              <span className="pv-welcome-link">{bookingLink}</span>
            </p>
          </div>
          <button className="pv-welcome-dismiss" onClick={handleBannerDismiss} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="pv-hero">
        <div className="pv-inner">
          <p className="pv-eyebrow">Welcome to</p>
          <h1 className="pv-hero-title">
            {business?.name ?? 'CFO Nails & Lash Studio'}
          </h1>
          <p className="pv-hero-tagline">
            {business?.tagline ?? 'Nail Technician & Lash Artist · Lagos, Nigeria'}
          </p>
          <button className="pv-btn-primary" onClick={scrollToBooking}>
            Book an Appointment
          </button>
        </div>
      </section>

      {/* Services */}
      <section className="pv-section pv-section--white">
        <div className="pv-inner">
          <h2 className="pv-section-title">Our Services</h2>
          <p className="pv-section-sub">Handcrafted beauty, every detail attended to</p>
          <div className="pv-services-grid">
            {servicesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="pv-skeleton-card" />
                ))
              : services.map((svc) => (
                  <div key={svc.id} className="pv-service-card">
                    <span className={`pv-category-tag pv-category-tag--${svc.category}`}>
                      {svc.category === 'nails'
                        ? <Scissors size={10} />
                        : <Eye size={10} />}
                      {svc.category}
                    </span>
                    <p className="pv-service-name">{svc.name}</p>
                    <p className="pv-service-price">
                      &#8358;{svc.price.toLocaleString()}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="pv-section pv-section--blush" ref={bookingRef}>
        <div className="pv-inner">
          <h2 className="pv-section-title">Book an Appointment</h2>
          <p className="pv-section-sub">Fill in your details and we will confirm via WhatsApp</p>

          {formSuccess ? (
            <div className="pv-success-card">
              <CheckCircle size={36} className="pv-success-icon" strokeWidth={1.5} />
              <h3 className="pv-success-title">Request Received</h3>
              <p className="pv-success-body">
                Thank you for reaching out. Your booking request has been sent and
                we will confirm your appointment via WhatsApp shortly.
              </p>
              <button
                className="pv-btn-primary"
                onClick={() => setFormSuccess(false)}
              >
                Book Another Appointment
              </button>
            </div>
          ) : (
            <form className="pv-form" onSubmit={handleSubmit} noValidate>
              <div className="pv-field">
                <label className="pv-label">Full Name</label>
                <input
                  className={`pv-input${fieldErrors.client_name ? ' pv-input--error' : ''}`}
                  type="text"
                  placeholder="Your full name"
                  value={form.client_name}
                  onChange={handleChange('client_name')}
                />
                {fieldErrors.client_name && (
                  <span className="pv-field-error">
                    <AlertCircle size={12} />
                    {fieldErrors.client_name}
                  </span>
                )}
              </div>

              <div className="pv-field">
                <label className="pv-label">Phone Number</label>
                <input
                  className={`pv-input${fieldErrors.client_phone ? ' pv-input--error' : ''}`}
                  type="text"
                  placeholder="e.g. 08012345678"
                  value={form.client_phone}
                  onChange={handleChange('client_phone')}
                />
                {fieldErrors.client_phone && (
                  <span className="pv-field-error">
                    <AlertCircle size={12} />
                    {fieldErrors.client_phone}
                  </span>
                )}
              </div>

              <div className="pv-field">
                <label className="pv-label">Service</label>
                <div className="pv-select-wrap">
                  <select
                    className={`pv-select${fieldErrors.service_name ? ' pv-input--error' : ''}`}
                    value={form.service_name}
                    onChange={handleServiceChange}
                  >
                    <option value="">Select a service</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.name}>
                        {svc.name} — &#8358;{svc.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pv-select-icon" />
                </div>
                {fieldErrors.service_name && (
                  <span className="pv-field-error">
                    <AlertCircle size={12} />
                    {fieldErrors.service_name}
                  </span>
                )}
              </div>

              <div className="pv-field">
                <label className="pv-label">Preferred Date</label>
                <input
                  className={`pv-input${fieldErrors.date ? ' pv-input--error' : ''}`}
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={handleChange('date')}
                />
                {fieldErrors.date && (
                  <span className="pv-field-error">
                    <AlertCircle size={12} />
                    {fieldErrors.date}
                  </span>
                )}
              </div>

              <div className="pv-field">
                <label className="pv-label">Preferred Time</label>
                <div className="pv-time-row">
                  <input
                    className={`pv-input pv-input--flex${fieldErrors.time ? ' pv-input--error' : ''}`}
                    type="text"
                    placeholder="e.g. 2:30"
                    value={form.time}
                    onChange={handleChange('time')}
                  />
                  <div className="pv-select-wrap pv-ampm-wrap">
                    <select
                      className="pv-select"
                      value={form.ampm}
                      onChange={handleChange('ampm')}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                    <ChevronDown size={13} className="pv-select-icon" />
                  </div>
                </div>
                {fieldErrors.time && (
                  <span className="pv-field-error">
                    <AlertCircle size={12} />
                    {fieldErrors.time}
                  </span>
                )}
              </div>

              <div className="pv-field">
                <label className="pv-label">
                  Notes{' '}
                  <span className="pv-label-optional">(optional)</span>
                </label>
                <textarea
                  className="pv-textarea"
                  rows={3}
                  placeholder="Any special requests or details..."
                  value={form.notes}
                  onChange={handleChange('notes')}
                />
              </div>

              {formError && (
                <div className="pv-form-error">
                  <AlertCircle size={14} />
                  {formError}
                </div>
              )}

              <button
                className="pv-btn-submit"
                type="submit"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 size={15} className="pv-spin" />
                    Sending Request...
                  </>
                ) : (
                  'Request Appointment'
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Meet Chi */}
      <section className="pv-section pv-section--white">
        <div className="pv-inner">
          <h2 className="pv-section-title">
            Meet {firstName(business?.owner_name)}
          </h2>
          <p className="pv-section-sub">
            {meetSubtitle(business?.business_type)}
          </p>
          <div className="pv-profile">
            <div className="pv-avatar">
              <User size={44} strokeWidth={1.25} />
            </div>
            <h3 className="pv-profile-name">
              {business?.owner_name ?? ''}
            </h3>
            <p className="pv-profile-title">
              {ownerTitle(business?.business_type)}
            </p>
            <p className="pv-profile-bio">
              {ownerBio(business?.business_type, business?.owner_name, business?.name)}
            </p>
            <div className="pv-stats">
              <div className="pv-stat">
                <span className="pv-stat-value">200+</span>
                <span className="pv-stat-label">Clients</span>
              </div>
              <div className="pv-stat pv-stat--accent">
                <span className="pv-stat-value">
                  {servicesLoading ? '—' : services.length}
                </span>
                <span className="pv-stat-label">Services</span>
              </div>
              <div className="pv-stat">
                <span className="pv-stat-value">3+</span>
                <span className="pv-stat-label">Years Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="pv-section pv-section--blush">
        <div className="pv-inner">
          <h2 className="pv-section-title">Gallery</h2>
          <p className="pv-section-sub">A glimpse of the work</p>

          {galleryLoading ? (
            <div className="pv-gallery-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pv-skeleton-gallery" />
              ))}
            </div>
          ) : gallery.length > 0 ? (
            <div className="pv-gallery-grid">
              {gallery.map((item) => (
                <div key={item.id} className="pv-gallery-item">
                  <img
                    src={item.image_url}
                    alt={item.caption || 'Gallery'}
                    loading="lazy"
                  />
                  {item.caption && (
                    <p className="pv-gallery-caption">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="pv-gallery-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pv-gallery-placeholder">
                  <ImageIcon size={22} strokeWidth={1.5} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="pv-footer">
        <p className="pv-footer-copy">© 2026 {business?.name ?? ''}</p>
      </footer>
    </div>
  );
}
