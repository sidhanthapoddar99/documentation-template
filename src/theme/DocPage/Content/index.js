import React from 'react';
import DocContent from '@theme-original/DocPage/Content';
import styles from './styles.module.css';

export default function DocPageContent(props) {
  return (
    <div className={styles.docContent}>
      <div className={styles.contentWrapper}>
        <DocContent {...props} />
      </div>
    </div>
  );
}