import { useState, useEffect } from 'react';
import {
  Calendar, Scissors, Users, Image as ImageIcon,
  LogOut, Plus, Pencil, Trash2, Check, X, Upload, User, Loader2, ChevronDown,
  Settings, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { track } from '../lib/posthog';
import { applyThemeStyle } from '../lib/getBusinessTheme';
import SabiLogo from '../components/SabiLogo';
import { openPaystackPopup } from '../components/PaystackPayment';
import { activateSubscription, isSubscriptionActive, daysUntilExpiry } from '../lib/payments';
import { PRICING } from '../config/pricing';
import './OwnerDashboard.css';

const TABS = [
  { id: 'bookings',  label: 'Bookings',  Icon: Calendar  },
  { id: 'services',  label: 'Services',  Icon: Scissors  },
  { id: 'clients',   label: 'Clients',   Icon: Users     },
  { id: 'gallery',   label: 'Gallery',   Icon: ImageIcon },
  { id: 'settings',  label: 'Settings',  Icon: Settings  },
];

function buildClientWhatsAppUrl(phone, status, booking) {
  // Strip all non-digits, then replace a leading 0 with the Nigeria country code.
  let number = (phone ?? '').replace(/\D/g, '');
  if (number.startsWith('0')) number = '234' + number.slice(1);
  if (!number) return null;

  const { client_name, service_name, date, time, ampm } = booking;

  let readableDate = date ?? '';
  if (date) {
    const [y, m, d] = date.split('-').map(Number);
    readableDate = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  const timeStr = [time, ampm].filter(Boolean).join(' ');

  const message = status === 'confirmed'
    ? [
        '✅ Booking Confirmed!',
        '',
        `Hi ${client_name}, your appointment has been confirmed.`,
        '',
        `Service: ${service_name}`,
        `Date: ${readableDate}`,
        `Time: ${timeStr}`,
        '',
        'We look forward to seeing you! If you need to reschedule, please contact us.',
      ].join('\n')
    : [
        '❌ Booking Update',
        '',
        `Hi ${client_name}, unfortunately we are unable to accommodate your booking on ${readableDate} at ${timeStr}.`,
        '',
        'Please reach out to reschedule at a more convenient time. We apologize for any inconvenience.',
      ].join('\n');

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const CATEGORY_OPTIONS = {
  nail_studio:   [['nails', 'Nails'], ['lash', 'Lash'], ['other', 'Other']],
  lash_studio:   [['lash', 'Lash'], ['nails', 'Nails'], ['other', 'Other']],
  spa:           [['spa', 'Spa'], ['body', 'Body'], ['facial', 'Facial'], ['massage', 'Massage'], ['waxing', 'Waxing'], ['other', 'Other']],
  barbershop:    [['barber', 'Barber'], ['hair', 'Hair'], ['beard', 'Beard'], ['other', 'Other']],
  mua:           [['makeup', 'Makeup'], ['bridal', 'Bridal'], ['other', 'Other']],
  tailor:        [['fashion', 'Fashion'], ['alterations', 'Alterations'], ['other', 'Other']],
  photography:   [['portrait', 'Portrait'], ['events', 'Events'], ['other', 'Other']],
  home_services: [['plumbing', 'Plumbing'], ['electrical', 'Electrical'], ['cleaning', 'Cleaning'], ['other', 'Other']],
  tutor:         [['primary', 'Primary'], ['secondary', 'Secondary'], ['jamb', 'JAMB'], ['waec', 'WAEC'], ['other', 'Other']],
  fitness:       [['training', 'Training'], ['nutrition', 'Nutrition'], ['wellness', 'Wellness'], ['other', 'Other']],
  events:        [['mc', 'MC'], ['dj', 'DJ'], ['decoration', 'Decoration'], ['catering', 'Catering'], ['other', 'Other']],
  other:         [['general', 'General'], ['other', 'Other']],
};

export default function OwnerDashboard({ businessId, onLogout, onViewPublicPage }) {
  const [activeTab, setActiveTab] = useState('bookings');

  // ── Bookings ────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // ── Services ────────────────────────────────────────────
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingService, setAddingService] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: '', category: 'nails', price: '' });
  const [svcError, setSvcError] = useState('');

  // ── Clients ─────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // ── Gallery ─────────────────────────────────────────────
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [imgCaption, setImgCaption] = useState('');
  const [imgError, setImgError] = useState('');
  const [addingImg, setAddingImg] = useState(false);

  // ── Avatar / Profile photo ───────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ── Business type (drives category options) ──────────────
  const [businessType, setBusinessType] = useState('other');

  // ── Subscription ─────────────────────────────────────────
  const [subStatus, setSubStatus]       = useState('inactive');
  const [subExpiresAt, setSubExpiresAt] = useState(null);
  const [bizLoaded, setBizLoaded]       = useState(false); // true once business row is fetched
  const [ownerEmail, setOwnerEmail]     = useState('');
  const [renewalLoading, setRenewalLoading] = useState(false);

  // ── UI state ─────────────────────────────────────────────
  const [showEarningsHistory, setShowEarningsHistory] = useState(false);

  // ── Settings ─────────────────────────────────────────────
  const [settings, setSettings] = useState({ name: '', owner_name: '', tagline: '', whatsapp: '', pin: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // ── Computed ─────────────────────────────────────────────
  const categoryOptions = CATEGORY_OPTIONS[businessType] ?? CATEGORY_OPTIONS.other;

  // Use local clock so dates match what the client enters in date pickers.
  // new Date().toISOString() is UTC and drifts by 1 h in WAT (Nigeria),
  // causing the month prefix to be wrong from midnight–1 am.
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'

  const confirmed = bookings.filter(b => b.status === 'confirmed');

  const todayEarnings = confirmed
    .filter(b => b.date === today)
    .reduce((s, b) => s + (b.price || 0), 0);

  const monthlyEarnings = confirmed
    .filter(b => typeof b.date === 'string' && b.date.startsWith(currentMonth))
    .reduce((s, b) => s + (b.price || 0), 0);

  const lifetimeEarnings = confirmed
    .reduce((s, b) => s + (b.price || 0), 0);

  // Last 6 calendar months newest-first, each with a YYYY-MM prefix and display label
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(_now.getFullYear(), _now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { prefix, label };
  });

  const earningsByMonth = last6Months.map(({ prefix, label }) => ({
    prefix,
    label,
    total: confirmed
      .filter(b => typeof b.date === 'string' && b.date.startsWith(prefix))
      .reduce((s, b) => s + (b.price || 0), 0),
  }));

  const todayBookings = [...bookings]
    .filter(b => b.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // ── Owner email (needed for Paystack) ───────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setOwnerEmail(session.user.email);
    });
  }, []);

  // ── Subscription helpers ─────────────────────────────────
  // Guard with bizLoaded so the overlay/banner never appears before the
  // business row has been fetched — otherwise subStatus starts 'inactive'
  // and the "plan expired" modal flashes on every dashboard load.
  const subBizSnap = { subscription_status: subStatus, plan_expires_at: subExpiresAt };
  const subActive  = isSubscriptionActive(subBizSnap);
  const daysLeft   = daysUntilExpiry(subBizSnap);
  const showRenewalBanner  = bizLoaded && subActive && daysLeft <= 7;
  const showExpiredOverlay = bizLoaded && !subActive;

  async function handleRenew() {
    if (!businessId || !ownerEmail) return;
    setRenewalLoading(true);
    openPaystackPopup({
      email:      ownerEmail,
      businessId,
      onSuccess: async (response) => {
        try {
          await activateSubscription(businessId, response.reference);
          // Refresh subscription state
          const { data: biz } = await supabase
            .from('businesses')
            .select('subscription_status, plan_expires_at')
            .eq('id', businessId)
            .single();
          if (biz) {
            setSubStatus(biz.subscription_status ?? 'inactive');
            setSubExpiresAt(biz.plan_expires_at ?? null);
          }
        } catch (err) {
          console.error('[OwnerDashboard] renewal activation failed:', err);
        } finally {
          setRenewalLoading(false);
        }
      },
      onClose: () => setRenewalLoading(false),
    });
  }

  // ── Load & subscribe ─────────────────────────────────────
  useEffect(() => {
    if (!businessId) return;

    async function loadAll() {
      const [bRes, sRes, cRes, gRes, bizRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('business_id', businessId).order('category').order('name'),
        supabase.from('clients').select('*').eq('business_id', businessId).order('visit_count', { ascending: false }),
        supabase.from('gallery').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
        supabase.from('businesses').select('avatar_url, business_type, name, owner_name, tagline, whatsapp, pin, subscription_status, plan_expires_at').eq('id', businessId).single(),
      ]);
      setBookings(bRes.data || []);
      setBookingsLoading(false);
      setServices(sRes.data || []);
      setServicesLoading(false);
      setClients(cRes.data || []);
      setClientsLoading(false);
      setGallery(gRes.data || []);
      setGalleryLoading(false);
      if (bizRes.data) {
        const biz = bizRes.data;
        if (biz.avatar_url) setAvatarUrl(biz.avatar_url);
        if (biz.business_type) {
          setBusinessType(biz.business_type);
          const firstCat = (CATEGORY_OPTIONS[biz.business_type] ?? CATEGORY_OPTIONS.other)[0][0];
          setNewSvc(s => ({ ...s, category: firstCat }));
        }
        setSettings({
          name:       biz.name       ?? '',
          owner_name: biz.owner_name ?? '',
          tagline:    biz.tagline    ?? '',
          whatsapp:   biz.whatsapp   ?? '',
          pin:        biz.pin        ?? '',
        });
        setSubStatus(biz.subscription_status ?? 'inactive');
        setSubExpiresAt(biz.plan_expires_at ?? null);
        setBizLoaded(true); // subscription state is now accurate; safe to show overlay/banner
      }
    }

    loadAll();

    const channel = supabase
      .channel(`bookings-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `business_id=eq.${businessId}` },
        (payload) => setBookings(prev => [payload.new, ...prev])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [businessId]);

  // ── Booking actions ──────────────────────────────────────
  async function setBookingStatus(id, status) {
    const booking = bookings.find(b => b.id === id);
    const original = booking?.status;
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));

    const { error: bookingErr } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (bookingErr) {
      console.error('[setBookingStatus] booking update failed:', bookingErr.code, bookingErr.message);
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: original } : b));
      return;
    }

    // Notify the client via WhatsApp for both confirmed and cancelled
    if (booking && (status === 'confirmed' || status === 'cancelled')) {
      const waUrl = buildClientWhatsAppUrl(booking.client_phone, status, booking);
      if (waUrl) setTimeout(() => window.open(waUrl, '_blank', 'noopener,noreferrer'), 1000);
    }

    if (status !== 'confirmed' || !booking) return;

    track('booking_confirmed', { booking_id: id, business_id: businessId });

    const { client_name, client_phone, service_name, date } = booking;
    console.log('[ClientUpsert] confirmed booking →', { client_name, client_phone, service_name, date, businessId });

    const initials = (client_name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');

    const { data: existing, error: selectErr } = await supabase
      .from('clients')
      .select('id, visit_count')
      .eq('business_id', businessId)
      .eq('name', client_name)
      .eq('phone', client_phone)
      .maybeSingle();

    if (selectErr) {
      console.error('[ClientUpsert] select failed:', selectErr.code, selectErr.message);
    }

    if (existing) {
      const updated = {
        visit_count: (existing.visit_count || 1) + 1,
        last_service: service_name,
        last_visit: date,
      };
      const { error: updateErr } = await supabase
        .from('clients')
        .update(updated)
        .eq('id', existing.id);
      if (updateErr) {
        console.error('[ClientUpsert] update failed:', updateErr.code, updateErr.message);
      } else {
        setClients(cs => cs.map(c => c.id === existing.id ? { ...c, ...updated } : c));
      }
    } else {
      console.log('[ClientUpsert] no existing client — inserting new row');
      const { data: newClient, error: insertErr } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          name: client_name,
          phone: client_phone,
          initials,
          visit_count: 1,
          last_service: service_name,
          last_visit: date,
        })
        .select()
        .single();
      if (insertErr) {
        console.error('[ClientUpsert] insert failed:', insertErr.code, insertErr.message, insertErr.details, insertErr.hint);
      } else if (newClient) {
        console.log('[ClientUpsert] inserted:', newClient);
        setClients(cs => [newClient, ...cs]);
      }
    }
  }

  async function removeBooking(id) {
    const backup = bookings.find(b => b.id === id);
    setBookings(bs => bs.filter(b => b.id !== id));
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error && backup) setBookings(bs => [backup, ...bs]);
  }

  // ── Service actions ──────────────────────────────────────
  function startEdit(svc) {
    setEditingId(svc.id);
    setEditDraft({ name: svc.name, category: svc.category, price: String(svc.price) });
  }

  async function saveEdit(id) {
    const price = parseInt(editDraft.price, 10);
    if (!editDraft.name?.trim() || isNaN(price) || price <= 0) return;
    const patch = { name: editDraft.name.trim(), category: editDraft.category, price };
    setServices(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s));
    setEditingId(null);
    await supabase.from('services').update(patch).eq('id', id);
  }

  async function toggleActive(id, current) {
    setServices(ss => ss.map(s => s.id === id ? { ...s, active: !current } : s));
    await supabase.from('services').update({ active: !current }).eq('id', id);
  }

  async function removeService(id) {
    setServices(ss => ss.filter(s => s.id !== id));
    await supabase.from('services').delete().eq('id', id);
  }

  async function submitNewService() {
    setSvcError('');
    const price = parseInt(newSvc.price, 10);
    if (!newSvc.name.trim()) return setSvcError('Service name is required');
    if (isNaN(price) || price <= 0) return setSvcError('Enter a valid price');

    const { data, error } = await supabase
      .from('services')
      .insert({ business_id: businessId, name: newSvc.name.trim(), category: newSvc.category, price, active: true })
      .select()
      .single();

    if (error) return setSvcError('Could not save service');
    track('service_added', { service_name: data.name, category: data.category, business_id: businessId });
    setServices(ss => [...ss, data]);
    setNewSvc({ name: '', category: categoryOptions[0][0], price: '' });
    setAddingService(false);
  }

  // ── Gallery actions ──────────────────────────────────────
  async function uploadGalleryImage(file) {
    if (!file) return;
    setImgError('');
    if (!file.type.startsWith('image/')) {
      setImgError('Only image files are allowed');
      return;
    }
    setAddingImg(true);
    const ext = file.name.split('.').pop();
    const path = `${businessId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) {
      setImgError('Upload failed. Please try again.');
      setAddingImg(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path);
    const { data, error } = await supabase
      .from('gallery')
      .insert({ business_id: businessId, image_url: publicUrl, caption: imgCaption.trim() || null })
      .select()
      .single();
    setAddingImg(false);
    if (error) { setImgError('Could not save image'); return; }
    track('gallery_uploaded', { business_id: businessId });
    setGallery(gs => [data, ...gs]);
    setImgCaption('');
  }

  async function removeImage(id) {
    setGallery(gs => gs.filter(g => g.id !== id));
    await supabase.from('gallery').delete().eq('id', id);
  }

  // ── Avatar actions ────────────────────────────────────────
  async function uploadAvatar(file) {
    if (!file) return;
    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Only image files are allowed');
      return;
    }
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${businessId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (uploadError) {
      setAvatarError('Upload failed. Please try again.');
      setAvatarUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('businesses').update({ avatar_url: publicUrl }).eq('id', businessId);
    track('avatar_uploaded', { business_id: businessId });
    setAvatarUrl(publicUrl);
    setAvatarUploading(false);
  }

  // ── Settings actions ─────────────────────────────────────
  async function saveSettings() {
    setSettingsError('');
    setSettingsSuccess(false);
    if (!settings.name.trim()) {
      setSettingsError('Business name is required');
      return;
    }
    setSettingsSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({
        name:       settings.name.trim(),
        owner_name: settings.owner_name.trim(),
        tagline:    settings.tagline.trim(),
        whatsapp:   settings.whatsapp.trim(),
        pin:        settings.pin.trim(),
      })
      .eq('id', businessId);
    setSettingsSaving(false);
    if (error) {
      setSettingsError('Failed to save changes. Please try again.');
    } else {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3500);
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  function fmtDate(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function fmtMoney(n) {
    return '₦' + (n || 0).toLocaleString();
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="od-root" style={applyThemeStyle(businessType)}>

      {/* ── Expired subscription overlay ─────────────────────── */}
      {showExpiredOverlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(10,46,26,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            width: '100%', maxWidth: 400,
            background: '#0F3D22', border: '1px solid rgba(76,175,114,0.2)',
            borderRadius: 12, padding: '36px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
          }}>
            <SabiLogo size="md" dark={true} />
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 500, color: '#fff', textAlign: 'center', marginTop: 20, marginBottom: 10 }}>
              Your Sabi plan has expired
            </h2>
            <p style={{ fontSize: 14, color: '#7AAE90', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              Renew now to reactivate your booking page and continue accepting bookings.
            </p>
            <div style={{ width: '100%', background: '#0A2E1A', border: '1px solid rgba(76,175,114,0.15)', borderRadius: 8, padding: '20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#7AAE90', textDecoration: 'line-through' }}>₦{PRICING.fullPrice.toLocaleString()}/yr</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: '#F5C842' }}>₦{PRICING.promoPrice.toLocaleString()}<span style={{ fontSize: 14, color: '#7AAE90', fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>/yr</span></span>
              </div>
              <p style={{ fontSize: 11, color: '#7AAE90', margin: 0 }}>{PRICING.promoNote}</p>
            </div>
            <button
              style={{ width: '100%', background: '#F5C842', color: '#0A2E1A', fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, padding: '14px', border: 'none', borderRadius: 6, cursor: renewalLoading ? 'not-allowed' : 'pointer', opacity: renewalLoading ? 0.7 : 1 }}
              onClick={handleRenew}
              disabled={renewalLoading}
            >
              {renewalLoading ? 'Opening payment…' : `Renew for ₦${PRICING.promoPrice.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Expiring-soon renewal banner ─────────────────────── */}
      {showRenewalBanner && (
        <div style={{
          background: '#F5C842', padding: '11px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          fontFamily: "'DM Sans', sans-serif", flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0A2E1A', margin: 0 }}>
            ⚠️ Your Sabi plan expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> — Renew now to keep your booking page live.
          </p>
          <button
            style={{ background: '#0A2E1A', color: '#F5C842', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={handleRenew}
            disabled={renewalLoading}
          >
            {renewalLoading ? 'Opening…' : 'Renew Now'}
          </button>
        </div>
      )}

      <header className="od-header">
        <div className="od-header-top">
          <button className="od-brand" onClick={onViewPublicPage}>
            <SabiLogo size="md" dark={false} />
          </button>
          <div className="od-header-actions">
            <button className="od-logout" onClick={onLogout}>
              <LogOut size={15} strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </div>
        <div className="od-tabs-bar">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`od-tab${activeTab === id ? ' od-tab--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="od-main">
        <div className="od-content">

          {/* ─────────── BOOKINGS ─────────── */}
          {activeTab === 'bookings' && (
            <div className="od-panel">

              {/* Profile photo card */}
              <div className="od-avatar-card">
                <div className="od-avatar-circle">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profile" className="od-avatar-img" />
                    : <User size={28} strokeWidth={1.25} className="od-avatar-placeholder-icon" />
                  }
                  {avatarUploading && (
                    <div className="od-avatar-overlay">
                      <Loader2 size={18} className="od-spin" />
                    </div>
                  )}
                </div>
                <div className="od-avatar-info">
                  <p className="od-avatar-label">Profile Photo</p>
                  <label className={`od-avatar-upload-btn${avatarUploading ? ' od-avatar-upload-btn--loading' : ''}`}>
                    {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={avatarUploading}
                      onChange={e => uploadAvatar(e.target.files[0])}
                    />
                  </label>
                  {avatarError && <p className="od-inline-error">{avatarError}</p>}
                </div>
              </div>

              <div className="od-stats-row">
                <div className="od-stat-card">
                  <p className="od-stat-label">Today&rsquo;s Earnings</p>
                  <p className="od-stat-value">{fmtMoney(todayEarnings)}</p>
                  <p className="od-stat-meta">
                    {todayBookings.filter(b => b.status === 'confirmed').length} confirmed today
                  </p>
                </div>
                <div className="od-stat-card od-stat-card--accent">
                  <p className="od-stat-label">Monthly Earnings</p>
                  <p className="od-stat-value">{fmtMoney(monthlyEarnings)}</p>
                  <p className="od-stat-meta">
                    {confirmed.filter(b => typeof b.date === 'string' && b.date.startsWith(currentMonth)).length} confirmed this month
                  </p>
                </div>
              </div>

              {/* Earnings Summary — collapsible */}
              <div className="od-section">
                <button
                  className="od-earnings-toggle"
                  onClick={() => setShowEarningsHistory(v => !v)}
                  aria-expanded={showEarningsHistory}
                >
                  <span className="od-section-title">Earnings Summary</span>
                  <ChevronDown
                    size={14}
                    className={`od-chevron${showEarningsHistory ? ' od-chevron--open' : ''}`}
                  />
                </button>

                {showEarningsHistory && (
                  <div className="od-earnings-panel">
                    <div className="od-earnings-lifetime">
                      <span className="od-earnings-lifetime-label">Lifetime Earnings</span>
                      <span className="od-earnings-lifetime-value">{fmtMoney(lifetimeEarnings)}</span>
                    </div>
                    <div className="od-earnings-month-list">
                      {earningsByMonth.map(({ prefix, label, total }) => (
                        <div
                          key={prefix}
                          className={`od-earnings-month-row${prefix === currentMonth ? ' od-earnings-month-row--current' : ''}`}
                        >
                          <span className="od-earnings-month-name">{label}</span>
                          <span className="od-earnings-month-total">{fmtMoney(total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="od-section">
                <div className="od-section-head">
                  <h3 className="od-section-title">Today</h3>
                  {todayBookings.length > 0 && (
                    <span className="od-pill">{todayBookings.length}</span>
                  )}
                </div>
                {bookingsLoading ? (
                  <SkeletonList count={2} />
                ) : todayBookings.length === 0 ? (
                  <EmptyState icon={<Calendar size={28} strokeWidth={1} />} text="No appointments today" />
                ) : (
                  <div className="od-booking-list">
                    {todayBookings.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onStatus={setBookingStatus}
                        onDelete={removeBooking}
                        fmtDate={fmtDate}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="od-section">
                <div className="od-section-head">
                  <h3 className="od-section-title">All Bookings</h3>
                  {bookings.length > 0 && (
                    <span className="od-pill">{bookings.length}</span>
                  )}
                </div>
                {bookingsLoading ? (
                  <SkeletonList count={4} />
                ) : bookings.length === 0 ? (
                  <EmptyState icon={<Calendar size={28} strokeWidth={1} />} text="No bookings yet" />
                ) : (
                  <div className="od-booking-list">
                    {bookings.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onStatus={setBookingStatus}
                        onDelete={removeBooking}
                        fmtDate={fmtDate}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────── SERVICES ─────────── */}
          {activeTab === 'services' && (
            <div className="od-panel">
              <div className="od-panel-head">
                <h3 className="od-panel-title">Services</h3>
                {!addingService && (
                  <button className="od-add-btn" onClick={() => { setAddingService(true); setSvcError(''); }}>
                    <Plus size={13} />
                    Add Service
                  </button>
                )}
              </div>

              {addingService && (
                <div className="od-add-form">
                  <input
                    className="od-input"
                    placeholder="Service name"
                    value={newSvc.name}
                    autoFocus
                    onChange={e => { setNewSvc(n => ({ ...n, name: e.target.value })); setSvcError(''); }}
                  />
                  <select
                    className="od-select"
                    value={newSvc.category}
                    onChange={e => setNewSvc(n => ({ ...n, category: e.target.value }))}
                  >
                    {categoryOptions.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <input
                    className="od-input od-input--price"
                    placeholder="Price (₦)"
                    type="number"
                    min="0"
                    value={newSvc.price}
                    onChange={e => { setNewSvc(n => ({ ...n, price: e.target.value })); setSvcError(''); }}
                  />
                  <div className="od-add-form-row">
                    {svcError && <span className="od-inline-error">{svcError}</span>}
                    <button className="od-save-btn" onClick={submitNewService}>Save</button>
                    <button
                      className="od-ghost-btn"
                      onClick={() => { setAddingService(false); setSvcError(''); setNewSvc({ name: '', category: categoryOptions[0][0], price: '' }); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {servicesLoading ? (
                <SkeletonList count={7} height={48} />
              ) : (
                <div className="od-table-wrap">
                  <table className="od-table">
                    <thead>
                      <tr>
                        <th className="od-th">Service</th>
                        <th className="od-th">Category</th>
                        <th className="od-th">Price</th>
                        <th className="od-th">Active</th>
                        <th className="od-th od-th--end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map(svc => {
                        const isEditing = editingId === svc.id;
                        return (
                          <tr key={svc.id} className={`od-tr${isEditing ? ' od-tr--editing' : ''}`}>
                            <td className="od-td">
                              {isEditing ? (
                                <input
                                  className="od-input od-input--sm"
                                  value={editDraft.name}
                                  autoFocus
                                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(svc.id); if (e.key === 'Escape') setEditingId(null); }}
                                />
                              ) : (
                                <span className="od-svc-name">{svc.name}</span>
                              )}
                            </td>
                            <td className="od-td">
                              {isEditing ? (
                                <select
                                  className="od-select od-select--sm"
                                  value={editDraft.category}
                                  onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))}
                                >
                                  {categoryOptions.map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`od-cat-tag od-cat-tag--${svc.category}`}>{svc.category}</span>
                              )}
                            </td>
                            <td className="od-td">
                              {isEditing ? (
                                <input
                                  className="od-input od-input--sm od-input--price"
                                  type="number"
                                  min="0"
                                  value={editDraft.price}
                                  onChange={e => setEditDraft(d => ({ ...d, price: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(svc.id); if (e.key === 'Escape') setEditingId(null); }}
                                />
                              ) : (
                                <span className="od-price">&#8358;{svc.price.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="od-td">
                              <button
                                className={`od-toggle${svc.active ? ' od-toggle--on' : ''}`}
                                onClick={() => toggleActive(svc.id, svc.active)}
                                title={svc.active ? 'Active' : 'Inactive'}
                              >
                                <span className="od-toggle-knob" />
                              </button>
                            </td>
                            <td className="od-td od-td--end">
                              {isEditing ? (
                                <>
                                  <button className="od-icon-btn od-icon-btn--confirm" onClick={() => saveEdit(svc.id)} title="Save"><Check size={14} /></button>
                                  <button className="od-icon-btn od-icon-btn--neutral" onClick={() => setEditingId(null)} title="Cancel"><X size={14} /></button>
                                </>
                              ) : (
                                <>
                                  <button className="od-icon-btn" onClick={() => startEdit(svc)} title="Edit"><Pencil size={13} /></button>
                                  <button className="od-icon-btn od-icon-btn--danger" onClick={() => removeService(svc.id)} title="Delete"><Trash2 size={13} /></button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {services.length === 0 && !servicesLoading && (
                    <EmptyState icon={<Scissors size={28} strokeWidth={1} />} text="No services yet" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─────────── CLIENTS ─────────── */}
          {activeTab === 'clients' && (
            <div className="od-panel">
              <div className="od-panel-head">
                <h3 className="od-panel-title">Clients</h3>
                {clients.length > 0 && (
                  <span className="od-pill">{clients.length} total</span>
                )}
              </div>

              {clientsLoading ? (
                <SkeletonList count={5} height={68} />
              ) : clients.length === 0 ? (
                <EmptyState icon={<Users size={28} strokeWidth={1} />} text="No clients yet" />
              ) : (
                <div className="od-client-list">
                  {clients.map(c => (
                    <div key={c.id} className="od-client-row">
                      <div className="od-client-avatar">
                        {c.initials || '?'}
                      </div>
                      <div className="od-client-info">
                        <p className="od-client-name">{c.name}</p>
                        <p className="od-client-phone">{c.phone}</p>
                      </div>
                      <div className="od-client-meta">
                        <p className="od-client-last-svc">{c.last_service || '—'}</p>
                        <p className="od-client-last-date">{fmtDate(c.last_visit)}</p>
                      </div>
                      <div className="od-visit-badge">
                        <span className="od-visit-count">{c.visit_count}</span>
                        <span className="od-visit-label">visits</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────── GALLERY ─────────── */}
          {activeTab === 'gallery' && (
            <div className="od-panel">
              <div className="od-panel-head">
                <h3 className="od-panel-title">Gallery</h3>
                {gallery.length > 0 && (
                  <span className="od-pill">{gallery.length} images</span>
                )}
              </div>

              <div className="od-gallery-add-form">
                <label className={`od-gallery-upload-btn${addingImg ? ' od-gallery-upload-btn--loading' : ''}`}>
                  <Upload size={13} />
                  {addingImg ? 'Uploading…' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={addingImg}
                    onChange={e => { setImgError(''); uploadGalleryImage(e.target.files[0]); e.target.value = ''; }}
                  />
                </label>
                <input
                  className="od-input od-input--full"
                  placeholder="Caption (optional)"
                  value={imgCaption}
                  onChange={e => setImgCaption(e.target.value)}
                />
                {imgError && <p className="od-inline-error">{imgError}</p>}
              </div>

              {galleryLoading ? (
                <div className="od-gallery-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="od-skeleton od-skeleton--gallery" />
                  ))}
                </div>
              ) : gallery.length === 0 ? (
                <EmptyState icon={<ImageIcon size={28} strokeWidth={1} />} text="No images yet" />
              ) : (
                <div className="od-gallery-grid">
                  {gallery.map(img => (
                    <div key={img.id} className="od-gallery-item">
                      <img src={img.image_url} alt={img.caption || 'Gallery'} loading="lazy" />
                      {img.caption && <p className="od-gallery-caption">{img.caption}</p>}
                      <button
                        className="od-gallery-delete"
                        onClick={() => removeImage(img.id)}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────── SETTINGS ─────────── */}
          {activeTab === 'settings' && (
            <div className="od-panel">
              <div className="od-panel-head">
                <h3 className="od-panel-title">Business Settings</h3>
              </div>

              <div className="od-settings-card">
                <div className="od-settings-field">
                  <label className="od-settings-label">Business Name</label>
                  <input
                    className="od-input od-input--full"
                    value={settings.name}
                    placeholder="e.g. Chi's Nail Studio"
                    onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <div className="od-settings-field">
                  <label className="od-settings-label">Owner Full Name</label>
                  <input
                    className="od-input od-input--full"
                    value={settings.owner_name}
                    placeholder="Your full name"
                    onChange={e => setSettings(s => ({ ...s, owner_name: e.target.value }))}
                  />
                </div>

                <div className="od-settings-field">
                  <label className="od-settings-label">
                    Tagline
                    <span className="od-settings-hint">Shown on your public booking page</span>
                  </label>
                  <input
                    className="od-input od-input--full"
                    value={settings.tagline}
                    placeholder="e.g. Nail Technician · Lagos, Nigeria"
                    onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))}
                  />
                </div>

                <div className="od-settings-field">
                  <label className="od-settings-label">
                    WhatsApp Number
                    <span className="od-settings-hint">Used to confirm bookings with clients</span>
                  </label>
                  <input
                    className="od-input od-input--full"
                    value={settings.whatsapp}
                    placeholder="e.g. 2348012345678"
                    onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))}
                  />
                </div>

                <div className="od-settings-field">
                  <label className="od-settings-label">
                    Dashboard PIN
                    <span className="od-settings-hint">Used to log into your dashboard</span>
                  </label>
                  <div className="od-settings-pin-wrap">
                    <input
                      className="od-input od-input--full"
                      type={showPin ? 'text' : 'password'}
                      value={settings.pin}
                      placeholder="Enter PIN"
                      onChange={e => setSettings(s => ({ ...s, pin: e.target.value }))}
                    />
                    <button
                      className="od-settings-pin-toggle"
                      type="button"
                      onClick={() => setShowPin(v => !v)}
                      title={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {settingsError && (
                  <p className="od-settings-feedback od-settings-feedback--error">{settingsError}</p>
                )}
                {settingsSuccess && (
                  <p className="od-settings-feedback od-settings-feedback--success">
                    <Check size={13} strokeWidth={2.5} />
                    Changes saved successfully
                  </p>
                )}

                <button
                  className="od-settings-save-btn"
                  onClick={saveSettings}
                  disabled={settingsSaving}
                >
                  {settingsSaving
                    ? <><Loader2 size={14} className="od-spin" /> Saving…</>
                    : 'Save Changes'
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────

function SkeletonList({ count = 4, height = 80 }) {
  return (
    <div className="od-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="od-skeleton" style={{ height }} />
      ))}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="od-empty">
      <span className="od-empty-icon">{icon}</span>
      <p className="od-empty-text">{text}</p>
    </div>
  );
}

function BookingCard({ booking, onStatus, onDelete, fmtDate }) {
  const { id, client_name, client_phone, service_name, price, date, time, ampm, status, notes } = booking;

  return (
    <div className={`od-booking-card od-booking-card--${status}`}>
      <div className="od-booking-top">
        <div className="od-booking-client">
          <p className="od-booking-name">{client_name}</p>
          <p className="od-booking-phone">{client_phone}</p>
        </div>
        <span className={`od-badge od-badge--${status}`}>{status}</span>
      </div>

      <div className="od-booking-info">
        <span className="od-booking-service">{service_name}</span>
        <span className="od-booking-sep">·</span>
        <span className="od-booking-price">&#8358;{(price || 0).toLocaleString()}</span>
        <span className="od-booking-sep">·</span>
        <span className="od-booking-dt">{fmtDate(date)}{time ? ` · ${time} ${ampm}` : ''}</span>
      </div>

      {notes && <p className="od-booking-notes">{notes}</p>}

      <div className="od-booking-actions">
        {status === 'pending' && (
          <button className="od-action-btn od-action-btn--confirm" onClick={() => onStatus(id, 'confirmed')}>
            <Check size={12} />
            Confirm
          </button>
        )}
        {status !== 'cancelled' && (
          <button className="od-action-btn od-action-btn--cancel" onClick={() => onStatus(id, 'cancelled')}>
            <X size={12} />
            Cancel
          </button>
        )}
        {status === 'cancelled' && (
          <button className="od-action-btn" onClick={() => onStatus(id, 'pending')}>
            Restore
          </button>
        )}
        <button className="od-action-btn od-action-btn--delete" onClick={() => onDelete(id)}>
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}
