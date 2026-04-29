import { useState, useCallback } from 'react';
import * as api from '../api';

const STATUS_STEPS  = ['placed', 'processing', 'shipped', 'delivered'];
const STATUS_ICON   = { placed: '📋', processing: '⚙️', shipped: '🚚', delivered: '✅', cancelled: '❌', return_requested: '🔄' };
const STATUS_COLOR  = { placed: '#6c63ff', processing: '#f59e0b', shipped: '#3b82f6', delivered: '#16a34a', cancelled: '#ef4444', return_requested: '#f97316' };
const METHOD_LABEL  = { cod: 'Cash on Delivery', upi: 'UPI', card: 'Credit/Debit Card' };

function OrderTimeline({ status }) {
  const cur = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') {
    return (
      <div style={{ marginTop: '0.6rem' }}>
        <span style={{ background: '#fef2f2', color: '#ef4444', borderRadius: 99, padding: '0.2rem 0.75rem', fontSize: '0.76rem', fontWeight: 700 }}>
          ❌ Order Cancelled
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
      {STATUS_STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background:  i <= cur ? STATUS_COLOR[s] : '#e5e7eb',
              color:       i <= cur ? '#fff'           : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:    i < cur ? '0.75rem' : '0.85rem',
              fontWeight:  700,
              boxShadow:   i === cur ? `0 0 0 4px ${STATUS_COLOR[s]}33` : 'none',
              transition:  'all .25s',
            }}>
              {i < cur ? '✓' : STATUS_ICON[s]}
            </div>
            <div style={{
              fontSize: '0.6rem', marginTop: '0.3rem', textAlign: 'center',
              color:       i <= cur ? STATUS_COLOR[s] : '#9ca3af',
              fontWeight:  i === cur ? 700 : 400,
              textTransform: 'capitalize',
            }}>
              {s}
            </div>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div style={{ height: 2, width: 28, background: i < cur ? '#6c63ff' : '#e5e7eb', marginBottom: 18, flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, onRefresh, showToast }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const color = STATUS_COLOR[order.status] || '#6b7280';

  const canCancel = ['placed', 'processing'].includes(order.status) &&
    ((new Date() - new Date(order.created_at)) / 1000 < 3600);
  const canReturn = order.status === 'delivered';

  const handleCancel = useCallback(async () => {
    if (!window.confirm('Cancel this order?')) return;
    setLoading(true);
    try {
      const res = await api.cancelOrder(order.order_id);
      if (res.ok) { showToast?.('✅ Order cancelled.', 'success'); onRefresh?.(); }
      else showToast?.(res.error, 'error');
    } catch { showToast?.('Network error', 'error'); }
    finally { setLoading(false); }
  }, [order.order_id, onRefresh, showToast]);

  const handleReturn = useCallback(async () => {
    if (!window.confirm('Request a return for this order?')) return;
    setLoading(true);
    try {
      const res = await api.returnOrder(order.order_id);
      if (res.ok) { showToast?.('🔄 Return requested.', 'success'); onRefresh?.(); }
      else showToast?.(res.error, 'error');
    } catch { showToast?.('Network error', 'error'); }
    finally { setLoading(false); }
  }, [order.order_id, onRefresh, showToast]);

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #ede9fe',
      marginBottom: '1rem', overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(108,99,255,0.07)',
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(108,99,255,0.14)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(108,99,255,0.07)')}
    >
      {/* Card header (always visible) */}
      <div
        style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#111827' }}>
              Order #{order.order_id}
            </span>
            <span style={{
              background: color + '22', color,
              borderRadius: 99, padding: '0.15rem 0.65rem',
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
            }}>
              {STATUS_ICON[order.status]} {order.status}
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
            &nbsp;·&nbsp;
            {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
          </div>
          <OrderTimeline status={order.status} />
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6c63ff' }}>
            ₹{Number(order.total).toLocaleString('en-IN')}
          </div>
          {order.discount > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
              Saved ₹{Number(order.discount).toLocaleString('en-IN')}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.35rem' }}>
            {open ? '▲ Hide' : '▼ Details'}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{ borderTop: '1.5px solid #ede9fe', padding: '1rem 1.25rem', background: '#faf9ff' }}>
          {/* Items */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>📦 Items Ordered</div>
            {(order.items || []).map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.55rem' }}>
                {item.image && (
                  <img src={item.image} alt={item.name}
                    style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', flexShrink: 0 }}
                    onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#374151', flexShrink: 0 }}>
                  ₹{Number(item.unit_price).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.76rem', color: '#6b7280', paddingTop: '0.75rem', borderTop: '1px solid #ede9fe' }}>
            <span>📍 {order.address}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.76rem', color: '#6b7280', marginTop: '0.4rem' }}>
            <span>💳 {METHOD_LABEL[order.payment_method] || order.payment_method}</span>
            {order.coupon_code && <span>🏷️ Coupon: <strong>{order.coupon_code}</strong></span>}
          </div>

          {/* Estimated delivery */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'return_requested' && (
            <div style={{ marginTop: '0.75rem', background: '#f0fdf4', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
              📦 Estimated Delivery: 3–5 Business Days
            </div>
          )}

          {/* Action buttons */}
          {(canCancel || canReturn) && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: 8, border: '1.5px solid #ef4444',
                    background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem',
                    cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'all .15s',
                  }}
                >
                  {loading ? '⏳' : '❌ Cancel Order'}
                </button>
              )}
              {canReturn && (
                <button
                  onClick={handleReturn}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: 8, border: '1.5px solid #f97316',
                    background: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '0.8rem',
                    cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'all .15s',
                  }}
                >
                  {loading ? '⏳' : '🔄 Request Return'}
                </button>
              )}
            </div>
          )}
          {order.status === 'return_requested' && (
            <div style={{ marginTop: '0.75rem', background: '#fff7ed', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#ea580c', fontWeight: 600 }}>
              🔄 Return requested — we'll process it within 3–5 business days.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderHistory({ orders, loading, onRefresh, showToast }) {
  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="loading-skeleton" style={{ height: 110, borderRadius: 14, marginBottom: '1rem' }} />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#9ca3af' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
        <h3 style={{ margin: '0 0 0.5rem', color: '#374151', fontSize: '1.1rem' }}>No orders yet</h3>
        <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: 300, margin: '0 auto' }}>
          Add products to your cart and checkout to place your first order!
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📦 My Orders
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9ca3af' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </h2>
      {orders.map(order => <OrderCard key={order.order_id} order={order} onRefresh={onRefresh} showToast={showToast} />)}
    </div>
  );
}
