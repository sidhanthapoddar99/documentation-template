import React from 'react';
import OriginalNavbar from '@theme-original/Navbar';
import NavbarSecondaryMenu from './SecondaryMenu';
import NavbarSearch from './Search';
import styles from './styles.module.css';

export default function Navbar(props) {
  return (
    <>
      <div className={styles.navbarWrapper}>
        <OriginalNavbar {...props} />
        <div className={styles.searchContainer}>
          <NavbarSearch />
        </div>
      </div>
      <NavbarSecondaryMenu />
    </>
  );
}