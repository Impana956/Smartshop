import { useState, useCallback, useEffect } from 'react';
import * as api from '../api';

const STEPS = ['Review Cart', 'Shipping', 'Payment', 'Confirmed'];

const STEP_ICONS = ['🛒', '📍', '💳', '🎉'];

export default function CheckoutModal({ cartItems, onClose, onOrderPlaced, onViewOrders, showToast, loyaltyPoints = 0 }) {
  const [step, setStep]               = useState(0);
  const [addr, setAddr]               = useState({
    fullName: '', phone: '', line1: '', city: '', state: '', pincode: '',
  });
  const [addrError,      setAddrError]      = useState('');
  const [couponCode,     setCouponCode]     = useState('');
  const [couponResult,   setCouponResult]   = useState(null);
  const [couponError,    setCouponError]    = useState('');
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [loyaltyRedeem,  setLoyaltyRedeem]  = useState(0);    // pts to redeem
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0); // ₹ value
  const [payMethod,      setPayMethod]      = useState('cod');
  const [loading,        setLoading]        = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [smartCoupons,   setSmartCoupons]   = useState([]);
  const [scLoading,      setScLoading]      = useState(false);

  const subtotal = cartItems.reduce((s, p) => s + (parseFloat(p.price) || 0), 0);
  const discount = (couponResult?.discount || 0) + loyaltyDiscount;
  const total    = Math.max(0, subtotal - discount);

  // ── Address validation ──────────────────────────────────────────────────
  const validateAddr = () => {
    const { fullName, phone, line1, city, state, pincode } = addr;
    if (!fullName.trim())               return 'Full name is required.';
    if (!/^\d{10}$/.test(phone.trim())) return 'Enter a valid 10-digit phone number.';
    if (!line1.trim())                  return 'Address line is required.';
    if (!city.trim())                   return 'City is required.';
    if (!state.trim())                  return 'State is required.';
    if (!/^\d{6}$/.test(pincode.trim())) return 'Enter a valid 6-digit pincode.';
    return '';
  };
  // ── Load smart coupon suggestions when payment step is reached ─────────
  useEffect(() => {
    if (step !== 2 || subtotal <= 0) return;
    setScLoading(true);
    api.getSmartCoupons(subtotal)
      .then(data => { setSmartCoupons(Array.isArray(data) ? data : []); setScLoading(false); })
      .catch(() => { setSmartCoupons([]); setScLoading(false); });
  }, [step, subtotal]);
  // ── Apply coupon ────────────────────────────────────────────────────────
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const res = await api.validateCoupon(couponCode.trim(), subtotal);
      if (res.ok) {
        setCouponResult(res);
        showToast?.(`✓ Coupon applied: ${res.description}`, 'success');
      } else {
        setCouponError(res.error);
      }
    } catch {
      setCouponError('Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal, showToast]);

  // ── One-click apply from smart suggestions ────────────────────────────
  const handleSmartCouponClick = useCallback(async (code) => {
    setCouponCode(code);
    setCouponError('');
    setCouponResult(null);
    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.ok) {
        setCouponResult(res);
        showToast?.(`✓ Coupon applied: ${res.description}`, 'success');
      } else {
        setCouponError(res.error);
      }
    } catch {
      setCouponError('Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  }, [subtotal, showToast]);

  // ── Submit order after payment confirmed ─────────────────────────────
  const submitOrder = useCallback(async (paymentId = '') => {
    setLoading(true);
    try {
      const addressStr = [
        addr.fullName, addr.phone, addr.line1,
        addr.city, addr.state + ' - ' + addr.pincode,
      ].join(', ');
      const res = await api.placeOrder({
        address:        addressStr,
        items:          cartItems.map(p => ({ product_id: p.product_id, quantity: 1 })),
        coupon_code:    couponResult?.code || '',
        payment_method: payMethod,
        payment_id:     paymentId,
        loyalty_points: loyaltyRedeem,
      });
      if (res.ok) {
        setConfirmedOrder(res);
        setStep(3);
        onOrderPlaced?.();
        showToast?.('🎉 Order placed successfully!', 'success');
      } else {
        showToast?.(res.error || 'Failed to place order. Try again.', 'error');
      }
    } catch {
      showToast?.('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addr, cartItems, couponResult, payMethod, onOrderPlaced, showToast]);

  // ── Main handler: COD → direct, UPI/Card → simulated payment ─────────
  const handlePlaceOrder = useCallback(async () => {
    if (payMethod === 'cod') {
      await submitOrder();
      return;
    }

    // Simulate payment processing with a 2-second delay
    setLoading(true);
    showToast?.('💳 Processing payment…', '');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const fakePaymentId = `pay_demo_${Date.now()}`;
    await submitOrder(fakePaymentId);
  }, [payMethod, total, submitOrder, showToast]);

  const handleClose = () => {
    if (step === 3) onOrderPlaced?.();
    onClose();
  };

  const addrField = (key, label, placeholder, full = false, type = 'text') => (
    <div key={key} style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={addr[key]}
        onChange={e => setAddr(a => ({ ...a, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8,
          border: '1.5px solid #e5e7eb', fontSize: '0.88rem',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color .15s',
        }}
        onFocus={e  => (e.target.style.borderColor = '#6c63ff')}
        onBlur={e   => (e.target.style.borderColor = '#e5e7eb')}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 580, width: '95vw', maxHeight: '92vh',
          overflowY: 'auto', padding: '1.75rem',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
              🛒 Checkout
            </h2>

            {/* Step indicators */}
            {step < 3 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '0.9rem' }}>
                {STEPS.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                        fontWeight: 700, transition: 'all .2s',
                        background: i < step ? '#6c63ff' : i === step ? '#6c63ff' : '#e5e7eb',
                        color:      i <= step ? '#fff' : '#9ca3af',
                        boxShadow:  i === step ? '0 0 0 4px #ede9fe' : 'none',
                      }}>
                        {i < step ? '✓' : STEP_ICONS[i]}
                      </div>
                      <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', color: i === step ? '#6c63ff' : '#9ca3af', fontWeight: i === step ? 700 : 400, whiteSpace: 'nowrap' }}>
                        {s}
                      </div>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 32, height: 2, background: i < step ? '#6c63ff' : '#e5e7eb', margin: '0 2px 16px', flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* ══ STEP 0: Cart Review ══ */}
        {step === 0 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.92rem', fontWeight: 700, color: '#374151' }}>
              Your Cart — {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem', maxHeight: 320, overflowY: 'auto' }}>
              {cartItems.map(p => (
                <div key={p.product_id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  background: '#fff', borderRadius: 12, padding: '0.75rem',
                  border: '1.5px solid #ede9fe',
                  boxShadow: '0 2px 8px rgba(108,99,255,0.07)',
                }}>
                  {p.image && (
                    <img src={p.image} alt={p.name} style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 8, background: '#fff', flexShrink: 0 }}
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>{(p.category || '').split('|')[0].trim()}</div>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#6c63ff', flexShrink: 0 }}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #ddd6fe' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>Subtotal</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#6c63ff' }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={handleClose} className="btn btn-wishlist">Cancel</button>
              <button onClick={() => setStep(1)} className="btn btn-buy" disabled={cartItems.length === 0}>
                Continue to Address →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 1: Shipping Address ══ */}
        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.92rem', fontWeight: 700, color: '#374151' }}>
              📍 Shipping Address
            </h3>

            {addrError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 600 }}>
                {addrError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {addrField('fullName', 'Full Name',   'Your full name',              true)}
              {addrField('phone',    'Phone',        '10-digit mobile number',      false, 'tel')}
              {addrField('line1',    'Address',      'House / Street / Area',       true)}
              {addrField('city',     'City',         'City')}
              {addrField('state',    'State',        'State')}
              {addrField('pincode',  'Pincode',      '6-digit pincode',             false, 'tel')}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(0)} className="btn btn-wishlist">← Back</button>
              <button onClick={() => {
                const err = validateAddr();
                if (err) { setAddrError(err); return; }
                setAddrError('');
                setStep(2);
              }} className="btn btn-buy">
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Payment & Coupon ══ */}
        {step === 2 && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.92rem', fontWeight: 700, color: '#374151' }}>
              💳 Payment & Coupon
            </h3>

            {/* Coupon box */}
            <div style={{ background: '#f9f9ff', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', border: '1px solid #ede9fe' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>🏷️ Have a coupon code?</div>

              {/* Smart Coupon Suggestions */}
              {(scLoading || smartCoupons.length > 0) ? (
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.35rem' }}>
                    💡 Best for your cart — click to apply:
                  </div>
                  {scLoading ? (
                    <div style={{ fontSize: '0.71rem', color: '#9ca3af' }}>Finding best deals…</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {smartCoupons.map(c => (
                        <button key={c.code} onClick={() => handleSmartCouponClick(c.code)}
                          style={{
                            padding: '0.28rem 0.65rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                            background: couponCode === c.code && couponResult ? '#6c63ff' : '#f5f3ff',
                            color: couponCode === c.code && couponResult ? '#fff' : '#6c63ff',
                            border: `1.5px solid ${couponCode === c.code && couponResult ? '#6c63ff' : '#ddd6fe'}`,
                            cursor: 'pointer', transition: 'all .15s',
                          }}>
                          {c.code} <span style={{ fontWeight: 400, opacity: 0.85 }}>· {c.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.6rem' }}>
                  Try: <strong>SAVE10</strong> · <strong>FLAT50</strong> · <strong>FLAT100</strong> · <strong>WELCOME20</strong> · <strong>BIGDEAL</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                    setCouponResult(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  style={{
                    flex: 1, padding: '0.55rem 0.75rem', borderRadius: 8,
                    border: '1.5px solid #e5e7eb', fontSize: '0.88rem',
                    outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                />
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="btn btn-rate" style={{ flexShrink: 0, minWidth: 64 }}>
                  {couponLoading ? '⏳' : 'Apply'}
                </button>
              </div>
              {couponError  && <p style={{ color: '#dc2626', fontSize: '0.76rem', margin: '0.4rem 0 0', fontWeight: 600 }}>{couponError}</p>}
              {couponResult && <p style={{ color: '#16a34a', fontSize: '0.76rem', margin: '0.4rem 0 0', fontWeight: 700 }}>✓ {couponResult.description} applied!</p>}
            </div>

            {/* Loyalty Points box */}
            {loyaltyPoints > 0 && (
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>
                  ⭐ Loyalty Points — You have <strong>{loyaltyPoints}</strong> pts (₹{Math.floor(loyaltyPoints/10)} value)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number" min="0" max={loyaltyPoints} step="10"
                    placeholder="Points to redeem (10 pts = ₹1)"
                    value={loyaltyRedeem || ''}
                    onChange={e => {
                      const pts = Math.min(Math.max(0, parseInt(e.target.value) || 0), loyaltyPoints);
                      setLoyaltyRedeem(pts);
                      setLoyaltyDiscount(Math.round(pts / 10 * 100) / 100);
                    }}
                    style={{ flex: 1, padding: '0.5rem 0.7rem', borderRadius: 8, border: '1.5px solid #fde68a', fontSize: '0.85rem', outline: 'none' }}
                  />
                  <button
                    onClick={() => { setLoyaltyRedeem(loyaltyPoints); setLoyaltyDiscount(Math.round(loyaltyPoints / 10 * 100) / 100); showToast?.(`⭐ ${loyaltyPoints} points applied!`, 'success'); }}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: 8, background: '#f59e0b', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Use All
                  </button>
                  {loyaltyRedeem > 0 && (
                    <button onClick={() => { setLoyaltyRedeem(0); setLoyaltyDiscount(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}>✕</button>
                  )}
                </div>
                {loyaltyDiscount > 0 && (
                  <p style={{ color: '#d97706', fontSize: '0.76rem', margin: '0.4rem 0 0', fontWeight: 700 }}>
                    ✓ ₹{loyaltyDiscount.toLocaleString('en-IN')} discount from {loyaltyRedeem} pts!
                  </p>
                )}
              </div>
            )}

            {/* Order summary */}
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.6rem' }}>Order Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.35rem' }}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.35rem' }}>
                <span>Shipping</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span>Coupon Discount {couponResult?.code ? `(${couponResult.code})` : ''}</span>
                  <span>-₹{(couponResult?.discount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#d97706', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span>⭐ Loyalty Points ({loyaltyRedeem} pts)</span>
                  <span>-₹{loyaltyDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: '#111827', borderTop: '1.5px solid #ddd6fe', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                <span>Total</span>
                <span style={{ color: '#6c63ff' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.6rem' }}>Payment Method</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'cod',  icon: '💵', label: 'Cash on Delivery',    sub: 'Pay when order arrives' },
                  { id: 'upi',  icon: '📱', label: 'UPI / Mobile Pay',      sub: 'Simulated — no real payment processed' },
                  { id: 'card', icon: '💳', label: 'Credit / Debit Card',   sub: 'Simulated — no real payment processed' },
                ].map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: payMethod === m.id ? '#f5f3ff' : '#fff',
                    border: `1.5px solid ${payMethod === m.id ? '#6c63ff' : '#e5e7eb'}`,
                    borderRadius: 10, padding: '0.75rem 1rem', cursor: 'pointer',
                    transition: 'all .15s',
                  }}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod === m.id}
                      onChange={() => setPayMethod(m.id)} style={{ accentColor: '#6c63ff' }} />
                    <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#111827' }}>{m.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{m.sub}</div>
                    </div>
                    {m.id !== 'cod' && (
                      <img src="https://razorpay.com/favicon.ico" alt="Razorpay"
                        style={{ width: 16, height: 16, opacity: 0.6, flexShrink: 0 }}
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(1)} className="btn btn-wishlist">← Back</button>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn btn-buy"
                style={{ minWidth: 190, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite', display: 'inline-block', flexShrink: 0,
                    }} />
                    {payMethod === 'cod' ? 'Placing Order…' : 'Processing Payment…'}
                  </>
                ) : payMethod === 'cod'
                    ? `✅ Place Order · ₹${total.toLocaleString('en-IN')}`
                    : `💳 Simulate Payment · ₹${total.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Success ══ */}
        {step === 3 && confirmedOrder && (
          <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '0.75rem', animation: 'popIn .4s ease' }}>🎉</div>
            <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>
              Order Placed!
            </h2>
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
              Order <strong>#{confirmedOrder.order_id}</strong> is confirmed.<br />
              A confirmation email has been sent.
            </p>

            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              borderRadius: 12, padding: '1.25rem 1.75rem',
              display: 'inline-block', marginBottom: '1rem', textAlign: 'left',
              border: '1px solid #c4b5fd',
            }}>
              <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, marginBottom: '0.3rem' }}>Order Total</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#6c63ff' }}>
                ₹{Number(confirmedOrder.total).toLocaleString('en-IN')}
              </div>
              {confirmedOrder.discount > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700, marginTop: '0.3rem' }}>
                  🎊 You saved ₹{Number(confirmedOrder.discount).toLocaleString('en-IN')}!
                </div>
              )}
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
              📦 Estimated Delivery: <strong style={{ color: '#374151' }}>3–5 Business Days</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={handleClose} className="btn btn-wishlist">Continue Shopping</button>
              <button onClick={() => { onViewOrders?.(); handleClose(); }} className="btn btn-buy">
                📦 View My Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
