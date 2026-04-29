import { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  { icon: '📱', name: 'Electronics',   color: '#3b82f6' },
  { icon: '👗', name: 'Fashion',        color: '#ec4899' },
  { icon: '🛒', name: 'Groceries',      color: '#22c55e' },
  { icon: '🏠', name: 'Home & Living',  color: '#f59e0b' },
  { icon: '💄', name: 'Beauty',         color: '#a855f7' },
  { icon: '📚', name: 'Books',          color: '#06b6d4' },
  { icon: '⚽', name: 'Sports',         color: '#10b981' },
  { icon: '🧸', name: 'Toys',           color: '#f97316' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Recommendations',  desc: 'Hyper-personalised picks that learn from every click, wishlist and purchase.' },
  { icon: '🔥', title: 'Real-Time Trending',   desc: 'See what millions of shoppers are buying right now — updated live.' },
  { icon: '⭐', title: 'Top-Rated Products',   desc: 'Every product ranked by genuine user ratings so you always buy the best.' },
  { icon: '❤️', title: 'Smart Wishlist',        desc: 'Save products you love and come back whenever you are ready.' },
  { icon: '🔍', title: 'Intelligent Search',   desc: 'Search by keyword, brand or category — we always find the best match.' },
  { icon: '⚡', title: 'Lightning Fast',        desc: 'Instant results and real-time personalisation on every page.' },
];

const STATS = [
  { num: '10K+',  label: 'Products' },
  { num: '1,500+', label: 'Categories' },
  { num: '50K+',  label: 'Happy Shoppers' },
  { num: '24/7',  label: 'Support' },
];

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function LandingPage({ onLogin }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm,   setRegForm]   = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('login');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [showRegPw,     setShowRegPw]     = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [catRef,  catVisible]  = useReveal();
  const [featRef, featVisible] = useReveal();
  const [howRef,  howVisible]  = useReveal();

  const switchTab = (tab) => { setActiveTab(tab); setError(''); setSuccess(''); setFieldErrors({}); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.ok) onLogin(data.user);
      else setError(data.error || 'Invalid email or password.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const errs = {};
    if (!regForm.name.trim())                        errs.name = 'Full name is required.';
    if (!regForm.email.includes('@'))                errs.email = 'Enter a valid email address.';
    if (regForm.password.length < 6)                 errs.password = 'Password must be at least 6 characters.';
    if (regForm.password !== regForm.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res  = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regForm.name, email: regForm.email, password: regForm.password }),
      });
      const data = await res.json();
      if (data.ok) {
        setRegForm({ name: '', email: '', password: '', confirmPassword: '' });
        setSuccess('Account created! Please sign in with your password.');
        switchTab('login');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp">

      {/* ══ NAVBAR ══ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#lp-hero" className="lp-brand">
            <span>🛍️</span>
            <span className="lp-brand-name">E-commerce Recommendation Engine</span>
          </a>

          <ul className={`lp-links${menuOpen ? ' open' : ''}`}>
            <li><a href="#lp-categories" onClick={() => setMenuOpen(false)}>Categories</a></li>
            <li><a href="#lp-features"   onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#lp-how"        onClick={() => setMenuOpen(false)}>How it Works</a></li>
            <li>
              <button className="lp-nav-sign"  onClick={() => { switchTab('login');    setMenuOpen(false); document.getElementById('lp-hero').scrollIntoView({behavior:'smooth'}); }}>Sign In</button>
            </li>
            <li>
              <button className="lp-nav-cta"   onClick={() => { switchTab('register'); setMenuOpen(false); document.getElementById('lp-hero').scrollIntoView({behavior:'smooth'}); }}>Get Started</button>
            </li>
          </ul>

          <button className="lp-hamburger" aria-label="Menu"
            onClick={() => setMenuOpen(o => !o)}>
            <span className={menuOpen ? 'hbar cross1' : 'hbar'} />
            <span className={menuOpen ? 'hbar hide'   : 'hbar'} />
            <span className={menuOpen ? 'hbar cross2' : 'hbar'} />
          </button>
        </div>
      </nav>

      {/* ══ HERO — split layout ══ */}
      <section className="lp-hero" id="lp-hero">
        <div className="lp-hero-inner lp-hero-split">

          {/* Left: marketing copy */}
          <div className="lp-hero-text">
            <span className="lp-badge">🚀 AI-Powered Shopping</span>
            <h1>Welcome to<br /><span className="lp-hero-hl">E-commerce Recommendation Engine</span></h1>
            <p>Discover products made just for you. Our AI learns your taste from every click, wishlist and purchase.</p>
            <ul className="lp-hero-perks">
              <li>🤖 Personalised AI recommendations</li>
              <li>🔥 Real-time trending products</li>
              <li>❤️ Smart wishlist &amp; cart</li>
              <li>⭐ Top-rated picks just for you</li>
            </ul>
          </div>

          {/* Right: always-visible auth card */}
          <div className="lp-auth-panel">
            <div className="lp-tabs">
              <button
                className={activeTab === 'login' ? 'lp-tab active' : 'lp-tab'}
                onClick={() => switchTab('login')}>Sign In</button>
              <button
                className={activeTab === 'register' ? 'lp-tab active' : 'lp-tab'}
                onClick={() => switchTab('register')}>Register</button>
            </div>

            {error   && <div className="lp-auth-error">{error}</div>}
            {success && <div className="lp-auth-success">{success}</div>}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="lp-form">
                <div className="lp-field">
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com" required autoComplete="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="lp-field">
                  <label>Password</label>
                  <div className="lp-pw-wrap">
                    <input type={showLoginPw ? 'text' : 'password'} placeholder="Your password" required autoComplete="current-password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowLoginPw(v => !v)}>
                      {showLoginPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="lp-form-btn" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
                <p className="lp-auth-switch">
                  Don't have an account?{' '}
                  <button type="button" className="lp-auth-link" onClick={() => switchTab('register')}>Register free</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="lp-form">
                <div className="lp-field">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your name" required autoComplete="name"
                    style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                    value={regForm.name}
                    onChange={e => { setRegForm(f => ({ ...f, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: '' })); }} />
                  {fieldErrors.name && <span className="lp-field-error">{fieldErrors.name}</span>}
                </div>
                <div className="lp-field">
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com" required autoComplete="email"
                    style={fieldErrors.email ? { borderColor: '#ef4444' } : {}}
                    value={regForm.email}
                    onChange={e => { setRegForm(f => ({ ...f, email: e.target.value })); setFieldErrors(fe => ({ ...fe, email: '' })); }} />
                  {fieldErrors.email && <span className="lp-field-error">{fieldErrors.email}</span>}
                </div>
                <div className="lp-field">
                  <label>Password</label>
                  <div className="lp-pw-wrap" style={fieldErrors.password ? { '--pw-border': '#ef4444' } : {}}>
                    <input type={showRegPw ? 'text' : 'password'} placeholder="Min 6 characters" required minLength={6} autoComplete="new-password"
                      style={fieldErrors.password ? { borderColor: '#ef4444' } : {}}
                      value={regForm.password}
                      onChange={e => { setRegForm(f => ({ ...f, password: e.target.value })); setFieldErrors(fe => ({ ...fe, password: '', confirmPassword: '' })); }} />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowRegPw(v => !v)}>
                      {showRegPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="lp-field-error">{fieldErrors.password}</span>}
                </div>
                <div className="lp-field">
                  <label>Confirm Password</label>
                  <div className="lp-pw-wrap">
                    <input type={showConfirmPw ? 'text' : 'password'} placeholder="Re-enter your password" required autoComplete="new-password"
                      style={fieldErrors.confirmPassword ? { borderColor: '#ef4444' } : regForm.confirmPassword && regForm.confirmPassword === regForm.password ? { borderColor: '#22c55e' } : {}}
                      value={regForm.confirmPassword}
                      onChange={e => { setRegForm(f => ({ ...f, confirmPassword: e.target.value })); setFieldErrors(fe => ({ ...fe, confirmPassword: '' })); }} />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowConfirmPw(v => !v)}>
                      {showConfirmPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword
                    ? <span className="lp-field-error">{fieldErrors.confirmPassword}</span>
                    : regForm.confirmPassword && regForm.confirmPassword === regForm.password
                      ? <span className="lp-field-success">✓ Passwords match</span>
                      : null}
                </div>
                <button type="submit" className="lp-form-btn" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account →'}
                </button>
                <p className="lp-auth-switch">
                  Already have an account?{' '}
                  <button type="button" className="lp-auth-link" onClick={() => switchTab('login')}>Sign in</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <div className="lp-stats">
        {STATS.map(s => (
          <div key={s.label} className="lp-stat">
            <span className="lp-stat-num">{s.num}</span>
            <span className="lp-stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══ CATEGORIES ══ */}
      <section className="lp-section" id="lp-categories" ref={catRef}>
        <div className={`lp-sec-inner${catVisible ? ' revealed' : ''}`}>
          <div className="lp-sec-hdr">
            <h2>Shop by Category</h2>
            <p>Explore thousands of products across every category</p>
          </div>
          <div className="lp-cat-grid">
            {CATEGORIES.map(cat => (
              <button key={cat.name} className="lp-cat-card"
                style={{ '--cc': cat.color }}
                onClick={() => { switchTab('register'); document.getElementById('lp-hero').scrollIntoView({behavior:'smooth'}); }}>
                <span className="lp-cat-icon">{cat.icon}</span>
                <span className="lp-cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="lp-section lp-alt" id="lp-features" ref={featRef}>
        <div className={`lp-sec-inner${featVisible ? ' revealed' : ''}`}>
          <div className="lp-sec-hdr">
            <h2>Everything You Need to Shop Smart</h2>
            <p>Powered by AI, built for real shoppers</p>
          </div>
          <div className="lp-feat-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feat-card">
                <span className="lp-feat-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="lp-section" id="lp-how" ref={howRef}>
        <div className={`lp-sec-inner${howVisible ? ' revealed' : ''}`}>
          <div className="lp-sec-hdr">
            <h2>How It Works</h2>
            <p>Up and shopping in 3 simple steps</p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <h3>Create Account</h3>
              <p>Sign up free in 30 seconds — no credit card needed.</p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <h3>Browse &amp; Interact</h3>
              <p>Search, wishlist and buy. Our AI learns your taste in real time.</p>
            </div>
            <div className="lp-step-arrow">→</div>
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <h3>Get Personalised Picks</h3>
              <p>Your feed updates live with products made just for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BOTTOM ══ */}
      <section className="lp-cta-section">
        <h2>Ready to discover your next favourite?</h2>
        <p>Join thousands of smart shoppers today — it's free.</p>
        <button className="lp-btn-primary large"
          onClick={() => { switchTab('register'); document.getElementById('lp-hero').scrollIntoView({behavior:'smooth'}); }}>
          Get Started Free →
        </button>
      </section>

      <footer className="lp-footer">
        <p>© 2026 E-commerce Recommendation Engine · AI-Powered Shopping Platform</p>
      </footer>

    </div>
  );
}

