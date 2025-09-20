import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Sample property data
const sampleProperties = [
  { id: 1, name: 'Luxury Villa', location: 'Mumbai', type: 'Villa' },
  { id: 2, name: 'Modern Apartment', location: 'Delhi', type: 'Apartment' },
  { id: 3, name: 'Beach House', location: 'Goa', type: 'House' },
  { id: 4, name: 'Mountain View', location: 'Shimla', type: 'Cottage' },
  { id: 5, name: 'City Loft', location: 'Bangalore', type: 'Apartment' },
];

function Dashboard() {
  const videoRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  // Filter properties based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
    } else {
      const results = sampleProperties.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    }
  }, [searchTerm]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to properties page with search query
      navigate(`/properties?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search input key down (for Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearchSubmit(e);
    }
  };

  const handlePropertySelect = (location) => {
    navigate(`/properties?search=${encodeURIComponent(location)}`);
    setSearchTerm('');
    setSearchResults([]);
  };

  useEffect(() => {
    // Ensure video plays and is properly sized
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }

    // Set document styles
    document.documentElement.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Cleanup
      document.documentElement.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="content-wrapper">
        <h1 className="main-heading">Find Your Dream Property</h1>
        
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by location (e.g., Mathura, Delhi, Mumbai)..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="search-input"
              aria-label="Search properties by location"
            />
            <button type="submit" className="search-button" aria-label="Search">
              <FaSearch className="search-icon" />
            </button>
          </div>
        </form>
        
        {searchResults.length > 0 && isSearchFocused && (
          <div className="search-results">
            {searchResults.map(property => (
              <div 
                key={property.id} 
                className="property-item"
                onClick={() => handlePropertySelect(property.location)}
              >
                <div className="property-name">{property.name}</div>
                <div className="property-details">
                  <span className="property-location">{property.location}</span>
                  <span className="property-type">{property.type}</span>
                </div>
              </div>
            ))}
            {searchTerm.trim() && (
              <div 
                className="property-item view-all"
                onClick={() => handlePropertySelect(searchTerm.trim())}
              >
                <div className="property-name">Search for "{searchTerm.trim()}"</div>
                <div className="property-details">View all matching properties</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="video-background">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          loop 
          playsInline
          id="bg-video"
          preload="auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            transform: 'none',
            zIndex: -1,
            objectFit: 'cover'
          }}
          src="https://res.cloudinary.com/drazyyxbr/video/upload/v1753329214/rotatevideo_txpdnr.mp4"
        />
      </div>
    </div>
  );
}

export default Dashboard;
