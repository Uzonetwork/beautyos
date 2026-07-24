import { useState, useEffect, useRef } from 'react';
import {
  User,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Globe,
  LayoutDashboard,
  MapPin,
  ChevronDown,
  Shield,
  Clock,
  Star,
  Copy,
  Check,
  Menu,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { track } from '../lib/posthog';
import { getBusinessTheme } from '../lib/getBusinessTheme';
import { isSubscriptionActive } from '../lib/payments';

// ── Static content maps ───────────────────────────────────────────────────────

const OWNER_TITLES = {
  nail_studio:        'Nail Technician',
  lash_studio:        'Lash Artist',
  spa:                'Spa Therapist',
  barbershop:         'Barber & Grooming Specialist',
  mua:                'Makeup Artist',
  other:              'Beauty Professional',
  tailor:             'Fashion Designer & Tailor',
  photography:        'Professional Photographer',
  home_services:      'Home Services Professional',
  tutor:              'Private Tutor',
  fitness:            'Fitness & Wellness Coach',
  events:             'Event Services Professional',
  private_chef:       'Private Chef',
  content_creator:    'Content Creator',
  dj:                 'Music DJ',
};

const HERO_HEADLINES = {
  nail_studio:        'Flawless Nail Care,\nCrafted to Perfect\nYour Style',
  lash_studio:        'Beautiful Lashes,\nTailored to Elevate\nYour Look',
  spa:                'Relax, Rejuvenate &\nRestore Your\nWellbeing',
  barbershop:         'Sharp Cuts.\nClean Fades.\nPrecision Grooming.',
  mua:                'Transformative Makeup\nArtistry for Every\nOccasion',
  tailor:             'Bespoke Fashion,\nCrafted to Fit\nYour Vision',
  photography:        'Capturing Your Story\nThrough a\nProfessional Lens',
  home_services:      'Reliable Home\nServices — Done Right,\nEvery Time',
  tutor:              'Personalised Learning\nThat Unlocks Your\nFull Potential',
  fitness:            'Train Smarter.\nLive Better.\nReach Your Goals.',
  events:             'Making Every Event\nTruly\nUnforgettable',
  private_chef:       'Restaurant-Quality\nDining, At Your\nLocation',
  content_creator:    'Compelling Content\nThat Tells Your\nBrand\'s Story',
  dj:                 'Premium DJ Sets\nfor Every\nOccasion',
  other_professional: 'Professional Services,\nDelivered with\nExcellence',
  other:              'Quality Services,\nEvery Time',
};

const HERO_SUBS = {
  nail_studio:        'From everyday manicures to intricate nail art — every detail is perfected with precision and care for hands that always look their best.',
  lash_studio:        'Whether you want a subtle lift or dramatic volume, every set is crafted with care to complement your unique features and personal style.',
  spa:                'Step into a sanctuary of calm. Every treatment is designed to restore, renew, and leave you feeling completely refreshed.',
  barbershop:         'Walk in looking good — walk out looking your absolute best. Expert cuts, clean fades, and precise grooming, every single visit.',
  mua:                'From natural glam to full bridal, your vision comes to life with professional artistry and premium products at every appointment.',
  tailor:             'Every stitch tells a story. Beautifully crafted bespoke outfits for weddings, events, and everyday elegance.',
  photography:        'Professional photography that preserves your most important moments with clarity, artistry, and a timeless eye for detail.',
  home_services:      'Trusted, skilled professionals for all your home maintenance and repair needs — delivered on time, every time.',
  tutor:              'Personalised one-on-one lessons designed to build confidence, improve grades, and help students reach their full academic potential.',
  fitness:            'Customised training programs and expert coaching to help you build the body and the life you deserve.',
  events:             'Full-service event planning and execution — every detail handled so you can focus entirely on enjoying the moment.',
  private_chef:       'Bringing the restaurant experience to your home. Exquisite meals crafted from premium, fresh ingredients.',
  content_creator:    'Engaging, high-quality content that connects your brand with your audience and drives real results across every platform.',
  dj:                 'From intimate gatherings to massive events — professional DJ services that keep the energy high and the crowd moving all night.',
  other_professional: 'Exceptional professional services delivered with expertise, care, and a genuine commitment to your satisfaction.',
  other:              'Dedicated to delivering quality results and an exceptional experience with every single appointment.',
};

const WHY_CARDS = {
  nail_studio: [
    { icon: '💅', title: 'Premium Products', desc: 'Professional-grade gels and polishes for long-lasting, beautiful results every time.' },
    { icon: '🎨', title: 'Custom Nail Art', desc: 'From minimalist designs to intricate nail art — every set is unique to your style.' },
    { icon: '📅', title: 'Easy Online Booking', desc: 'Book your appointment in under 2 minutes, any time, from any device.' },
  ],
  lash_studio: [
    { icon: '✨', title: 'Certified Technique', desc: 'Trained in the latest lash extension and lift methods for safe, stunning results.' },
    { icon: '👁️', title: 'Custom Lash Mapping', desc: 'Every set mapped to complement your unique eye shape and personal aesthetic.' },
    { icon: '🕐', title: 'Flexible Slots', desc: 'Morning, afternoon, and weekend slots available to fit your schedule.' },
  ],
  spa: [
    { icon: '🌿', title: 'Luxury Treatments', desc: 'Premium products and expert therapists committed to your total relaxation.' },
    { icon: '🧘', title: 'Holistic Wellness', desc: 'Treatments designed to nurture mind, body, and spirit in a calm environment.' },
    { icon: '🔒', title: 'Private & Discreet', desc: 'A peaceful sanctuary where your comfort and privacy always come first.' },
  ],
  barbershop: [
    { icon: '✂️', title: 'Precision Cuts', desc: 'Expert barbers trained in the latest techniques for clean fades and sharp lines.' },
    { icon: '💈', title: 'Full Grooming', desc: 'From haircuts to beard trims and hot towel shaves — complete grooming in one place.' },
    { icon: '⚡', title: 'On-Time, Every Time', desc: 'We respect your time with punctual, efficient appointments and no long waits.' },
  ],
  mua: [
    { icon: '💄', title: 'Pro-Grade Products', desc: 'Premium, long-lasting makeup brands trusted by professional artists worldwide.' },
    { icon: '🌸', title: 'Every Occasion', desc: 'Bridal, editorial, glam, natural — every look crafted to your exact vision.' },
    { icon: '📸', title: 'Camera-Ready', desc: 'Flawless application that looks stunning in person and in every photograph.' },
  ],
  tailor: [
    { icon: '👗', title: 'Bespoke Craftsmanship', desc: 'Cut and sewn to your exact measurements for a flawless, custom-fit every time.' },
    { icon: '🧵', title: 'Premium Fabrics', desc: 'Quality Ankara, lace, velvet and imported fabrics for every style and budget.' },
    { icon: '⏱️', title: 'On-Time Delivery', desc: 'We respect your deadlines — your outfit will be ready when promised.' },
  ],
  photography: [
    { icon: '📸', title: 'Pro Equipment', desc: 'Full-frame cameras, premium lenses, and professional lighting for stunning shots.' },
    { icon: '🖼️', title: 'Expert Editing', desc: 'Every image professionally edited to look its absolute best inside and out.' },
    { icon: '💾', title: 'Fast Turnaround', desc: 'Receive your full gallery in high resolution within the agreed timeline.' },
  ],
  home_services: [
    { icon: '🔧', title: 'Skilled Tradespeople', desc: 'Experienced professionals for plumbing, electrical, AC, and all home repairs.' },
    { icon: '✅', title: 'Quality Guaranteed', desc: 'All work is performed to a professional standard with post-service checks.' },
    { icon: '📞', title: 'Responsive Support', desc: 'Quick response times and clear communication from booking to completion.' },
  ],
  tutor: [
    { icon: '📚', title: 'Personalised Lessons', desc: 'Curriculum tailored to each student\'s learning style, pace, and objectives.' },
    { icon: '🎯', title: 'Proven Results', desc: 'A track record of helping students improve grades and pass key examinations.' },
    { icon: '💻', title: 'Flexible Delivery', desc: 'In-person and online sessions to fit your schedule and location.' },
  ],
  fitness: [
    { icon: '💪', title: 'Expert Coaching', desc: 'Certified fitness professionals creating programs that deliver real results.' },
    { icon: '🥗', title: 'Holistic Approach', desc: 'Training, nutrition, and lifestyle guidance for sustainable transformation.' },
    { icon: '📈', title: 'Progress Tracking', desc: 'Regular assessments to keep you on track toward your personal fitness goals.' },
  ],
  events: [
    { icon: '🎉', title: 'Full-Service Planning', desc: 'Decoration, MC, catering, music — every element handled with perfection.' },
    { icon: '⭐', title: 'Flawless Execution', desc: 'Meticulous attention to detail ensures every event runs smoothly on schedule.' },
    { icon: '💬', title: 'Clear Communication', desc: 'Regular updates and open dialogue from first booking to your event day.' },
  ],
  private_chef: [
    { icon: '👨‍🍳', title: 'Restaurant-Quality', desc: 'Michelin-inspired menus crafted from fresh, premium ingredients at your home.' },
    { icon: '🍽️', title: 'Custom Menus', desc: 'Every menu designed around your preferences, dietary needs, and occasion.' },
    { icon: '🫙', title: 'Full Cleanup Included', desc: 'We handle everything from setup to cleanup — you just enjoy the experience.' },
  ],
  content_creator: [
    { icon: '🎬', title: 'High Production Quality', desc: 'Professional-grade video and photography that makes your content stand out.' },
    { icon: '📱', title: 'Platform Expertise', desc: 'Content optimised for Instagram, TikTok, YouTube, and all major platforms.' },
    { icon: '🚀', title: 'Quick Turnaround', desc: 'Timely delivery without compromising on quality — content when you need it.' },
  ],
  dj: [
    { icon: '🎧', title: 'Pro Equipment', desc: 'Pioneer CDJs and a premium sound system that delivers the perfect audio.' },
    { icon: '🎵', title: 'Any Genre, Any Vibe', desc: 'Afrobeats, Amapiano, R&B, Hip-Hop, House — the perfect soundtrack for your event.' },
    { icon: '⚡', title: 'High Energy Sets', desc: 'Reading the crowd and keeping energy levels at their peak all night long.' },
  ],
};

const DEFAULT_WHY_CARDS = [
  { icon: '⭐', title: 'Premium Quality', desc: 'Committed to delivering exceptional results with every single appointment.' },
  { icon: '🤝', title: 'Personalised Service', desc: 'Every client receives individual attention and a tailored experience.' },
  { icon: '📅', title: 'Easy Scheduling', desc: 'Simple online booking available 24/7 from any device, in under 2 minutes.' },
];

const SERVICE_SUBTITLES = {
  nail_studio:        'Professional nail care, every detail perfected',
  lash_studio:        'Lash services tailored just for you',
  spa:                'Relaxation and wellness, your way',
  barbershop:         'Sharp cuts and clean styles',
  mua:                'Glam looks for every occasion',
  tailor:             'Bespoke outfits crafted to fit you perfectly',
  photography:        'Capturing your moments professionally',
  home_services:      'Reliable home repairs and maintenance',
  tutor:              'Personalised lessons to help you excel',
  fitness:            'Training and wellness programs built for you',
  events:             'Making your events unforgettable',
  private_chef:       'Restaurant-quality dining, at your location',
  content_creator:    'Creative content that tells your story',
  dj:                 'Professional DJ sets for every occasion',
  other_professional: 'Professional services, booked with ease',
  other:              'Quality services, every time',
};

const MEET_SUBTITLES = {
  nail_studio:        'The nail artist behind every booking',
  lash_studio:        'The lash technician behind every booking',
  spa:                'The therapist behind every booking',
  barbershop:         'The barber behind every booking',
  mua:                'The makeup artist behind every booking',
  tailor:             'The fashion designer behind every booking',
  photography:        'The photographer behind every booking',
  home_services:      'The professional behind every job',
  tutor:              'The tutor behind every lesson',
  fitness:            'The coach behind every session',
  events:             'The events professional behind every booking',
  private_chef:       'The chef behind every experience',
  content_creator:    'The creator behind every project',
  dj:                 'The DJ behind every event',
  other_professional: 'The professional behind every booking',
  other:              'The professional behind every appointment',
};

// ── Category → emoji ──────────────────────────────────────────────────────────
const CATEGORY_EMOJIS = {
  nails:'💅', lash:'👁️', spa:'🌿', body:'💆', facial:'🧴', massage:'💆',
  waxing:'✨', barber:'✂️', hair:'💇', beard:'🪒', makeup:'💄', bridal:'💍',
  fashion:'👗', alterations:'🧵', portrait:'📸', events:'🎉', plumbing:'🔧',
  electrical:'⚡', cleaning:'🧹', primary:'📚', secondary:'📖', jamb:'✏️',
  waec:'📝', training:'💪', nutrition:'🥗', wellness:'🧘', mc:'🎤', dj:'🎧',
  decoration:'🌸', catering:'🍽️', chef:'👨‍🍳', content:'🎬', music:'🎵',
  other:'✨', general:'✅', photography:'📷',
};

function getSvcEmoji(category, name) {
  const n = (name || '').toLowerCase();
  if (n.includes('gel') || n.includes('nail')) return '💅';
  if (n.includes('lash')) return '👁️';
  if (n.includes('massage')) return '💆';
  if (n.includes('facial')) return '🧴';
  if (n.includes('wax')) return '✨';
  if (n.includes('cut') || n.includes('hair')) return '✂️';
  if (n.includes('makeup') || n.includes('glam')) return '💄';
  if (n.includes('bridal') || n.includes('wedding')) return '💍';
  if (n.includes('photo') || n.includes('portrait')) return '📸';
  if (n.includes('dinner') || n.includes('catering') || n.includes('food')) return '🍽️';
  if (n.includes('train') || n.includes('workout')) return '💪';
  if (n.includes('lesson') || n.includes('jamb') || n.includes('waec')) return '📚';
  return CATEGORY_EMOJIS[category] || '✨';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstName(fullName) {
  return fullName?.trim().split(/\s+/)[0] ?? 'Your artist';
}

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function ownerTitle(type, customType) {
  if (type === 'other_professional') return customType?.trim() || 'Professional';
  return OWNER_TITLES[type] ?? 'Beauty Professional';
}

function ownerBio(type, ownerName, bizName) {
  const first = firstName(ownerName);
  switch (type) {
    case 'nail_studio':      return `Based in Nigeria, ${first} has built a reputation for flawless nail work at ${bizName}. From everyday gel sets to intricate nail art, every client leaves looking and feeling their best.`;
    case 'lash_studio':      return `${first} is a certified lash artist at ${bizName} with a passion for enhancing natural beauty. Whether you want a subtle lift or dramatic volume, every set is crafted with precision and care.`;
    case 'spa':              return `At ${bizName}, ${first} creates a sanctuary where every treatment is a moment of pure relaxation and renewal. With expert hands and a calming presence, your wellness is always the priority.`;
    case 'barbershop':       return `${first} and the team at ${bizName} deliver sharp cuts, clean fades, and precise grooming for every client. Walk in looking good — walk out looking your absolute best.`;
    case 'mua':              return `${first} is a professional makeup artist at ${bizName} who transforms every look with skill and artistry. From natural glam to full bridal, your vision comes to life at every appointment.`;
    case 'tailor':           return `Welcome to ${bizName}. ${first} crafts bespoke outfits for every occasion — from everyday styles to traditional aso-ebi and special events, all made to measure.`;
    case 'photography':      return `Welcome to ${bizName}. ${first} captures your most important moments with professional photography for portraits, events, products, and everything in between.`;
    case 'home_services':    return `Welcome to ${bizName}. ${first} provides reliable home maintenance and repair services including plumbing, electrical, AC, and more — done right the first time.`;
    case 'tutor':            return `Welcome to ${bizName}. ${first} offers personalised tutoring for primary, secondary, and exam-prep students to help them reach their full potential with confidence.`;
    case 'fitness':          return `Welcome to ${bizName}. ${first} helps clients reach their fitness goals with personal training, group classes, and nutrition consultations tailored to individual needs.`;
    case 'events':           return `Welcome to ${bizName}. ${first} makes every event unforgettable with professional MC, DJ, decoration, and catering services — handling every detail so you can enjoy the moment.`;
    case 'private_chef':     return `Welcome to ${bizName}. ${first} brings restaurant-quality dining to your home — from intimate dinner experiences to full-scale event catering, every meal is an occasion.`;
    case 'content_creator':  return `Welcome to ${bizName}. ${first} creates engaging content that tells your brand story across social media and digital platforms — professional, impactful, and always on-brand.`;
    case 'dj':               return `Welcome to ${bizName}. ${first} provides professional DJ services for weddings, parties, clubs, and corporate events — delivering unforgettable audio experiences every time.`;
    case 'other_professional': return `Welcome to ${bizName}. ${first} is dedicated to delivering exceptional professional services tailored to every client. Book an appointment and let's work together.`;
    default: return `${first} at ${bizName} is dedicated to delivering exceptional services tailored to every client. Book an appointment and experience the difference that expert care makes.`;
  }
}

function formatNigerianWhatsApp(raw) {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) digits = digits.slice(3);
  if (digits.startsWith('0'))   digits = digits.slice(1);
  return '234' + digits;
}

function buildWhatsAppUrl(whatsapp, submittedForm) {
  const number = formatNigerianWhatsApp(whatsapp);
  if (!number) return null;
  const { client_name, client_phone, service_name, date, time, ampm, notes } = submittedForm;
  let readableDate = date;
  if (date) {
    const [y, m, d] = date.split('-').map(Number);
    readableDate = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  const lines = [
    '🔔 New Booking Request!', '',
    `Client: ${client_name}`, `Phone: ${client_phone}`,
    `Service: ${service_name}`, `Date: ${readableDate}`, `Time: ${time} ${ampm}`,
  ];
  if (notes?.trim()) lines.push(`Notes: ${notes.trim()}`);
  lines.push('', 'Open your Sabi dashboard to confirm or cancel this booking.');
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const TIME_SLOTS = [
  { label: '8:00 AM',  time: '8:00',  ampm: 'AM' },
  { label: '9:00 AM',  time: '9:00',  ampm: 'AM' },
  { label: '10:00 AM', time: '10:00', ampm: 'AM' },
  { label: '11:00 AM', time: '11:00', ampm: 'AM' },
  { label: '12:00 PM', time: '12:00', ampm: 'PM' },
  { label: '1:00 PM',  time: '1:00',  ampm: 'PM' },
  { label: '2:00 PM',  time: '2:00',  ampm: 'PM' },
  { label: '3:00 PM',  time: '3:00',  ampm: 'PM' },
  { label: '4:00 PM',  time: '4:00',  ampm: 'PM' },
  { label: '5:00 PM',  time: '5:00',  ampm: 'PM' },
  { label: '6:00 PM',  time: '6:00',  ampm: 'PM' },
  { label: '7:00 PM',  time: '7:00',  ampm: 'PM' },
];

// ── Neutral palette constants ─────────────────────────────────────────────────
const N = {
  canvas:    '#FAFAFA',
  white:     '#FFFFFF',
  textDark:  '#0f172a',
  textMuted: '#64748b',
  border:    'rgba(148,163,184,0.35)',
  skeleton:  '#E2E8F0',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PublicView({
  businessId: propBusinessId,
  isOwner           = false,
  showWelcomeBanner = false,
  onWelcomeDismiss,
  onGoToDashboard,
}) {
  const bookingRef = useRef(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const [bannerVisible,   setBannerVisible]   = useState(showWelcomeBanner);
  const [copied,          setCopied]          = useState(false);
  const [sessionUserId,   setSessionUserId]   = useState(null);
  const [business,        setBusiness]        = useState(null);
  const [loadingBiz,      setLoadingBiz]      = useState(true);
  const [services,        setServices]        = useState([]);
  const [gallery,         setGallery]         = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [galleryLoading,  setGalleryLoading]  = useState(true);

  const [form, setForm] = useState({
    client_name: '', client_phone: '', service_name: '',
    price: 0, date: '', time: '', ampm: 'AM', notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [whatsappUrl, setWhatsappUrl] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUserId(session?.user?.id ?? null);
    });
  }, []);

  // Lock body scroll while any drawer is open (prevents iOS background scroll)
  useEffect(() => {
    if (drawerOpen || navDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, navDrawerOpen]);

  useEffect(() => {
    async function loadAll() {
      setBusiness(null); setServices([]); setGallery([]);
      setServicesLoading(true); setGalleryLoading(true); setLoadingBiz(true);

      const cols = 'id,name,owner_name,tagline,business_type,user_id,avatar_url,whatsapp,custom_business_type,subscription_status,plan_expires_at,city,state,slug,avg_rating,rating_count';
      const bizQuery = propBusinessId
        ? supabase.from('businesses').select(cols).eq('id', propBusinessId).single()
        : supabase.from('businesses').select(cols).limit(1).single();

      const { data: biz } = await bizQuery;
      setLoadingBiz(false);
      if (!biz) { setServicesLoading(false); setGalleryLoading(false); return; }
      setBusiness(biz);
      document.title = `${biz.name} — Book on Sabi`;
      const bizOwnerTitle = ownerTitle(biz.business_type, biz.custom_business_type);
      const bizLocation = [biz.city, biz.state].filter(Boolean).join(', ');
      setMetaDescription(
        `Book with ${biz.name}${bizLocation ? ` in ${bizLocation}` : ''} — ${bizOwnerTitle.toLowerCase()} on Sabi. Fast, easy online booking.`
      );

      const [svcRes, galRes] = await Promise.all([
        supabase.from('services').select('id,name,price,category')
          .eq('business_id', biz.id).eq('active', true)
          .order('category').order('name'),
        supabase.from('gallery').select('id,image_url,caption')
          .eq('business_id', biz.id).order('created_at', { ascending: false }),
      ]);
      setServices(svcRes.data || []);
      setServicesLoading(false);
      setGallery(galRes.data || []);
      setGalleryLoading(false);
    }
    loadAll();
    return () => {
      document.title = 'Sabi — Booking Pages for Nigerian Professionals';
      setMetaDescription(
        'Get your own booking page, client dashboard, and earnings tracker. Sabi helps Nigerian professionals look professional and get booked. Nail techs, photographers, tailors, DJs and more.'
      );
    };
  }, [propBusinessId]);

  // ── LocalBusiness JSON-LD structured data ───────────────────────────────────
  useEffect(() => {
    if (!business?.slug) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      image: business.avatar_url || undefined,
      url: `https://sabipro.ng/${business.slug}`,
      telephone: business.whatsapp || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: business.city || undefined,
        addressRegion: business.state || undefined,
        addressCountry: 'NG',
      },
      ...(business.rating_count > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: business.avg_rating,
          reviewCount: business.rating_count,
        },
      } : {}),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, [business]);

  function handleChange(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setFieldErrors(fe => ({ ...fe, [field]: '' }));
    };
  }

  function handleServiceCard(svc) {
    setForm(f => ({ ...f, service_name: svc.name, price: svc.price }));
    setFieldErrors(fe => ({ ...fe, service_name: '' }));
  }

  function handleTimeSlot(time, ampm) {
    setForm(f => ({ ...f, time, ampm }));
    setFieldErrors(fe => ({ ...fe, time: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.client_name.trim())  errors.client_name  = 'Full name is required';
    if (!form.client_phone.trim()) errors.client_phone = 'Phone number is required';
    if (!form.service_name)        errors.service_name = 'Please select a service';
    if (!form.date)                errors.date         = 'Please choose a date';
    if (!form.time.trim())         errors.time         = 'Please select a time';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (!business?.id) { setFormError('Unable to submit. Please refresh and try again.'); return; }
    setFormLoading(true); setFormError('');

    const { error } = await supabase.from('bookings').insert({
      business_id:  business.id,
      client_name:  form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      service_name: form.service_name,
      price:        form.price,
      date:         form.date,
      time:         form.time.trim(),
      ampm:         form.ampm,
      status:       'pending',
      notes:        form.notes.trim(),
    });

    setFormLoading(false);
    if (error) {
      setFormError('Something went wrong. Please try again.');
    } else {
      track('booking_submitted', { service_name: form.service_name, business_id: business.id });
      const snapshot = { ...form };
      setFormSuccess(true);
      setForm({ client_name: '', client_phone: '', service_name: '', price: 0, date: '', time: '', ampm: 'AM', notes: '' });
      const waUrl = buildWhatsAppUrl(business.whatsapp, snapshot);
      if (waUrl) {
        setWhatsappUrl(waUrl);
        setTimeout(() => window.open(waUrl, '_blank', 'noopener,noreferrer'), 1500);
      }
    }
  }

  function handleBannerDismiss() { setBannerVisible(false); onWelcomeDismiss?.(); }

  const bookingLink = typeof window !== 'undefined'
    ? business?.slug
      ? `${window.location.origin}/${business.slug}`
      : `${window.location.origin}/?business=${propBusinessId}`
    : '';
  const isActualOwner = !!sessionUserId && !!business && business.user_id === sessionUserId;
  const today = new Date().toISOString().split('T')[0];

  // ── Waiting on fetch ─────────────────────────────────────────────────────────
  if (loadingBiz) return null;

  const theme    = getBusinessTheme(business?.business_type ?? 'other');
  const location = [business?.city, business?.state].filter(Boolean).join(', ');
  const bizInitial = (business?.name || '?')[0].toUpperCase();
  const whyCards = WHY_CARDS[business?.business_type] ?? DEFAULT_WHY_CARDS;

  // Drawer input base style — neutral light canvas
  const IS = {
    input: {
      background: N.white,
      border: `1px solid ${N.border}`,
      color: N.textDark,
      borderRadius: '12px',
      padding: '12px 16px',
      width: '100%',
      outline: 'none',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '14px',
    },
    inputErr: { borderColor: '#f87171' },
  };

  // ── Subscription gate ────────────────────────────────────────────────────────
  if (business && !isOwner && !isSubscriptionActive(business)) {
    const waNumber = formatNigerianWhatsApp(business.whatsapp);
    return (
      <div className="min-h-screen bg-sabi-dark flex flex-col items-center justify-center px-6 py-10 text-center font-sans">
        <div className="w-12 h-12 bg-sabi-gold rounded-xl flex items-center justify-center font-black text-sabi-dark text-2xl mb-6"
          style={{ fontFamily: 'Georgia,serif' }}>S</div>
        <h1 className="font-serif text-3xl font-medium text-white mb-3">{business.name}</h1>
        <p className="text-sabi-muted text-base font-medium mb-2">This business is temporarily unavailable</p>
        <p className="text-sabi-muted/70 text-sm mb-8 max-w-xs leading-relaxed">Check back soon or contact them directly.</p>
        {waNumber && (
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-6 py-3 rounded-xl no-underline">
            Contact on WhatsApp
          </a>
        )}
        <p className="text-sabi-muted/40 text-xs mt-12">Powered by Sabi</p>
      </div>
    );
  }

  // ── Booking drawer content ────────────────────────────────────────────────────
  const drawerContent = (
    <div className="flex flex-col bg-white" style={{ flex: 1, minHeight: 0 }}>
      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-slate-200">
        <div>
          <h2 className="font-serif text-xl font-semibold text-slate-900">
            Book an Appointment
          </h2>
          {form.service_name && (
            <p className="text-xs mt-0.5 text-slate-500">
              {form.service_name} — ₦{form.price.toLocaleString()}
            </p>
          )}
        </div>
        <button onClick={() => setDrawerOpen(false)}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer border border-slate-200 bg-slate-50 text-slate-400 flex-shrink-0">
          <X size={16} />
        </button>
      </div>

      {formSuccess ? (
        /* Success state — scrollable */
        <div className="flex-1 overflow-y-auto px-5 py-5"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <div className="flex flex-col items-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${theme.primary}18`, border: `2px solid ${theme.primary}` }}>
              <CheckCircle size={32} style={{ color: theme.primary }} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-2xl font-medium text-slate-900">
              Booking Request Sent!
            </h3>
            <p className="text-sm leading-relaxed max-w-xs text-slate-500">
              Your request has been received. The business will confirm your appointment
              via WhatsApp shortly.
            </p>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium no-underline" style={{ color: theme.primary }}>
                Tap here if WhatsApp didn&apos;t open automatically
              </a>
            )}
            <button
              onClick={() => { setFormSuccess(false); setWhatsappUrl(null); setDrawerOpen(false); }}
              className="mt-2 px-6 py-3 rounded-xl font-bold text-sm border-0 cursor-pointer"
              style={{ background: theme.btnBg, color: theme.btnText }}>
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Form — flex column filling remaining space */
        <form onSubmit={handleSubmit} noValidate
          className="flex flex-col"
          style={{ flex: 1, minHeight: 0 }}>

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-5 py-5"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            <div className="flex flex-col gap-5">

              {/* Service */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Service
                </label>
                {servicesLoading ? (
                  <div className="h-12 rounded-xl animate-pulse bg-slate-100" />
                ) : (
                  <select style={{ ...IS.input, appearance: 'none' }} value={form.service_name}
                    onChange={e => {
                      const svc = services.find(s => s.name === e.target.value);
                      setForm(f => ({ ...f, service_name: e.target.value, price: svc?.price ?? 0 }));
                      setFieldErrors(fe => ({ ...fe, service_name: '' }));
                    }}>
                    <option value="">Select a service…</option>
                    {services.map(svc => (
                      <option key={svc.id} value={svc.name}>
                        {svc.name} — ₦{svc.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.service_name && (
                  <span className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={11} />{fieldErrors.service_name}
                  </span>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Preferred Date
                </label>
                <input style={{ ...IS.input, ...(fieldErrors.date ? IS.inputErr : {}) }}
                  type="date" value={form.date} min={today} onChange={handleChange('date')} />
                {fieldErrors.date && (
                  <span className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={11} />{fieldErrors.date}
                  </span>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Preferred Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const active = form.time === slot.time && form.ampm === slot.ampm;
                    return (
                      <button key={slot.label} type="button"
                        onClick={() => handleTimeSlot(slot.time, slot.ampm)}
                        className="py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
                        style={active
                          ? { background: theme.btnBg, color: theme.btnText, borderColor: theme.primary }
                          : { background: N.white, color: N.textMuted, borderColor: N.border }
                        }>
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.time && (
                  <span className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={11} />{fieldErrors.time}
                  </span>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Your Full Name
                </label>
                <input style={{ ...IS.input, ...(fieldErrors.client_name ? IS.inputErr : {}) }}
                  type="text" placeholder="e.g. Adaeze Okonkwo"
                  value={form.client_name} onChange={handleChange('client_name')} />
                {fieldErrors.client_name && (
                  <span className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={11} />{fieldErrors.client_name}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Phone Number
                </label>
                <input style={{ ...IS.input, ...(fieldErrors.client_phone ? IS.inputErr : {}) }}
                  type="text" placeholder="e.g. 08012345678"
                  value={form.client_phone} onChange={handleChange('client_phone')} />
                {fieldErrors.client_phone && (
                  <span className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={11} />{fieldErrors.client_phone}
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Notes{' '}
                  <span className="normal-case tracking-normal font-normal text-slate-300">(optional)</span>
                </label>
                <textarea style={IS.input} rows={3}
                  placeholder="Any special requests or additional information…"
                  value={form.notes} onChange={handleChange('notes')} />
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="flex-shrink-0" />{formError}
                </div>
              )}

            </div>
          </div>

          {/* Sticky footer — submit button always visible */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-4"
            style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
            <button type="submit" disabled={formLoading}
              className="w-full py-4 rounded-xl font-bold text-base border-0 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: theme.btnBg, color: theme.btnText }}>
              {formLoading
                ? <><Loader2 size={16} className="pv-spin" /> Sending Request…</>
                : 'Confirm Booking Request'
              }
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">
              🔒 Your details are secure. Confirmation via WhatsApp.
            </p>
          </div>
        </form>
      )}
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="font-sans bg-[#FAFAFA] min-h-screen">

      {/* ── Welcome banner ─────────────────────────────────────── */}
      {isOwner && bannerVisible && (
        <div className="flex items-center justify-between px-4 py-3 bg-sabi-green/20 border-b border-sabi-green/30">
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={15} className="text-sabi-green flex-shrink-0" />
            <p className="text-sm text-white truncate">
              <strong>Your booking page is live.</strong>{' '}
              Share:{' '}
              <span className="flex items-center gap-2 inline-flex">
                <span className="text-sabi-green">{bookingLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bookingLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-transparent border-0 cursor-pointer hover:opacity-80 p-0 flex-shrink-0"
                  aria-label="Copy link"
                  style={{ color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </span>
            </p>
          </div>
          <button className="ml-3 w-6 h-6 flex items-center justify-center text-sabi-muted hover:text-white bg-transparent border-0 cursor-pointer flex-shrink-0"
            onClick={handleBannerDismiss} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          1. STICKY NAVIGATION HEADER
      ══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 bg-white/90 border-b border-slate-200 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 h-16">

          {/* Business name */}
          <span className="font-serif font-semibold text-lg text-slate-900 truncate max-w-[180px] sm:max-w-xs">
            {business?.name}
          </span>

          {/* Nav anchors — desktop only */}
          <div className="hidden md:flex items-center gap-7">
            {[['#services-section', 'Services'], ['#about-section', 'About'], ['#gallery-section', 'Gallery']].map(([href, label]) => (
              <a key={href} href={href}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 no-underline">
                {label}
              </a>
            ))}
          </div>

          {/* Right: owner dashboard OR visitor hamburger */}
          {isActualOwner ? (
            <button
              className="flex items-center gap-1.5 bg-sabi-dark text-sabi-gold text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-lg"
              onClick={onGoToDashboard}>
              <LayoutDashboard size={13} /> Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => setNavDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 border-0 cursor-pointer transition-colors"
              aria-label="Open menu">
              <Menu size={24} />
            </button>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          2. HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center bg-[#FAFAFA]">

        {/* Very subtle dot texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />

        <div className="relative z-10 max-w-6xl mx-auto w-full px-5 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* ── Left: Headline + CTAs ── */}
          <div className="animate-slide-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
              style={{ background: `${theme.primary}12`, borderColor: `${theme.primary}28`, color: theme.primary }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: theme.primary }} />
              <span className="text-xs font-bold uppercase tracking-widest">
                {ownerTitle(business?.business_type, business?.custom_business_type)}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif font-semibold leading-[1.05] mb-5 text-slate-900"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', whiteSpace: 'pre-line' }}>
              {HERO_HEADLINES[business?.business_type]
                ? HERO_HEADLINES[business?.business_type].replace(/\n/g, '\n')
                : `Welcome to\n${business?.name}`
              }
            </h1>

            {/* Subheadline */}
            <p className="text-base leading-relaxed mb-8 max-w-md text-slate-500">
              {business?.tagline || HERO_SUBS[business?.business_type] || HERO_SUBS.other}
            </p>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 mb-7">
                <MapPin size={13} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-400">{location}</span>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base border-0 cursor-pointer transition-all active:scale-95 hover:opacity-90"
                style={{ background: theme.btnBg, color: theme.btnText }}>
                Book Appointment
              </button>
              <a href="#services-section"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-500 no-underline transition-all hover:border-slate-300 hover:text-slate-700 bg-white">
                Explore Services
                <ChevronDown size={14} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: '⭐', text: '4.9 Rating' },
                { icon: '✅', text: 'Verified Pro' },
                { icon: '🔒', text: 'Secure Booking' },
              ].map(({ icon, text }) => (
                <div key={text}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-500">
                  {icon} {text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Media frame ── */}
          <div className="relative hidden md:block">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60"
              style={{ height: 500, background: N.white }}>

              {gallery.length > 0 ? (
                <img src={gallery[0].image_url} alt={business?.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-white">
                  {business?.avatar_url ? (
                    <img src={business.avatar_url} alt={business.owner_name}
                      className="w-28 h-28 rounded-full object-cover"
                      style={{ border: `3px solid ${theme.primary}` }} />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center font-black text-5xl"
                      style={{ background: `${theme.primary}18`, color: theme.primary, fontFamily: 'Georgia,serif' }}>
                      {bizInitial}
                    </div>
                  )}
                  <p className="font-serif text-2xl font-semibold text-center px-6 text-slate-900">
                    {business?.name}
                  </p>
                  <p className="text-sm text-center px-6 text-slate-400">
                    {ownerTitle(business?.business_type, business?.custom_business_type)}
                  </p>
                </div>
              )}

              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24"
                style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.7), transparent)' }} />
            </div>

            {/* Floating: Accepting Bookings badge */}
            <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-md bg-white border border-slate-200 text-slate-900">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Accepting Bookings
            </div>

            {/* Floating: Services count card */}
            <div className="absolute -bottom-4 -left-4 rounded-2xl px-5 py-3.5 shadow-xl bg-white border border-slate-200">
              <p className="text-xs mb-0.5 text-slate-400">
                {servicesLoading ? 'Services Available' : `${services.length} Service${services.length !== 1 ? 's' : ''} Available`}
              </p>
              <p className="font-serif text-2xl font-bold leading-none" style={{ color: theme.primary }}>
                {servicesLoading ? '…' : `${services.length}+`}
              </p>
            </div>

            {/* Floating: Clients stat card */}
            <div className="absolute -bottom-4 right-8 rounded-2xl px-5 py-3.5 shadow-xl bg-white border border-slate-200">
              <p className="text-xs mb-0.5 text-slate-400">Happy Clients</p>
              <p className="font-serif text-2xl font-bold leading-none" style={{ color: theme.primary }}>
                200+
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <span className="text-xs font-medium text-slate-500">Scroll to explore</span>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. WHY CHOOSE US GRID
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.primary }}>Why us</p>
            <h2 className="font-serif font-medium leading-tight text-slate-900"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
              Why Choose {business?.name}?
            </h2>
          </div>

          {/* 3-column grid */}
          <div className="grid sm:grid-cols-3 gap-5">
            {whyCards.map((card, i) => (
              <div key={i}
                className="rounded-2xl p-6 bg-white border border-slate-200/60 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
                {/* Icon box */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${theme.primary}12` }}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-base mb-2 text-slate-900">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. SERVICES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="services-section" className="py-20 px-5 md:px-8 bg-[#FAFAFA]" ref={bookingRef}>
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.primary }}>What we offer</p>
            <h2 className="font-serif font-medium mb-2 text-slate-900"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
              Our Services
            </h2>
            <p className="text-sm text-slate-500">
              {SERVICE_SUBTITLES[business?.business_type] ?? 'Professional services, every detail attended to'}
            </p>
          </div>

          {/* Service cards */}
          {servicesLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse bg-slate-200" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white border border-slate-200/60">
              <p className="text-base mb-1 font-medium text-slate-900">No services listed yet</p>
              <p className="text-sm text-slate-400">Check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {services.map(svc => {
                const isSelected = form.service_name === svc.name;
                const emoji = getSvcEmoji(svc.category, svc.name);
                return (
                  <div key={svc.id}
                    className="rounded-2xl border transition-all duration-200 overflow-hidden bg-white"
                    style={{
                      borderColor: isSelected ? theme.primary : N.border,
                      boxShadow:   isSelected
                        ? `0 0 0 1px ${theme.primary}, 0 2px 8px rgba(0,0,0,0.06)`
                        : '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                    <div className="flex items-center gap-4 p-5">

                      {/* Icon block */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: isSelected ? `${theme.primary}22` : `${theme.primary}10` }}>
                        {emoji}
                      </div>

                      {/* Info block */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight text-slate-900">
                          {svc.name}
                        </p>
                        {svc.category && (
                          <p className="text-xs mt-0.5 capitalize font-medium text-slate-400">
                            {svc.category}
                          </p>
                        )}
                      </div>

                      {/* Price + Select */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-bold text-base" style={{ color: theme.primary }}>
                          ₦{svc.price.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleServiceCard(svc);
                            if (!isSelected) {
                              setTimeout(() => {
                                document.getElementById('booking-cta-section')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all active:scale-95"
                          style={{
                            background: isSelected ? theme.btnBg : `${theme.primary}14`,
                            color:      isSelected ? theme.btnText : theme.primary,
                          }}>
                          {isSelected ? (
                            <><CheckCircle size={13} /> Selected</>
                          ) : (
                            'Select'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded booking prompt when selected */}
                    {isSelected && (
                      <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-400">
                          Ready to book? Choose your date and time.
                        </p>
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer"
                          style={{ background: theme.btnBg, color: theme.btnText }}>
                          Continue Booking →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {fieldErrors.service_name && (
            <span className="flex items-center gap-1 text-red-400 text-xs mt-3">
              <AlertCircle size={12} />{fieldErrors.service_name}
            </span>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. GALLERY SECTION
      ══════════════════════════════════════════════════════════ */}
      {(galleryLoading || gallery.length > 0) && (
        <section id="gallery-section" className="py-20 px-5 md:px-8 bg-white">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: theme.primary }}>Portfolio</p>
              <h2 className="font-serif font-medium text-slate-900"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
                Our Work
              </h2>
              <p className="text-sm mt-2 text-slate-500">A glimpse of the craft</p>
            </div>

            {galleryLoading ? (
              <div className="columns-2 md:columns-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl mb-3 animate-pulse break-inside-avoid bg-slate-200"
                    style={{ height: 140 + (i % 3) * 50 }} />
                ))}
              </div>
            ) : (
              <div className="columns-2 md:columns-3 gap-3">
                {gallery.map(item => (
                  <div key={item.id}
                    className="rounded-2xl overflow-hidden mb-3 break-inside-avoid group transition-all hover:opacity-95 hover:shadow-xl border border-slate-200/60">
                    <img src={item.image_url} alt={item.caption || 'Portfolio'} loading="lazy"
                      className="w-full block" />
                    {item.caption && (
                      <p className="text-xs px-3 py-2 bg-white text-slate-400">
                        {item.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          6. ABOUT / MEET THE OWNER SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="about-section" className="py-20 px-5 md:px-8 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.primary }}>About</p>
            <h2 className="font-serif font-medium text-slate-900"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
              Meet {firstName(business?.owner_name)}
            </h2>
            <p className="text-sm mt-2 text-slate-500">
              {MEET_SUBTITLES[business?.business_type] ?? 'The professional behind every booking'}
            </p>
          </div>

          {/* Owner profile card */}
          <div className="rounded-3xl overflow-hidden border border-slate-200/60 shadow-md grid md:grid-cols-2">

            {/* Left: avatar + badge */}
            <div className="flex flex-col items-center justify-center p-10 gap-5 bg-gradient-to-br from-slate-50 to-white">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                  {business?.avatar_url ? (
                    <img src={business.avatar_url} alt={business.owner_name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={44} strokeWidth={1} className="text-slate-300" />
                    </div>
                  )}
                </div>
                {/* Verified badge */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ background: theme.primary }}>
                  <Shield size={14} style={{ color: theme.btnText }} />
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold text-base text-slate-900">
                  {business?.owner_name}
                </p>
                <p className="text-xs mt-0.5 font-medium text-slate-400">
                  {ownerTitle(business?.business_type, business?.custom_business_type)}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex gap-5">
                {[
                  ['200+', 'Clients'],
                  [servicesLoading ? '—' : String(services.length), 'Services'],
                  ['3+', 'Years'],
                ].map(([val, lbl]) => (
                  <div key={lbl} className="text-center">
                    <p className="font-serif font-bold text-xl" style={{ color: theme.primary }}>{val}</p>
                    <p className="text-xs text-slate-400">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: bio + CTA */}
            <div className="p-8 md:p-10 flex flex-col justify-center gap-5 bg-white">
              <h3 className="font-serif text-2xl font-medium text-slate-900">
                The Story Behind {business?.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {ownerBio(business?.business_type, business?.owner_name, business?.name)}
              </p>

              {/* Trust bullets */}
              <div className="flex flex-col gap-2 mt-1">
                {[
                  { icon: <CheckCircle size={14} />, text: 'Verified & professional' },
                  { icon: <Star size={14} />, text: '4.9 average client rating' },
                  { icon: <Clock size={14} />, text: 'On-time, every appointment' },
                ].map(({ icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span style={{ color: theme.primary }}>{icon}</span>
                    <span className="text-sm font-medium text-slate-500">{text}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp direct link */}
              {business?.whatsapp && (
                <a href={`https://wa.me/${formatNigerianWhatsApp(business.whatsapp)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 text-slate-500 no-underline transition-all hover:border-slate-300 hover:text-slate-700 bg-white self-start">
                  💬 Message on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. FOOTER BOOKING CTA BAND
      ══════════════════════════════════════════════════════════ */}
      <section id="booking-cta-section" className="py-16 px-5 md:px-8 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif font-semibold mb-3 text-white"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
            Ready to Book Your Appointment?
          </h2>
          <p className="text-sm mb-7 text-white/60">
            Secure your slot in under 2 minutes. Confirmation via WhatsApp.
          </p>
          <button onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base border-0 cursor-pointer transition-all active:scale-95 hover:opacity-90"
            style={{ background: theme.btnBg, color: theme.btnText }}>
            Book Now — It&apos;s Free
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="py-8 px-5 md:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-xs"
              style={{ background: theme.btnBg, color: theme.btnText, fontFamily: 'Georgia,serif' }}>
              {bizInitial}
            </div>
            <span className="font-semibold text-sm text-slate-900">
              {business?.name}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 {business?.name} · Powered by{' '}
            <span className="font-semibold" style={{ color: theme.primary }}>Sabi</span>
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          STICKY BOOKING FOOTER (when service selected, drawer closed)
      ══════════════════════════════════════════════════════════ */}
      {form.service_name && !drawerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 border-t border-slate-200 flex items-center gap-3 animate-slide-up shadow-2xl bg-white">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-slate-900">
              {form.service_name}
            </p>
            {form.price > 0 && (
              <p className="text-xs font-bold" style={{ color: theme.primary }}>
                ₦{form.price.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-sm border-0 cursor-pointer flex-shrink-0 active:scale-95"
            style={{ background: theme.btnBg, color: theme.btnText }}>
            Book Now →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          BOOKING DRAWER (full-height slide-up)
      ══════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop — overflow hidden prevents background scroll on iOS */}
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm overflow-hidden"
            onClick={() => setDrawerOpen(false)} />
          {/* Drawer panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl shadow-2xl bg-white"
            style={{
              maxWidth: 560,
              margin: '0 auto',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
            {drawerContent}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          NAV DRAWER (slide-in from right, visitor only)
      ══════════════════════════════════════════════════════════ */}
      {!isActualOwner && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300 ${navDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setNavDrawerOpen(false)}
          />
          {/* Panel */}
          <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-sabi-dark flex flex-col shadow-2xl transition-transform duration-300 ${navDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
              <span className="font-serif font-semibold text-xl text-white truncate pr-4">
                {business?.name}
              </span>
              <button
                onClick={() => setNavDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0 text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col flex-1 px-4 py-4 overflow-y-auto">
              {[
                { label: 'Services', target: 'services-section' },
                ...(gallery.length > 0 || galleryLoading
                  ? [{ label: 'Gallery', target: 'gallery-section' }]
                  : []),
                { label: 'About', target: 'about-section' },
              ].map(({ label, target }) => (
                <div key={label} className="border-b border-white/10">
                  <button
                    onClick={() => {
                      setNavDrawerOpen(false);
                      setTimeout(() => {
                        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }}
                    className="w-full text-left py-4 px-2 text-white font-medium text-base bg-transparent border-0 cursor-pointer hover:text-sabi-gold transition-colors">
                    {label}
                  </button>
                </div>
              ))}

              {/* Book Appointment — prominent CTA */}
              <button
                onClick={() => {
                  setNavDrawerOpen(false);
                  setTimeout(() => setDrawerOpen(true), 300);
                }}
                className="mt-6 w-full py-4 rounded-xl font-bold text-sm border-0 cursor-pointer"
                style={{ background: theme.btnBg, color: theme.btnText }}>
                Book Appointment
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-white/30 py-5 flex-shrink-0">
              Powered by Sabi
            </p>
          </div>
        </>
      )}

    </div>
  );
}
