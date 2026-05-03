import { useState, useRef, useEffect, useCallback } from 'react';
import { logout } from '../api';

const TABS = [
  { id: 'home',     icon: '✨', label: 'Recommended' },
  { id: 'trending', icon: '🔥', label: 'Trending'    },
  { id: 'toprated', icon: '⭐', label: 'Top Rated'   },
  { id: 'wishlist', icon: '❤️', label: 'Wishlist'    },
  { id: 'cart',     icon: '🛒', label: 'Cart'        },
  { id: 'orders',   icon: '📦', label: 'Orders'      },
  { id: 'profile',  icon: '👤', label: 'Profile'     },
];

const HISTORY_KEY = 'ecommerce_search_history';
const MAX_HISTORY = 5;
const THEME_KEY   = 'ecommerce_theme';

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(query, prev) {
  const next = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
}

export default function Navbar({ userName, onSearch, onLogout, activeTab, onTabChange, wishlistCount, cartCount, ordersCount }) {
  const [history,      setHistory]      = useState(getHistory);
  const [showHistory,  setShowHistory]  = useState(false);
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSuggest,  setShowSuggest]  = useState(false);
  const [darkMode,     setDarkMode]     = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const inputRef   = useRef(null);
  const wrapperRef = useRef(null);
  const suggestTimer = useRef(null);

  // Apply persisted theme on mount
  useEffect(() => { applyTheme(darkMode); }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    applyTheme(next);
  };

  useEffect(() => {
    function close(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowHistory(false);
        setShowSuggest(false);
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggest(false); return; }
    try {
      const res  = await fetch('/api/search/suggestions?q=' + encodeURIComponent(q));
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggest(data.length > 0);
    } catch { setSuggestions([]); }
  }, []);

  const handleInputChange = (e) => {
    const q = e.target.value;
    clearTimeout(suggestTimer.current);
    if (q.length >= 2) {
      setShowHistory(false);
      suggestTimer.current = setTimeout(() => fetchSuggestions(q), 220);
    } else {
      setSuggestions([]); setShowSuggest(false);
      if (q.length === 0 && history.length > 0) setShowHistory(true);
    }
  };

  const runSearch = (q) => {
    const next = saveHistory(q, history);
    setHistory(next);
    setShowHistory(false);
    setShowSuggest(false);
    setSuggestions([]);
    if (inputRef.current) inputRef.current.value = q;
    onSearch(q);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = e.currentTarget.elements.searchInput.value.trim();
    if (q) runSearch(q);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setShowHistory(false);
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <nav className="navbar">
      {/* Top row */}
      <div className="navbar-top">
        <div className="nav-brand">
          <span className="logo">🛍️</span>
          <span className="brand-name">SmartShop</span>
        </div>

        <div className="search-wrapper" ref={wrapperRef}>
          <form className="search-form" role="search" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="search"
              name="searchInput"
              className="search-input"
              placeholder="Search products, brands, categories…"
              autoComplete="off"
              aria-label="Search products"
              onFocus={() => {
                if (inputRef.current?.value.length >= 2) setShowSuggest(suggestions.length > 0);
                else if (history.length > 0) setShowHistory(true);
              }}
              onChange={handleInputChange}
            />
            <button type="submit" className="search-btn" aria-label="Search">🔍</button>
          </form>

          {/* Autocomplete suggestions */}
          {showSuggest && suggestions.length > 0 && (
            <div className="search-history-dropdown">
              <div className="search-history-header">
                <span className="search-history-label">🔍 Suggestions</span>
                <button className="search-history-clear" onClick={() => setShowSuggest(false)}>✕</button>
              </div>
              {suggestions.map(s => (
                <button key={s.product_id} className="search-history-item suggest-item"
                  onClick={() => runSearch(s.name)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    {s.image && (
                      <img src={s.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f4f6', flexShrink: 0 }}
                        onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{(s.category || '').split('|')[0].trim()}{s.price > 0 ? ` · ₹${Number(s.price).toLocaleString('en-IN')}` : ''}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent search history */}
          {showHistory && !showSuggest && history.length > 0 && (
            <div className="search-history-dropdown">
              <div className="search-history-header">
                <span className="search-history-label">🕐 Recent Searches</span>
                <button className="search-history-clear" onClick={clearHistory}>Clear</button>
              </div>
              {history.map((q, i) => (
                <button key={i} className="search-history-item" onClick={() => runSearch(q)}>
                  🔍 {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="nav-user">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: darkMode ? '#252540' : '#f3f4f6',
              border: '1.5px solid ' + (darkMode ? '#3d3d60' : '#e5e7eb'),
              borderRadius: 999, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '1rem', transition: 'all .2s',
              flexShrink: 0,
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <span className="user-greeting">
            <span className="user-avatar">{userName ? userName[0].toUpperCase() : '?'}</span>
            <span className="user-name-text">{userName}</span>
          </span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tab row */}
      <div className="navbar-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            <span className="nav-tab-label">{tab.label}</span>
            {tab.id === 'wishlist' && wishlistCount > 0 && (
              <span className="nav-tab-badge">{wishlistCount}</span>
            )}
            {tab.id === 'cart' && cartCount > 0 && (
              <span className="nav-tab-badge">{cartCount}</span>
            )}
            {tab.id === 'orders' && ordersCount > 0 && (
              <span className="nav-tab-badge">{ordersCount}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

