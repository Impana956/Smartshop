import ProductCard from './ProductCard';

export default function ProductGrid({ products, emptyMsg, loading, cardProps }) {
  if (loading) {
    return (
      <div className="product-grid">
        {[...Array(4)].map((_, i) => <div key={i} className="loading-skeleton" />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid">
        <p className="empty-message">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map(p => (
        <ProductCard key={p.product_id} product={p} {...cardProps} />
      ))}
    </div>
  );
}
