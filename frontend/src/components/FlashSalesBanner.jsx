import { useState, useEffect, useRef } from 'react';

function useCountdown(endTime) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) {
        setTime({ h: 0, m: 0, s: 0, expired: true });
        return;
      }
      setTime({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return time;
}

const pad = n => String(n).padStart(2, '0');

function FlashProductCard({ product, onBuy, onWishlist, purchasedIds, wishlistIds }) {
  const pid     = product.product_id;
  const inCart  = purchasedIds?.has(pid);
  const inWish  = wishlistIds?.has(pid);
  const stock   = product.stock ?? 999;
  const outOfStock = stock === 0;

  return (
    <div style={{
      background: '#1e1046', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden', width: 185, flexShrink: 0,
      transition: 'transform .18s, box-shadow .18s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Product image */}
      <div style={{ position: 'relative', height: 140, background: '#fff', overflow: 'hidden' }}>
        {product.image
          ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => (e.currentTarget.style.display = 'none')} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛍️</div>
        }
        {/* Discount badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'linear-gradient(135deg, #ff4757, #ff6b35)',
          color: '#fff', fontWeight: 900, fontSize: '0.7rem',
          borderRadius: 99, padding: '0.2rem 0.55rem',
          boxShadow: '0 2px 8px rgba(255,71,87,0.5)',
        }}>
          -{product.discount_pct}%
        </div>
        {/* Stock warning */}
        {stock > 0 && stock <= 5 && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(239,68,68,0.9)', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            borderRadius: 6, padding: '0.15rem 0.45rem',
          }}>
            Only {stock} left!
          </div>
        )}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', background: 'rgba(0,0,0,0.6)', padding: '0.3rem 0.75rem', borderRadius: 8 }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.4rem' }}>
          {product.name}
        </div>

        {/* Prices */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffd700' }}>
            ₹{Number(product.sale_price).toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through' }}>
            ₹{Number(product.original_price).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => onWishlist?.(pid)}
            style={{
              background: inWish ? '#6c63ff' : 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 6, color: '#fff',
              fontSize: '0.72rem', fontWeight: 600, padding: '0.35rem 0.6rem',
              cursor: 'pointer', transition: 'background .15s',
            }}
          >
            {inWish ? '❤️' : '🤍'}
          </button>
          <button
            onClick={() => !outOfStock && !inCart && onBuy?.(pid)}
            disabled={outOfStock || inCart}
            style={{
              flex: 1,
              background: outOfStock ? '#4b5563' : inCart ? '#16a34a' : 'linear-gradient(135deg,#ff4757,#ff6b35)',
              border: 'none', borderRadius: 6, color: '#fff',
              fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0',
              cursor: outOfStock || inCart ? 'not-allowed' : 'pointer',
              transition: 'opacity .15s', opacity: outOfStock ? 0.6 : 1,
            }}
          >
            {outOfStock ? 'Out of Stock' : inCart ? '✓ In Cart' : '⚡ Grab Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlashSalesBanner({ products, wishlistIds, purchasedIds, onBuy, onWishlist, onDismiss }) {
  const endTime = products[0]?.end_time;
  const timer   = useCountdown(endTime);
  const scrollRef = useRef(null);

  if (!products || products.length === 0 || timer.expired) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #120029 0%, #2d1066 55%, #0f1a3d 100%)',
      borderRadius: 18, margin: '0 0 1.75rem',
      boxShadow: '0 8px 36px rgba(108,99,255,0.28)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* ── Header bar ── */}
      <div style={{
        background: 'linear-gradient(90deg, #e11d48, #f97316)',
        padding: '0.8rem 1.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>⚡</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Flash Sale
            </div>
            <div style={{ color: '#ffe0d6', fontSize: '0.7rem' }}>
              Up to {Math.max(...products.map(p => p.discount_pct || 0))}% off · Limited stock!
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: '#ffe0d6', fontSize: '0.76rem', fontWeight: 600 }}>Ends in</span>
          {[pad(timer.h), pad(timer.m), pad(timer.s)].map((v, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <span style={{
                background: 'rgba(0,0,0,0.4)', color: '#fff',
                fontWeight: 900, fontSize: '1.1rem',
                padding: '0.2rem 0.55rem', borderRadius: 7,
                minWidth: 38, textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {v}
              </span>
              {i < 2 && <span style={{ color: '#ffa07a', fontWeight: 900, fontSize: '1rem' }}>:</span>}
            </span>
          ))}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', borderRadius: 99, width: 26, height: 26, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        )}
      </div>

      {/* ── Product row ── */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: '0.9rem',
          padding: '1.1rem 1.4rem',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#6c63ff #1a0533',
        }}
      >
        {products.map(p => (
          <FlashProductCard
            key={p.product_id}
            product={p}
            purchasedIds={purchasedIds}
            wishlistIds={wishlistIds}
            onBuy={onBuy}
            onWishlist={onWishlist}
          />
        ))}
      </div>
    </div>
  );
}
