import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function NavbarSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    // In a real implementation, this would open the search modal
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <>
      {/* Desktop Search Bar */}
      <div className={styles.searchDesktop}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="search"
            placeholder="Search documentation..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            <img 
              src="/img/icons/search.svg" 
              alt="Search" 
              width="20" 
              height="20"
              className={styles.searchIcon}
            />
          </button>
        </form>
      </div>

      {/* Mobile Search Icon */}
      <button
        className={styles.searchMobile}
        onClick={handleSearchClick}
        aria-label="Search"
      >
        <img 
          src="/img/icons/search.svg" 
          alt="Search" 
          width="24" 
          height="24"
          className={styles.searchIcon}
        />
      </button>
    </>
  );
}