const TIERS = [
  { name: 'Bronze',   icon: '🥉', min: 0,    max: 500,  color: '#cd7f32', bar: 'linear-gradient(90deg,#f59e0b80,#cd7f32)' },
  { name: 'Silver',   icon: '🥈', min: 500,  max: 1500, color: '#6b7280', bar: 'linear-gradient(90deg,#9ca3af80,#6b7280)' },
  { name: 'Gold',     icon: '🥇', min: 1500, max: 3000, color: '#f59e0b', bar: 'linear-gradient(90deg,#fde68a,#f59e0b)' },
  { name: 'Platinum', icon: '💎', min: 3000, max: null,  color: '#6c63ff', bar: 'linear-gradient(90deg,#a78bfa,#6c63ff)' },
];

function getLoyaltyTier(points) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) return { ...TIERS[i], idx: i };
  }
  return { ...TIERS[0], idx: 0 };
}

export default function Hero({ userName, stats, loyaltyPoints = 0 }) {
  const tier   = getLoyaltyTier(loyaltyPoints);
  const isMax  = tier.idx === TIERS.length - 1;
  const next   = isMax ? null : TIERS[tier.idx + 1];
  const pct    = isMax ? 100 : Math.min(100, Math.round(((loyaltyPoints - tier.min) / (next.min - tier.min)) * 100));
  const toNext = isMax ? 0 : next.min - loyaltyPoints;

  return (
    <div className="hero" id="heroSection">
      <div className="hero-content">
        <h1>Hello, <span>{userName}</span>! 👋</h1>
        <p>Discover products tailored to your taste, updated in real-time.</p>
      </div>
      <div className="hero-stats">
        <div className="stat-card">
          <span className="stat-num">{stats.purchased}</span>
          <span className="stat-label">In Cart</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.wishlisted}</span>
          <span className="stat-label">Wishlisted</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.purchased + stats.wishlisted}</span>
          <span className="stat-label">Activity</span>
        </div>
        <div className="stat-card loyalty-tier-card">
          <div className="loyalty-tier-top">
            <span className="loyalty-tier-icon">{tier.icon}</span>
            <div>
              <div className="loyalty-tier-name" style={{ color: tier.color }}>{tier.name} Member</div>
              <div className="loyalty-tier-pts">⭐ {loyaltyPoints.toLocaleString()} pts · ₹{Math.floor(loyaltyPoints / 10)} value</div>
            </div>
          </div>
          <div className="loyalty-bar-track">
            <div className="loyalty-bar-fill" style={{ width: `${pct}%`, background: tier.bar }} />
          </div>
          <div className="loyalty-tier-hint">
            {isMax ? '🏆 Max tier reached!' : `${toNext.toLocaleString()} pts to ${next.icon} ${next.name}`}
          </div>
        </div>
      </div>
    </div>
  );
}
