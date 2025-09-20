
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(email || 'User');
    }
  }, [location]);
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img src={logo} alt="PropertyDekho Logo" style={{ height: '60px', width: 'auto', display: 'block' }} />
        </Link>
      </div>
      <div className="navbar-right">
        <div className="navbar-links">
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>
                Dashboard
              </Link>
              <div className="dropdown">
                <Link to="/properties" className={isActive('/properties')}>
                  Properties
                </Link>
              </div>
              <Link to="/my-listings" className={isActive('/my-listings')}>
                My Listings
              </Link>
              <Link to="/clients" className={isActive('/clients')}>
                Clients
              </Link>
            </>
          )}
        </div>
        <div className="navbar-auth">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          ) : (
            <Link to="/login" className="login-btn">
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
