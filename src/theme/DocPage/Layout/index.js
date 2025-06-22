import React from 'react';
import Layout from '@theme-original/DocPage/Layout';
import clsx from 'clsx';
import containerStyles from '../Container/styles.module.css';
import sidebarStyles from '../Sidebar/styles.module.css';
import contentStyles from '../Content/styles.module.css';
import tocStyles from '../TOC/styles.module.css';

export default function DocPageLayoutWrapper(props) {
  // Apply custom class names to the original layout components
  React.useEffect(() => {
    // Apply container styles
    const docsWrapper = document.querySelector('.docsWrapper');
    if (docsWrapper) {
      docsWrapper.classList.add(containerStyles.docsWrapper);
    }

    // Apply sidebar styles
    const sidebar = document.querySelector('.theme-doc-sidebar-container');
    if (sidebar) {
      sidebar.classList.add(sidebarStyles.sidebarContainer);
    }

    // Apply content styles
    const mainContainer = document.querySelector('.docMainContainer');
    if (mainContainer) {
      mainContainer.classList.add(contentStyles.contentContainer);
    }

    // Apply TOC styles
    const toc = document.querySelector('.theme-doc-toc-desktop');
    if (toc) {
      toc.classList.add(tocStyles.tocContainer);
    }

    // Apply article styles
    const article = document.querySelector('article');
    if (article) {
      article.classList.add(contentStyles.article);
    }
  }, []);

  return (
    <div className={containerStyles.mainContainer}>
      <Layout {...props} />
    </div>
  );
}