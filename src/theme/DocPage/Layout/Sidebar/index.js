import React from 'react';
import {DocSidebarItemsExpandedStateProvider} from '@docusaurus/theme-common/internal';
import DocSidebar from '@theme/DocSidebar';
import styles from '../../Sidebar/styles.module.css';
import clsx from 'clsx';

export default function DocPageLayoutSidebar({sidebar, isMobile}) {
  const [hiddenSidebar, setHiddenSidebar] = React.useState(false);
  
  return (
    <aside
      className={clsx(
        styles.docSidebarContainer,
        hiddenSidebar && styles.docSidebarContainerHidden,
      )}
      onTransitionEnd={(e) => {
        if (!e.currentTarget.classList.contains(styles.docSidebarContainer)) {
          return;
        }
        if (hiddenSidebar) {
          setHiddenSidebar(false);
        }
      }}>
      <DocSidebarItemsExpandedStateProvider>
        <div className={styles.sidebarViewport}>
          <DocSidebar
            sidebar={sidebar}
            onCollapse={() => setHiddenSidebar(true)}
            isHidden={hiddenSidebar}
          />
          {hiddenSidebar && (
            <div
              className={styles.collapsedDocSidebar}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setHiddenSidebar(false);
                }
              }}
              onClick={() => setHiddenSidebar(false)}>
              <svg width="20" height="20" aria-hidden="true" className={styles.sidebarArrow}>
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>
      </DocSidebarItemsExpandedStateProvider>
    </aside>
  );
}