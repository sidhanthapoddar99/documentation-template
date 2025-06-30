// src/components/Feature.js
import React from 'react';
import styles from './Feature.module.css';

export default function Feature({icon, title, description}) {
  return (
    <div className={styles.feature}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}