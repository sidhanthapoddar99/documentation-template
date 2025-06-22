import React from 'react';
import styles from './styles.module.css';

// Global Root wrapper that provides the ONLY max-width constraint in the entire app
export default function Root({children}) {
  return (
    <div className={styles.globalWrapper}>
      {children}
    </div>
  );
}