import React from 'react';
import DocPage from '@theme-original/DocPage';
import './styles.module.css'; // Import for side effects

export default function DocPageWrapper(props) {
  return <DocPage {...props} />;
}