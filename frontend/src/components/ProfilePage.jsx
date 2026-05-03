import { useState } from 'react';
import OrderHistory from './OrderHistory';

export default function ProfilePage({ user, orders, ordersLoading, onRefreshOrders, wishlist, purchases, loyaltyPoints, showToast }) {
  const [section, setSection] = useState('overview');

  const avatar = user?.user_name?.[0]?.toUpperCase() || '?';

  const stats = [
    { icon: '📦', label: 'Orders',      value: orders.length },
    { icon: '❤️', label: 'Wishlist',    value: wishlist.length },
    { icon: '🛒', label: 'Purchases',   value: purchases.length },
    { icon: '⭐', label: 'Loyalty Pts', value: loyaltyPoints },
  ];

  const delivered = orders.filter(o => o.status === 'delivered').length;
  const pending   = orders.filter(o => ['placed', 'processing', 'shipped'].includes(o.status)).length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;

  const cardStyle = {
    background: 'var(--card-bg,#fff)',
    border: '1px solid var(--border,#ede9fe)',
    borderRadius: 14,
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const productCardStyle = {
    background: 'var(--card-bg,#fff)',
    border: '1px solid var(--border,#ede9fe)',
    borderRadius: 12,
    padding: '0.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const ProductGrid = ({ items, emptyIcon, emptyMsg }) =>
    items.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{emptyIcon}</div>
        <p style={{ margin: 0 }}>{emptyMsg}</p>
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '1rem' }}>
        {items.map(p => (
          <div key={p.product_id} style={productCardStyle}>
            {p.image && (
              <img src={p.image} alt={p.name}
                style={{ width: '100%', height: 90, objectFit: 'contain', borderRadius: 8, background: '#f8f9fa', marginBottom: '0.5rem' }}
                onError={e => (e.currentTarget.style.display = 'none')} />
            )}
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text,#111827)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {p.name}
            </div>
            {p.price > 0 && (
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6c63ff', marginTop: '0.3rem' }}>
                ₹{Number(p.price).toLocaleString('en-IN')}
              </div>
            )}
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.15rem' }}>
              {(p.category || '').split('|')[0].trim()}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

      {/* ── Profile card ── */}
      <div style={{
        ...cardStyle,
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        marginBottom: '1.5rem', flexWrap: 'wrap',
        boxShadow: '0 4px 24px rgba(108,99,255,0.08)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#6c63ff,#9c5aff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 800, color: '#fff',
          boxShadow: '0 4px 16px rgba(108,99,255,0.35)',
        }}>
          {avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text,#111827)' }}>
            {user?.user_name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280' }}>
            ✉️ {user?.email || '—'}
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6c63ff', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border,#ede9fe)', paddingBottom: '0', flexWrap: 'wrap' }}>
        {[
          { id: 'overview',  label: '📊 Overview'  },
          { id: 'orders',    label: '📦 Orders'    },
          { id: 'wishlist',  label: '❤️ Wishlist'  },
          { id: 'purchases', label: '🛒 Purchases' },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            background: section === t.id ? '#6c63ff' : 'transparent',
            color:      section === t.id ? '#fff' : 'var(--text,#374151)',
            border: 'none', borderRadius: '8px 8px 0 0',
            padding: '0.55rem 1.1rem', fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', transition: 'all .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {section === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>

          {/* Order summary */}
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 0.9rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text,#111827)' }}>📦 Order Summary</h4>
            {[
              { label: 'Total Orders', value: orders.length, color: '#6c63ff' },
              { label: 'Delivered',    value: delivered,     color: '#16a34a' },
              { label: 'In Progress',  value: pending,       color: '#f59e0b' },
              { label: 'Cancelled',    value: cancelled,     color: '#ef4444' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border,#f3f4f6)' }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Loyalty card */}
          <div style={{ background: 'linear-gradient(135deg,#6c63ff,#9c5aff)', borderRadius: 14, padding: '1.25rem', color: '#fff', boxShadow: '0 4px 16px rgba(108,99,255,0.3)' }}>
            <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700 }}>⭐ Loyalty Points</h4>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{loyaltyPoints}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '0.4rem' }}>Earn 10 pts per order · redeem at checkout</div>
            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
              💡 {loyaltyPoints >= 100
                ? `You can redeem ₹${Math.floor(loyaltyPoints / 10)} off your next order!`
                : `Earn ${100 - loyaltyPoints} more points to unlock your first reward.`}
            </div>
          </div>

          {/* Recent orders */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text,#111827)' }}>🕐 Recent Orders</h4>
              <button onClick={() => setSection('orders')} style={{ background: 'none', border: 'none', color: '#6c63ff', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                View all →
              </button>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>No orders yet.</p>
            ) : (
              orders.slice(0, 3).map(o => (
                <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid var(--border,#f3f4f6)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text,#374151)' }}>#{o.order_id}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6c63ff' }}>₹{Number(o.total).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize', color: o.status === 'delivered' ? '#16a34a' : o.status === 'cancelled' ? '#ef4444' : '#f59e0b' }}>
                      {o.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Orders ── */}
      {section === 'orders' && (
        <OrderHistory orders={orders} loading={ordersLoading} onRefresh={onRefreshOrders} showToast={showToast} />
      )}

      {/* ── Wishlist ── */}
      {section === 'wishlist' && (
        <>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
            {wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}
          </p>
          <ProductGrid items={wishlist} emptyIcon="❤️" emptyMsg="Your wishlist is empty. Start saving products you love!" />
        </>
      )}

      {/* ── Purchases ── */}
      {section === 'purchases' && (
        <>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1rem' }}>
            {purchases.length} purchased item{purchases.length !== 1 ? 's' : ''}
          </p>
          <ProductGrid items={purchases} emptyIcon="🛒" emptyMsg="No purchases yet. Start shopping!" />
        </>
      )}
    </div>
  );
}
