import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductStyles.module.css';

const ProductCard = ({ product }) => {
  // Determine the image source with fallback
  const productImage = product.image_path || product.image_url || 'https://via.placeholder.com/300x180?text=No+Image';

  return (
    <div className={styles.productCard}>
      <Link to={`/product/${product.id}`} className={styles.productLink}>
        <div className={styles.productImageContainer}>
          <img 
            src={productImage} 
            alt={product.name}
            className={styles.productImage}
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
            }}
          />
        </div>
        <div className={styles.productInfo}>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.productPrice}>${product.price}</p>
          <p className={styles.productQuantity}>Available: {product.quantity}</p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;