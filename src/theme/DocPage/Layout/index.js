import React from 'react';
import Layout from '@theme-original/DocPage/Layout';
import styles from './styles.module.css';

export default function DocPageLayoutWrapper(props) {
  return (
    <div className={styles.docLayout}>
      <Layout {...props} />
    </div>
  );
}