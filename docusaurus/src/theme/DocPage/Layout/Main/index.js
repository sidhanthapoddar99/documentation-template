import React from 'react';
import clsx from 'clsx';
import {useDocsSidebar} from '@docusaurus/theme-common/internal';
import styles from './styles.module.css';

export default function DocPageLayoutMain({children, isMobile}) {
  const sidebar = useDocsSidebar();
  
  return (
    <main
      className={clsx(
        styles.docMainContainer,
        (isMobile || !sidebar) && styles.docMainContainerEnhanced,
      )}>
      {children}
    </main>
  );
}