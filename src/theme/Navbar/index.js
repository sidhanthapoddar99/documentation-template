import React from 'react';
import NavbarContent from '@theme/Navbar/Content';
import NavbarLayout from '@theme/Navbar/Layout';
import './custom-navbar.css'; // Your custom styles

export default function Navbar() {
  return (
    <NavbarLayout>
      <NavbarContent />
    </NavbarLayout>
  );
}