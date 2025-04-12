import React from 'react';
import styles from './GlobalStyles.module.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}></div>
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;