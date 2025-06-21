import React from 'react';
import DocPage from '@theme-original/DocPage';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

export default function DocPageWrapper(props) {
  return (
    <div className={styles.docPageWrapper}>
      <DocPage {...props} />
    </div>
  );
}