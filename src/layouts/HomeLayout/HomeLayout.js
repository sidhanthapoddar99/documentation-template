import React from 'react';
import BaseLayout from '../BaseLayout';
import './HomeLayout.css';

/**
 * HomeLayout - Layout specifically for the homepage
 */
export default function HomeLayout({ 
  children,
  title = 'Home',
  description,
  ...props 
}) {
  return (
    <BaseLayout
      title={title}
      description={description}
      wrapperClassName="home-layout"
      {...props}
    >
      <div className="home-layout-wrapper">
        {children}
      </div>
    </BaseLayout>
  );
}