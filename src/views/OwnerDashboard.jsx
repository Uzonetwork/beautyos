import { useState, useEffect } from 'react';
import {
  Calendar, Scissors, Users, Image as ImageIcon,
  LogOut, Plus, Pencil, Trash2, Check, X, Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './OwnerDashboard.css';

const TABS = [
  { id: 'bookings',  label: 'Bookings',  Icon: Calendar  },
  { id: 'services',  label: 'Services',  Icon: Scissors  },
  { id: 'clients',   label: 'Clients',   Icon: Users     },
  { id: 'gallery',   label: 'Gallery',   Icon: ImageIcon },
];

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
  const [newImg, setNewImg] = useState({ url: '', caption: '' });
  const [imgError, setImgError] = useState('');
  const [addingImg, setAddingImg] = useState(false);

  // ── Computed ─────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);

  const todayEarnings = bookings
    .filter(b => b.date === today && b.status === 'confirmed')
    .reduce((s, b) => s + (b.price || 0), 0);

  const monthlyEarnings = bookings
    .filter(b => typeof b.date === 'string' && b.date.startsWith(currentMonth) && b.status === 'confirmed')
    .reduce((s, b) => s + (b.price || 0), 0);

  const todayBookings = [...bookings]
    .filter(b => b.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // ── Load & subscribe ─────────────────────────────────────
  useEffect(() => {
    if (!businessId) return;

    async function loadAll() {
      const [bRes, sRes, cRes, gRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('business_id', businessId).order('category').order('name'),
        supabase.from('clients').select('*').eq('business_id', businessId).order('visit_count', { ascending: false }),
        supabase.from('gallery').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
      ]);
      setBookings(bRes.data || []);
      setBookingsLoading(false);
      setServices(sRes.data || []);
      setServicesLoading(false);
      setClients(cRes.data || []);
      setClientsLoading(false);
      setGallery(gRes.data || []);
      setGalleryLoading(false);
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
    const original = bookings.find(b => b.id === id)?.status;
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) setBookings(bs => bs.map(b => b.id === id ? { ...b, status: original } : b));
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
    setServices(ss => [...ss, data]);
    setNewSvc({ name: '', category: 'nails', price: '' });
    setAddingService(false);
  }

  // ── Gallery actions ──────────────────────────────────────
  async function submitNewImage() {
    setImgError('');
    if (!newImg.url.trim()) return setImgError('Image URL is required');
    setAddingImg(true);

    const { data, error } = await supabase
      .from('gallery')
      .insert({ business_id: businessId, image_url: newImg.url.trim(), caption: newImg.caption.trim() || null })
      .select()
      .single();

    setAddingImg(false);
    if (error) return setImgError('Could not add image');
    setGallery(gs => [data, ...gs]);
    setNewImg({ url: '', caption: '' });
  }

  async function removeImage(id) {
    setGallery(gs => gs.filter(g => g.id !== id));
    await supabase.from('gallery').delete().eq('id', id);
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
    <div className="od-root">
      <header className="od-header">
        <div className="od-header-top">
          <button className="od-brand" onClick={onViewPublicPage}>BeautyOS</button>
          <div className="od-header-actions">
            <button className="od-view-page-btn" onClick={onViewPublicPage}>
              <Globe size={14} strokeWidth={1.75} />
              View Public Page
            </button>
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
                    {bookings.filter(b => b.date?.startsWith(currentMonth) && b.status === 'confirmed').length} this month
                  </p>
                </div>
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
                    <option value="nails">Nails</option>
                    <option value="lash">Lash</option>
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
                      onClick={() => { setAddingService(false); setSvcError(''); setNewSvc({ name: '', category: 'nails', price: '' }); }}
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
                                  <option value="nails">Nails</option>
                                  <option value="lash">Lash</option>
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
                <input
                  className="od-input od-input--full"
                  placeholder="Image URL"
                  value={newImg.url}
                  onChange={e => { setNewImg(n => ({ ...n, url: e.target.value })); setImgError(''); }}
                />
                <input
                  className="od-input od-input--full"
                  placeholder="Caption (optional)"
                  value={newImg.caption}
                  onChange={e => setNewImg(n => ({ ...n, caption: e.target.value }))}
                />
                {imgError && <p className="od-inline-error">{imgError}</p>}
                <button
                  className="od-add-btn"
                  onClick={submitNewImage}
                  disabled={addingImg}
                >
                  <Plus size={13} />
                  {addingImg ? 'Adding...' : 'Add Image'}
                </button>
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
