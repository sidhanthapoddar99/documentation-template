import React from 'react';
import { useThemeConfig, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import { useWindowSize } from '@docusaurus/theme-common';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '../Search';
import styles from './styles.module.css';

function useNavbarItems() {
  return useThemeConfig().navbar.items;
}

function NavbarItems({ items }) {
  return (
    <>
      {items.map((item, i) => (
        <NavbarItem {...item} key={i} />
      ))}
    </>
  );
}

export default function NavbarContent() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const windowSize = useWindowSize();
  const isMobile = windowSize === 'mobile' || windowSize === 'ssr';

  // Separate nav items from other items
  const navItems = items.filter(item => item.className?.includes('navbar__item--nav'));
  const otherItems = items.filter(item => !item.className?.includes('navbar__item--nav'));

  // For mobile, show the original layout
  if (isMobile) {
    const [leftItems, rightItems] = splitNavbarItems(items);
    return (
      <div className={styles.navbarContent}>

        <div className={styles.navbarContentLeft}>
                    {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
      </div>

        <div className={styles.navbarContentLeft}>
          <NavbarLogo />
        </div>
        <div className={styles.navbarContentRight}>
          <NavbarItems items={rightItems} />
          <NavbarSearch mobile />
        </div>
      </div>
    );
  }

  // Desktop two-row layout
  return (
    <div className={styles.navbarRows}>
      {/* First Row: Logo, Search, Theme Toggle */}
      <div className={styles.navbarFirstRow}>
        <div className={styles.navbarFirstRowLeft}>
          <NavbarLogo />
        </div>
        <div className={styles.navbarFirstRowCenter}>
          <NavbarSearch />
        </div>
        <div className={styles.navbarFirstRowRight}>
          <NavbarColorModeToggle className={styles.colorModeToggle} />
        </div>
      </div>
      
      {/* Second Row: Navigation Items */}
      <div className={styles.navbarSecondRow}>
        <div className={styles.navbarSecondRowContent}>
          <NavbarItems items={navItems} />
        </div>
      </div>
    </div>
  );
}

function splitNavbarItems(items) {
  const leftItems = items.filter((item) => item.position === 'left');
  const rightItems = items.filter((item) => item.position === 'right');
  return [leftItems, rightItems];
}