import { useState, useMemo, useEffect } from 'react';
import ProductGrid from './ProductGrid';

const PAGE_SIZE = 8;

function SidebarFilters({ products, filters, setFilters }) {
  const categories = useMemo(() => {
    const s = new Set(
      products
        .map(p => (p.category || '').trim())
        .filter(c => c && c.toLowerCase() !== 'all')
    );
    return Array.from(s).sort();
  }, [products]);

  const priceRange = useMemo(() => {
    const ps = products.map(p => parseFloat(p.price) || 0).filter(p => p > 0);
    return ps.length ? { min: Math.floor(Math.min(...ps)), max: Math.ceil(Math.max(...ps)) } : null;
  }, [products]);

  const activeCount = [filters.category, filters.priceMin, filters.priceMax, filters.minRating].filter(Boolean).length;

  return (
    <aside className="filter-sidebar">
      {/* Header */}
      <div className="filter-sidebar-header">
        <span>⚙ Filters</span>
        {activeCount > 0 && (
          <button
            className="filter-reset-btn filter-reset-btn--header"
            onClick={() => setFilters({ category: null, priceMin: null, priceMax: null, minRating: null })}
          >
            Reset ({activeCount})
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="filter-sidebar-section">
          <div className="filter-sidebar-section-title">Category</div>
          <button
            className={`filter-sidebar-cat${!filters.category ? ' active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, category: null }))}
          >
            <span>All</span>
            <span className="filter-sidebar-count">{products.length}</span>
          </button>
          {categories.map(cat => {
            const cnt = products.filter(p => (p.category || '').trim() === cat).length;
            return (
              <button
                key={cat}
                className={`filter-sidebar-cat${filters.category === cat ? ' active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? null : cat }))}
              >
                <span>{cat}</span>
                <span className="filter-sidebar-count">{cnt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Price */}
      {priceRange && (
        <div className="filter-sidebar-section">
          <div className="filter-sidebar-section-title">💰 Price (₹)</div>
          <div className="filter-sidebar-price">
            <input
              type="number" min="0"
              className="filter-price-input"
              placeholder={`Min ${priceRange.min}`}
              value={filters.priceMin || ''}
              onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value ? Number(e.target.value) : null }))}
            />
            <span className="filter-price-sep">–</span>
            <input
              type="number" min="0"
              className="filter-price-input"
              placeholder={`Max ${priceRange.max}`}
              value={filters.priceMax || ''}
              onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
        </div>
      )}

      {/* Min rating */}
      <div className="filter-sidebar-section">
        <div className="filter-sidebar-section-title">⭐ Min Rating</div>
        <div className="filter-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`filter-star${filters.minRating >= star ? ' active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === star ? null : star }))}
              title={`${star}★ & above`}
            >★</button>
          ))}
          {filters.minRating && (
            <button className="filter-clear-btn" onClick={() => setFilters(f => ({ ...f, minRating: null }))}>✕</button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function Section({ icon, title, subtitle, badge, products, loading, emptyMsg, cardProps, showFilters = false }) {
  const [filters, setFilters]           = useState({ category: null, priceMin: null, priceMax: null, minRating: null });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (filters.category && (p.category || '').trim() !== filters.category) return false;
      const price = parseFloat(p.price) || 0;
      if (filters.priceMin && price < filters.priceMin) return false;
      if (filters.priceMax && price > filters.priceMax) return false;
      if (filters.minRating && (parseFloat(p.avg_rating) || 0) < filters.minRating) return false;
      return true;
    });
  }, [products, filters]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const showSidebar = showFilters && !loading && products && products.length > 1;

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-title-group">
          <h2>{icon} {title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {badge > 0 && <span className="section-badge">{badge}</span>}
      </div>

      <div className={showSidebar ? 'section-with-sidebar' : undefined}>
        {showSidebar && (
          <SidebarFilters products={products} filters={filters} setFilters={setFilters} />
        )}

        <div className="section-main">
          <ProductGrid
            products={visible}
            emptyMsg={emptyMsg}
            loading={loading}
            cardProps={cardProps}
          />

          {!loading && hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                Load More <span className="load-more-count">({filtered.length - visibleCount} more)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
