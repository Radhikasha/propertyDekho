import React from 'react';
import logo from '../assets/logo.png';
import './LogoSplash.css';

const LogoSplash = () => {
  return (
    <div className="logo-splash-bg">
      <img src={logo} alt="Logo" className="logo-splash-img" />
    </div>
  );
};

export default LogoSplash;
