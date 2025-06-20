import React from 'react';
import OriginalNavbar from '@theme-original/Navbar';
import NavbarSecondaryMenu from './SecondaryMenu';

export default function Navbar(props) {
  return (
    <>
      <OriginalNavbar {...props} />
      <NavbarSecondaryMenu />
    </>
  );
}