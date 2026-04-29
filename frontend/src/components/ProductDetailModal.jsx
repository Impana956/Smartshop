import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

// ── Price Comparison Panel ─────────────────────────────────────────────────
function PriceComparePanel({ productId, productName }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const load = () => {
    if (data || loading) { setOpen(o => !o); return; }
    setLoading(true);
    setOpen(true);
    api.getPriceComparison(productId)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const best    = data?.results?.find(r => r.best_deal);
  const results = data?.results || [];

  return (
    <div style={{ marginTop: '1rem', borderRadius: 14, border: '1.5px solid #e0e7ff', overflow: 'hidden' }}>
      {/* Header toggle */}
      <button onClick={load} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
        border: 'none', cursor: 'pointer', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🏷️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>Compare Prices Across Platforms</div>
            {best && !open && (
              <div style={{ fontSize: '0.68rem', opacity: 0.88, marginTop: '0.1rem' }}>
                Best deal: <strong>{best.platform}</strong> at ₹{Number(best.price).toLocaleString('en-IN')} ⭐ {best.rating}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div style={{ background: '#f8faff', padding: '0.85rem 1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="loading-skeleton" style={{ height: 56, borderRadius: 10 }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
              Comparison not available.
            </p>
          ) : (
            <>
              {/* Best deal callout */}
              {best && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: '#dcfce7', border: '1.5px solid #86efac',
                  borderRadius: 10, padding: '0.55rem 0.85rem', marginBottom: '0.75rem',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🏆</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#15803d' }}>
                      Best Deal on {best.platform}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: '#166534' }}>
                      ₹{Number(best.price).toLocaleString('en-IN')} · ⭐ {best.rating} · 🚚 {best.delivery}
                      {best.discount > 0 && ` · 🔖 ${best.discount}% cheaper than others`}
                    </div>
                  </div>
                  <a href={best.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '0.38rem 0.85rem', borderRadius: 99, background: '#16a34a',
                      color: '#fff', fontSize: '0.73rem', fontWeight: 700,
                      textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                    Buy Now ↗
                  </a>
                </div>
              )}

              {/* Platform rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {results.map(r => (
                  <div key={r.platform} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    background: r.best_deal ? r.bg : '#fff',
                    border: `1.5px solid ${r.best_deal ? r.color + '80' : '#e5e7eb'}`,
                    borderRadius: 10, padding: '0.6rem 0.85rem',
                    opacity: r.in_stock ? 1 : 0.52,
                    boxShadow: r.best_deal ? `0 2px 12px ${r.color}22` : 'none',
                    transition: 'all .15s',
                  }}>
                    {/* Platform logo chip */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, background: r.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 900, fontSize: '0.7rem', flexShrink: 0,
                      letterSpacing: '-0.02em',
                    }}>
                      {r.logo}
                    </div>

                    {/* Platform info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>{r.platform}</span>
                        {r.best_deal && (
                          <span style={{ fontSize: '0.58rem', background: r.color, color: '#fff', borderRadius: 99, padding: '0.1rem 0.45rem', fontWeight: 800 }}>
                            BEST
                          </span>
                        )}
                        {!r.in_stock && (
                          <span style={{ fontSize: '0.58rem', background: '#fee2e2', color: '#dc2626', borderRadius: 99, padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.67rem', color: '#6b7280', marginTop: '0.12rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span>⭐ {r.rating} ({r.reviews >= 1000 ? (r.reviews/1000).toFixed(1)+'k' : r.reviews})</span>
                        <span>🚚 {r.delivery}</span>
                        {r.discount > 0 && <span style={{ color: '#16a34a', fontWeight: 700 }}>🔖 {r.discount}% off</span>}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: r.best_deal ? r.color : '#111827' }}>
                        ₹{Number(r.price).toLocaleString('en-IN')}
                      </div>
                      {r.in_stock ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-block', marginTop: '0.2rem',
                            padding: '0.22rem 0.65rem', borderRadius: 99,
                            background: r.best_deal ? r.color : 'transparent',
                            border: `1.5px solid ${r.color}`,
                            color: r.best_deal ? '#fff' : r.color,
                            fontSize: '0.65rem', fontWeight: 700,
                            textDecoration: 'none', transition: 'all .15s',
                          }}>
                          View ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.62rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.6rem', lineHeight: 1.4 }}>
                ℹ️ Prices are indicative estimates. Click "View ↗" to see live prices on each platform.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Price Sparkline ────────────────────────────────────────────────────────
function PriceSparkline({ data, productId }) {
  if (!data || data.length < 2) return null;
  const prices   = data.map(d => d.price);
  const minP     = Math.min(...prices);
  const maxP     = Math.max(...prices);
  const range    = maxP - minP || 1;
  const W = 300, H = 72, PX = 8, PY = 8;
  const pts = prices.map((p, i) => ({
    x: PX + (i / (prices.length - 1)) * (W - PX * 2),
    y: PY + (1 - (p - minP) / range) * (H - PY * 2),
  }));
  const lineStr  = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaStr  = `${pts[0].x.toFixed(1)},${H} ` + lineStr + ` ${pts[pts.length - 1].x.toFixed(1)},${H}`;
  const current  = prices[prices.length - 1];
  const oldest   = prices[0];
  const isDown   = current <= oldest;
  const changePct = Math.abs(((current - oldest) / (oldest || 1)) * 100).toFixed(1);
  const lineColor = isDown ? '#16a34a' : '#6c63ff';
  const gradId    = `sg_${productId}`;
  return (
    <div style={{ marginTop: '1rem', background: '#f9f8ff', borderRadius: 12, padding: '0.875rem 1rem', border: '1px solid #ede9fe' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>📈 30-Day Price History</span>
        <span style={{ fontSize: '0.71rem', fontWeight: 700, color: isDown ? '#16a34a' : '#ef4444', background: isDown ? '#dcfce7' : '#fee2e2', borderRadius: 99, padding: '0.15rem 0.55rem' }}>
          {isDown ? '▼' : '▲'} {changePct}% vs 30d ago
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 72, display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaStr} fill={`url(#${gradId})`} />
        <polyline points={lineStr} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={lineColor} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: '#9ca3af', marginTop: '0.2rem' }}>
        <span>Low ₹{minP.toLocaleString('en-IN')}</span>
        <span style={{ fontWeight: 700, color: lineColor }}>Now ₹{current.toLocaleString('en-IN')}</span>
        <span>High ₹{maxP.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

// ── Bundle Row ("Complete the Look") ──────────────────────────────────────
function BundleRow({ bundle, onBuy, onNavigate }) {
  if (!bundle || !bundle.products || bundle.products.length === 0) return null;
  const { products, bundle_total } = bundle;
  return (
    <div style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#faf5ff,#f0fdf4)', borderRadius: 14, padding: '1rem 1.25rem', border: '1.5px solid #e9d5ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed' }}>🛍️ Complete the Look</span>
        <span style={{ fontSize: '0.69rem', color: '#6b7280' }}>Frequently bought together</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {products.map(p => (
          <div key={p.product_id} onClick={() => onNavigate && onNavigate(p.product_id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', width: 78 }}>
            {p.image ? (
              <img src={p.image} alt={p.name}
                style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 10, background: '#fff', border: '1px solid #ede9fe' }}
                onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div style={{ width: 58, height: 58, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#7c3aed', textAlign: 'center', padding: '0.25rem' }}>
                {(p.name || '').slice(0, 18)}
              </div>
            )}
            <span style={{ fontSize: '0.62rem', color: '#374151', textAlign: 'center', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 74 }}>{p.name}</span>
            <span style={{ fontSize: '0.67rem', color: '#6c63ff', fontWeight: 700 }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: '#374151' }}>
          Bundle total: <strong style={{ color: '#7c3aed' }}>₹{Number(bundle_total).toLocaleString('en-IN')}</strong>
        </span>
        <button onClick={() => products.forEach(p => onBuy(p.product_id))}
          style={{ padding: '0.42rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#6c63ff)', color: '#fff', fontSize: '0.74rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(124,58,237,0.3)' }}>
          Add All to Cart
        </button>
      </div>
    </div>
  );
}

const CATEGORY_COLORS = {
  Electronics: '#6c63ff',
  Computers: '#5c6bc0',
  Fashion: '#ff6584',
  Clothing: '#ec407a',
  Jeans: '#1565c0',
  Shirts: '#0288d1',
  Books: '#43a047',
  Home: '#fb8c00',
  Sports: '#29b6f6',
  Health: '#26a69a',
  Toys: '#ef5350',
  Music: '#ab47bc',
  Beauty: '#e91e63',
  Shoes: '#795548',
  Watches: '#607d8b',
  Jewellery: '#f06292',
  Bags: '#8d6e63',
  Furniture: '#ff8f00',
};

function getCategoryColor(category) {
  if (!category) return '#6c63ff';
  const cat = category.split('|')[0].split('&')[0].trim();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return CATEGORY_COLORS[key];
  }
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 48%)`;
}

function formatPrice(price) {
  const p = parseFloat(price) || 0;
  if (p === 0) return '';
  return '₹' + p.toLocaleString('en-IN');
}

function StarRow({ rating }) {
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

export default function ProductDetailModal({
  productId,
  wishlistIds,
  purchasedIds,
  onWishlist,
  onBuy,
  onRemoveCart,
  onRate,
  onClose,
  onNavigate,
}) {
  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [priceHistory, setPriceHistory] = useState([]);
  const [bundle,       setBundle]       = useState(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setProduct(null);
    setPriceHistory([]);
    setBundle(null);
    // Always load product first — secondary fetches never block the modal
    api.getProduct(productId)
      .then(data => {
        setProduct(data && !data.error ? data : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Load extras independently — failures are silently swallowed
    api.getPriceHistory(productId)
      .then(hist => setPriceHistory(Array.isArray(hist) ? hist : []))
      .catch(() => {});
    api.getBundleSuggestions(productId)
      .then(bund => setBundle(bund && bund.products && bund.products.length > 0 ? bund : null))
      .catch(() => {});
  }, [productId]);

  const handleOverlayClick = useCallback(
    e => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!productId) return null;

  const inWish = wishlistIds.has(productId);
  const inBuy  = purchasedIds.has(productId);
  const color  = product ? getCategoryColor(product.category) : '#6c63ff';
  const cat    = product ? (product.category || '').split('|')[0].trim() : '';
  const priceStr = product ? formatPrice(product.price) : '';

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>

        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="loading-skeleton" style={{ height: 260 }} />
            <div className="loading-skeleton" style={{ height: 24, width: '60%' }} />
            <div className="loading-skeleton" style={{ height: 16, width: '40%' }} />
          </div>
        ) : product ? (
          <>
            {/* Top: image + info */}
            <div className="detail-top">
              <div className="detail-hero" style={{ background: color }}>
                {product.image ? (
                  <>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="detail-img"
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="detail-img-fallback" style={{ display: 'none' }}>
                      <span className="fallback-cat">{cat}</span>
                      <span className="fallback-name">{product.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="detail-img-fallback">
                    <span className="fallback-cat">{cat}</span>
                    <span className="fallback-name">{product.name}</span>
                  </div>
                )}
              </div>

              <div className="detail-info">
                {cat && <span className="detail-category-sub">{cat}</span>}
                <h2 className="detail-name">{product.name}</h2>

                <div className="detail-meta">
                  {priceStr && <span className="detail-price">{priceStr}</span>}
                  {product.avg_rating != null && (
                    <span className="detail-rating">
                      ⭐ {parseFloat(product.avg_rating).toFixed(1)}
                    </span>
                  )}
                  {product.rating_count > 0 && (
                    <span className="detail-reviews-count">
                      {product.rating_count} review{product.rating_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="detail-description">
                  {product.description
                    ? product.description.split('|').map((point, i) => {
                        const text = point.trim();
                        return text ? <p key={i} className="desc-bullet">• {text}</p> : null;
                      })
                    : <p>No description available.</p>
                  }
                </div>

                <div className="detail-actions">
                  <button
                    className={`btn btn-wishlist detail-btn${inWish ? ' wishlisted' : ''}`}
                    onClick={() => onWishlist(productId)}
                  >
                    {inWish ? '❤️ Saved' : '🤍 Wishlist'}
                  </button>
                  <button
                    className="btn btn-rate detail-btn"
                    onClick={() => { onClose(); onRate(productId, product.name); }}
                  >
                    ★ Rate
                  </button>
                  <button
                    className={`btn btn-buy detail-btn${inBuy ? ' bought' : ''}`}
                    onClick={() => inBuy ? onRemoveCart(productId) : onBuy(productId)}
                  >
                    {inBuy ? '🗑️ Remove' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            </div>

            {/* Price History Sparkline */}
            {priceHistory.length >= 2 && (
              <PriceSparkline data={priceHistory} productId={productId} />
            )}

            {/* Platform Price Comparison */}
            <PriceComparePanel productId={productId} productName={product.name} />

            {/* Reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="detail-similar">
                <h3 className="detail-similar-title">⭐ Customer Reviews</h3>
                <div className="reviews-list">
                  {product.reviews.map((r, i) => (
                    <div key={i} className="review-item">
                      <div className="review-header">
                        <span className="review-user">{r.user_name}</span>
                        <StarRow rating={r.rating} />
                      </div>
                      <span className="review-date">{(r.timestamp || '').split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bundle Suggestions */}
            {bundle && (
              <BundleRow bundle={bundle} onBuy={onBuy} onNavigate={onNavigate} />
            )}
          </>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Product not found.
          </div>
        )}
      </div>
    </div>
  );
}
