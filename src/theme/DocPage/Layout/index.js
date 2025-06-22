import React from 'react';
import clsx from 'clsx';
import {useWindowSize} from '@docusaurus/theme-common';
import {useDocsSidebar} from '@docusaurus/theme-common/internal';
import DocPageLayoutSidebar from './Sidebar';
import DocPageLayoutMain from './Main';
import { Footer } from '@site/src/components/elements';
import styles from './styles.module.css';

export default function DocPageLayout({children}) {
  const sidebar = useDocsSidebar();
  const windowSize = useWindowSize();
  const canRenderSidebar = sidebar && sidebar.items.length > 0;
  const isMobile = windowSize === 'mobile';

  return (
    <>
      <div className={styles.docPage}>
        <div className={styles.docLayout}>
          {canRenderSidebar && (
            <DocPageLayoutSidebar 
              sidebar={sidebar.items}
              isMobile={isMobile}
            />
          )}
          <DocPageLayoutMain isMobile={isMobile}>
            {children}
          </DocPageLayoutMain>
        </div>
      </div>
      <Footer />
    </>
  );
}