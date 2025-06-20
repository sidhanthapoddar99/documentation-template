import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useHideableNavbar, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import styles from './styles.module.css';

const platformDocItems = [
  { label: 'Platform', href: '/docs/platform' },
  { label: 'NeuraLock', href: '/docs/neuralock' },
  { label: 'Neura Execution Engine', href: '/docs/execution-engine' },
  { label: 'Neura Synthesis', href: '/docs/synthesis' },
  { label: 'Neura Ledger', href: '/docs/ledger' },
  { label: 'L1 Blockchain Integration', href: '/docs/blockchain-integration' },
  { label: 'Neura Synapsis', href: '/docs/synapsis', disabled: true },
];

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Overview', href: '/overview' },
  { 
    label: 'Platform Documentation', 
    href: '#',
    dropdown: platformDocItems 
  },
  { label: 'Developers Guide', href: '/developers' },
  { label: 'Blogs', href: '/blog' },
  { label: 'Roadmap & Release Notes', href: '/roadmap' },
];

function NavbarItem({ item, isMobile, onClose, isActive }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const hasDropdown = item.dropdown && item.dropdown.length > 0;

  const handleMouseEnter = () => {
    if (!isMobile && hasDropdown) {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
        setDropdownTimeout(null);
      }
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && hasDropdown) {
      const timeout = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 150); // Small delay to allow moving to dropdown
      setDropdownTimeout(timeout);
    }
  };

  const handleClick = (e) => {
    if (hasDropdown) {
      e.preventDefault();
      if (isMobile) {
        setIsDropdownOpen(!isDropdownOpen);
      }
    } else if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  return (
    <div 
      className={styles.navbarItem}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a 
        href={item.href}
        className={clsx(styles.navbarLink, {
          [styles.navbarLinkWithDropdown]: hasDropdown,
          [styles.navbarLinkActive]: isActive,
        })}
        onClick={handleClick}
      >
        {item.label}
        {hasDropdown && (
          <span className={clsx(styles.dropdownArrow, {
            [styles.dropdownArrowOpen]: isDropdownOpen,
          })}>
            ▼
          </span>
        )}
      </a>
      {hasDropdown && isDropdownOpen && (
        <div className={clsx(styles.dropdown, {
          [styles.dropdownMobile]: isMobile,
        })}>
          {item.dropdown.map((dropdownItem, idx) => (
            <a
              key={idx}
              href={dropdownItem.href}
              className={clsx(styles.dropdownItem, {
                [styles.dropdownItemDisabled]: dropdownItem.disabled,
              })}
              onClick={(e) => {
                if (dropdownItem.disabled) {
                  e.preventDefault();
                } else if (onClose) {
                  onClose();
                }
              }}
            >
              {dropdownItem.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavbarSecondaryMenu() {
  const location = useLocation();
  const mobileSidebar = useNavbarMobileSidebar();
  const { navbarStyle } = useHideableNavbar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const shouldHideSecondaryMenu = navbarStyle === 'dark';

  const isItemActive = (item) => {
    if (item.href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (shouldHideSecondaryMenu) {
    return null;
  }

  return (
    <nav className={clsx(styles.navbarSecondary, {
      [styles.navbarSecondaryHideable]: true,
    })}>
      <div className={styles.navbarSecondaryInner}>
        {/* Desktop Navigation */}
        <div className={styles.navbarItemsDesktop}>
          <div className={styles.navbarItemsLeft}>
            {navItems.map((item, idx) => (
              <NavbarItem 
                key={idx} 
                item={item} 
                isMobile={false}
                isActive={isItemActive(item)}
              />
            ))}
          </div>
          <div className={styles.navbarItemsRight}>
            <a 
              href="https://github.com/neuralabs/neuralabs-sui" 
              className={styles.navbarLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle secondary navigation menu"
        >
          <span className={styles.mobileMenuIcon}>☰</span>
        </button>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <>
            <div className={styles.mobileMenuBackdrop} onClick={closeMobileMenu} />
            <div className={styles.mobileMenu}>
              <button
                className={styles.mobileMenuClose}
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                ✕
              </button>
              <div className={styles.mobileMenuItems}>
                {navItems.map((item, idx) => (
                  <NavbarItem 
                    key={idx} 
                    item={item} 
                    isMobile={true}
                    onClose={closeMobileMenu}
                    isActive={isItemActive(item)}
                  />
                ))}
                <div className={styles.mobileMenuDivider} />
                <a 
                  href="https://github.com/neuralabs/neuralabs-sui" 
                  className={styles.navbarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileMenu}
                >
                  GitHub
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}