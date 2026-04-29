export default function ToastContainer({ toasts }) {
  return (
    <div id="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast show${t.type === 'cart' ? ' toast-cart' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
