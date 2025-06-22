import React from 'react';
import {HtmlClassNameProvider} from '@docusaurus/theme-common';
import {
  docVersionSearchTag,
  DocsSidebarProvider,
  DocsVersionProvider,
  useDocRouteMetadata,
} from '@docusaurus/theme-common/internal';
import DocPageLayout from '@theme/DocPage/Layout';
import NotFoundContent from '@theme/NotFound/Content';
import SearchMetadata from '@theme/SearchMetadata';
import clsx from 'clsx';

function DocPageMetadata(props) {
  const {versionMetadata} = props;
  return (
    <>
      <SearchMetadata
        version={versionMetadata.version}
        tag={docVersionSearchTag(
          versionMetadata.pluginId,
          versionMetadata.version,
        )}
      />
    </>
  );
}

export default function DocPage(props) {
  const {versionMetadata} = props;
  const currentDocRouteMetadata = useDocRouteMetadata(props);
  
  if (!currentDocRouteMetadata) {
    return <NotFoundContent />;
  }
  
  const {docElement, sidebarName, sidebarItems} = currentDocRouteMetadata;
  
  return (
    <>
      <DocPageMetadata {...props} />
      <HtmlClassNameProvider
        className={clsx(
          'docs-page',
          `docs-page-${versionMetadata.version}`,
          'docs-no-footer', // Add this class to identify doc pages
        )}>
        <DocsVersionProvider version={versionMetadata}>
          <DocsSidebarProvider sidebar={sidebarItems} name={sidebarName}>
            <DocPageLayout>{docElement}</DocPageLayout>
          </DocsSidebarProvider>
        </DocsVersionProvider>
      </HtmlClassNameProvider>
    </>
  );
}