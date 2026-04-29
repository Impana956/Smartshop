import { useState } from 'react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RateModal({ open, productName, onSubmit, onClose }) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (!open) return null;

  const display = hovered || selected;

  const handleSubmit = () => {
    if (!selected) return;
    const val = selected;
    setSelected(0);
    setHovered(0);
    onSubmit(val);
  };

  const handleClose = () => {
    setSelected(0);
    setHovered(0);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{ display: 'flex' }}
    >
      <div className="modal">
        <h3 id="modalTitle">Rate this Product</h3>
        <p className="modal-product-name">{productName}</p>

        <div className="star-selector" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map(val => (
            <span
              key={val}
              className={`star-opt${display >= val ? ' selected' : ''}`}
              onMouseEnter={() => setHovered(val)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(val)}
              tabIndex={0}
              role="radio"
              aria-label={`${val} star${val > 1 ? 's' : ''}`}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelected(val)}
            >
              ★
            </span>
          ))}
        </div>

        <p className="rating-label">
          {selected
            ? `${selected} star${selected > 1 ? 's' : ''} — ${RATING_LABELS[selected]}`
            : 'Select a rating'}
        </p>

        <div className="modal-actions">
          <button
            className="btn-modal-confirm"
            disabled={!selected}
            onClick={handleSubmit}
          >
            Submit Rating
          </button>
          <button className="btn-modal-cancel" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
