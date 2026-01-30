import React from 'react';
import DocSidebar from '@theme-original/DocSidebar';
import './styles.css';  // Import as global CSS, not CSS module

export default function DocSidebarWrapper(props) {
  return (
    <>
      <DocSidebar {...props} />
    </>
  );
}