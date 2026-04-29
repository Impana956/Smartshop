import { useState, useMemo } from 'react';
import ProductGrid from './ProductGrid';

const PRESETS = [500, 1000, 2000, 5000, 10000];

export default function SearchSection({ query, results, fallback, loading, cardProps, onClear }) {
  const [maxBudget, setMaxBudget] = useState(null);
  const [customBudget, setCustomBudget] = useState('');

  const subtitle = fallback
    ? `No exact matches for "${query}" — showing popular products`
    : `Results for: "${query}"`;

  const priceRange = useMemo(() => {
    const ps = (results || []).map(p => parseFloat(p.price) || 0).filter(p => p > 0);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
  }, [results]);

  const filtered = useMemo(() => {
    if (!maxBudget || !results) return results;
    return results.filter(p => {
      const pr = parseFloat(p.price) || 0;
      return pr === 0 || pr <= maxBudget;
    });
  }, [results, maxBudget]);

  const handleCustom = (e) => {
    e.preventDefault();
    const val = parseFloat(customBudget);
    if (val > 0) setMaxBudget(val);
  };

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-title-group">
          <h2>🔍 Search Results</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <button className="clear-search-btn" onClick={onClear}>✕ Clear</button>
      </div>

      {/* ── Budget filter bar ── */}
      {!loading && results && results.length > 0 && (
        <div className="search-budget-bar">
          <span className="search-budget-label">💰 Budget:</span>
          <div className="search-budget-chips">
            <button
              className={`search-budget-chip${!maxBudget ? ' active' : ''}`}
              onClick={() => { setMaxBudget(null); setCustomBudget(''); }}
            >All</button>
            {PRESETS.filter(p => !priceRange || p <= priceRange.max * 1.2).map(p => (
              <button
                key={p}
                className={`search-budget-chip${maxBudget === p ? ' active' : ''}`}
                onClick={() => { setMaxBudget(p); setCustomBudget(''); }}
              >
                Under ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <form onSubmit={handleCustom} className="search-budget-custom">
            <span style={{ color: '#9ca3af', fontSize: '0.82rem', pointerEvents: 'none' }}>₹</span>
            <input
              type="number" min="1" placeholder="Custom max"
              value={customBudget}
              onChange={e => setCustomBudget(e.target.value)}
              className="search-budget-input"
            />
            <button type="submit" className="search-budget-go">Go</button>
          </form>
          {maxBudget && (
            <span className="search-budget-active">
              Showing under ₹{maxBudget.toLocaleString('en-IN')}
              &nbsp;({filtered.length} products)
              <button onClick={() => { setMaxBudget(null); setCustomBudget(''); }} className="search-budget-clear">✕</button>
            </span>
          )}
        </div>
      )}

      <ProductGrid
        products={filtered}
        emptyMsg={maxBudget ? `No products under ₹${maxBudget.toLocaleString('en-IN')} for "${query}". Try a higher budget.` : `No products found for "${query}". Try a different keyword.`}
        loading={loading}
        cardProps={cardProps}
      />
    </section>
  );
}
