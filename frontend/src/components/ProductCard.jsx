const CATEGORY_COLORS = {
  Electronics: '#6c63ff',
  Computers: '#5c6bc0',
  Fashion: '#ff6584',
  Clothing: '#ec407a',
  Jeans: '#1565c0',
  Shirts: '#0288d1',
  Books: '#43a047',
  'Home & Kitchen': '#fb8c00',
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
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 48%)`;
}

function formatPrice(price) {
  const p = parseFloat(price) || 0;
  if (p === 0) return '';
  return '₹' + p.toLocaleString('en-IN');
}

function ProductImage({ image, name, color }) {
  if (image) {
    return (
      <div style={{ position: 'relative', height: 160, background: '#f8f9fa', overflow: 'hidden' }}>
        <img
          src={image}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
        <div
          style={{
            display: 'none',
            position: 'absolute', inset: 0,
            background: color,
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.8rem',
            padding: '0.5rem', textAlign: 'center',
          }}
        >
          {name}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        height: 80,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    />
  );
}

export default function ProductCard({ product, wishlistIds, purchasedIds, onWishlist, onBuy, onRemoveCart, onRate, onClick, socialProof }) {
  const pid        = product.product_id;
  const cat        = (product.category || '').split('|')[0].trim();
  const color      = getCategoryColor(product.category);
  const inWish     = wishlistIds.has(pid);
  const inBuy      = purchasedIds.has(pid);
  const priceStr   = formatPrice(product.price);
  const stock      = product.stock ?? 999;
  const outOfStock = stock === 0;
  const lowStock   = stock > 0 && stock <= 5;
  const isFlash    = !!product.flash_sale;
  const proof      = socialProof?.[pid];

  return (
    <div
      className={`product-card${inBuy ? ' purchased' : ''}`}
      onClick={() => !outOfStock && onClick?.(pid, product.name)}
      style={{ opacity: outOfStock ? 0.72 : 1 }}
    >
      <div style={{ position: 'relative' }}>
        <ProductImage image={product.image} name={product.name} color={color} />

        {/* Category tag */}
        <span
          className="category-tag"
          style={{
            position: 'absolute', bottom: '0.4rem', left: '0.5rem',
            background: color, color: '#fff',
            fontSize: '0.65rem', fontWeight: 700, borderRadius: 999,
            padding: '0.15rem 0.5rem', textTransform: 'uppercase',
          }}
        >
          {cat}
        </span>

        {/* In-cart badge */}
        {inBuy && <span className="purchased-badge">Added to Cart</span>}

        {/* Flash sale badge (replaces plain price badge) */}
        {isFlash && product.original_price ? (
          <span style={{
            position: 'absolute', top: '0.4rem', left: '0.5rem',
            background: 'linear-gradient(135deg,#ff4757,#f97316)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 900,
            borderRadius: 6, padding: '0.15rem 0.45rem',
            boxShadow: '0 2px 6px rgba(255,71,87,0.4)',
          }}>
            ⚡ -{product.discount_pct}%
          </span>
        ) : priceStr && (
          <span
            style={{
              position: 'absolute', top: '0.4rem', left: '0.5rem',
              background: '#fff', color: '#111827',
              fontSize: '0.68rem', fontWeight: 800,
              borderRadius: 6, padding: '0.15rem 0.45rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
              border: '1px solid #e5e7eb',
            }}
          >
            {priceStr}
          </span>
        )}

        {/* Stock warning overlays */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.78rem', borderRadius: 8, padding: '0.3rem 0.75rem' }}>
              Out of Stock
            </span>
          </div>
        )}
        {lowStock && !outOfStock && (
          <span style={{
            position: 'absolute', bottom: '2rem', right: '0.5rem',
            background: 'rgba(239,68,68,0.9)', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700, borderRadius: 6,
            padding: '0.15rem 0.45rem',
          }}>
            Only {stock} left!
          </span>
        )}

        {/* Match % badge */}
        {product.match_pct != null && (
          <span
            style={{
              position: 'absolute', top: '0.4rem', right: '0.5rem',
              background: product.match_pct >= 90 ? '#22c55e' : product.match_pct >= 75 ? '#f59e0b' : '#6c63ff',
              color: '#fff', fontSize: '0.65rem', fontWeight: 800,
              borderRadius: 999, padding: '0.15rem 0.5rem',
            }}
          >
            {product.match_pct}% match
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-name">{product.name}</h3>
        {product.reason && (
          <p style={{ fontSize: '0.7rem', color: '#6c63ff', fontWeight: 600, margin: '0.15rem 0 0.2rem', opacity: 0.85 }}>
            💡 {product.reason}
          </p>
        )}
        <p className="product-description">{product.description || ''}</p>
        <div className="product-meta">
          {isFlash && product.original_price ? (
            <span className="product-price" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ color: '#e11d48', fontWeight: 900 }}>₹{Number(product.price).toLocaleString('en-IN')}</span>
              <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.75em' }}>₹{Number(product.original_price).toLocaleString('en-IN')}</span>
            </span>
          ) : priceStr && (
            <span className="product-price">{priceStr}</span>
          )}
          {product.avg_rating && (
            <span className="product-rating">⭐ {parseFloat(product.avg_rating).toFixed(1)}</span>
          )}
        </div>

        {/* Social proof */}
        {proof && (proof.sold_today > 0 || proof.viewing > 1) && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            {proof.sold_today > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', borderRadius: 99, padding: '0.1rem 0.45rem' }}>
                🔥 {proof.sold_today} sold today
              </span>
            )}
            {proof.viewing > 1 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6c63ff', background: '#f5f3ff', borderRadius: 99, padding: '0.1rem 0.45rem' }}>
                👀 {proof.viewing} viewing
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-actions" onClick={e => e.stopPropagation()}>
        <button
          className={`btn btn-wishlist${inWish ? ' wishlisted' : ''}`}
          onClick={() => onWishlist?.(pid)}
        >
          {inWish ? '❤️ Saved' : '🤍 Wishlist'}
        </button>
        <button
          className="btn btn-rate"
          onClick={() => onRate?.(pid, product.name)}
        >
          ★ Rate
        </button>
        <button
          className={`btn btn-buy${inBuy ? ' bought' : ''}`}
          disabled={outOfStock}
          onClick={() => inBuy ? onRemoveCart?.(pid) : (!outOfStock && onBuy?.(pid))}
        >
          {outOfStock ? '🚫 Out of Stock' : inBuy ? '🗑️ Remove from Cart' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
