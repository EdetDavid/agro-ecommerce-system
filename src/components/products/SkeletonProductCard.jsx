import React from 'react';
import styles from './ProductStyles.module.css'; // Reuse existing styles

const SkeletonProductCard = () => {
  return (
    <div className={`${styles.productCard} ${styles.skeleton}`}> {/* Add skeleton class */}
      <div className={styles.productImageContainer}>
        {/* Skeleton image placeholder */}
      </div>
      <div className={styles.productInfo}>
        <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
        <div className={`${styles.skeletonText} ${styles.skeletonPrice}`}></div>
        <div className={`${styles.skeletonText} ${styles.skeletonQuantity}`}></div>
      </div>
    </div>
  );
};

export default SkeletonProductCard;