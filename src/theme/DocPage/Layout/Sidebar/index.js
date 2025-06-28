import React from 'react';
import {DocSidebarItemsExpandedStateProvider} from '@docusaurus/theme-common/internal';
import DocSidebar from '@theme/DocSidebar';

export default function DocPageLayoutSidebar({sidebar, isMobile}) {
  return (
    <aside>
      <DocSidebarItemsExpandedStateProvider>
        <DocSidebar
          sidebar={sidebar}
        />
      </DocSidebarItemsExpandedStateProvider>
    </aside>
  );
}