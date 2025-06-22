import React from 'react';
import Layout from '@theme-original/DocPage/Layout';
import styles from './styles.module.css';

export default function LayoutWrapper(props) {
  return (
    <div className={styles.layoutContainer}>
      <div className={styles.layoutInner}>
        <Layout {...props} />
      </div>
    </div>
  );
}