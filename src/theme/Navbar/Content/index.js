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

function NavbarContentLayout({ left, center, right }) {
  return (
    <div className={styles.navbarContent}>
      <div className={styles.navbarContentLeft}>{left}</div>
      <div className={styles.navbarContentCenter}>{center}</div>
      <div className={styles.navbarContentRight}>{right}</div>
    </div>
  );
}

export default function NavbarContent() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);
  const windowSize = useWindowSize();
  const isMobile = windowSize === 'mobile' || windowSize === 'ssr';

  return (
    <NavbarContentLayout
      left={
        <>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
          <NavbarLogo />
          <NavbarItems items={leftItems} />
        </>
      }
      center={!isMobile && <NavbarSearch />}
      right={
        <>
          <NavbarItems items={rightItems} />
          {isMobile && <NavbarSearch mobile />}
          {!isMobile && <NavbarColorModeToggle className={styles.colorModeToggle} />}
        </>
      }
    />
  );
}

function splitNavbarItems(items) {
  const leftItems = items.filter((item) => item.position === 'left');
  const rightItems = items.filter((item) => item.position === 'right');
  return [leftItems, rightItems];
}