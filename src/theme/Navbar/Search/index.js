import React, { useState } from 'react';
import styles from './styles.module.css';

export default function NavbarSearch({ mobile = false }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchClick = () => {
    // In a real implementation, this would open the search modal
    console.log('Search clicked');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  if (mobile) {
    return (
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
    );
  }

  return (
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
  );
}