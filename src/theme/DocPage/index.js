import React from 'react';
import DocPage from '@theme-original/DocPage';
import containerStyles from './Container/styles.module.css';

export default function DocPageWrapper(props) {
  return (
    
    <div className={containerStyles.docPageContainer}>
      <div className={containerStyles.docPageInner}>
        <DocPage {...props} />
      </div>
    </div>
  );
}