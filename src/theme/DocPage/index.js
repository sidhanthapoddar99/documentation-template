import React from 'react';
import DocPage from '@theme-original/DocPage';
import './styles.module.css'; // Import for side effects

export default function DocPageWrapper(props) {
  // Apply global class to body when docs page is active
  React.useEffect(() => {
    document.body.classList.add('docs-page-active');
    return () => {
      document.body.classList.remove('docs-page-active');
    };
  }, []);

  return <DocPage {...props} />;
}