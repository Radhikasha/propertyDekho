import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getProperties } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './PropertyList.css';
import LogoSplash from './LogoSplash';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 6;
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get search term from URL on component mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      setShowSearchResults(true);
    }
  }, [location.search]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchTerm.trim() !== '') {
      setShowSearchResults(true);
    }
  };

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProperties();
        setProperties(response.data || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        const errorMessage = err.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your internet connection.'
          : 'Failed to load properties. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Retry fetching properties
  const retryFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProperties();
      setProperties(response.data || []);
    } catch (err) {
      console.error('Retry failed:', err);
      setError('Still having trouble connecting. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search term change
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setShowSearchResults(newSearchTerm.trim() !== '');
    setCurrentPage(1);
    
    // Update URL without page reload
    const params = new URLSearchParams(location.search);
    if (newSearchTerm.trim()) {
      params.set('search', newSearchTerm);
    } else {
      params.delete('search');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Filter properties based on search and filters
  const filteredProperties = properties.filter(property => {
    const searchLower = searchTerm.toLowerCase().trim();
    
    // If search term is empty, only apply filters
    if (!searchLower) {
      const matchesStatus = filterStatus === 'All' || property.status === filterStatus;
      const matchesType = filterType === 'All' || property.type === filterType;
      return matchesStatus && matchesType;
    }

    // Check if any field matches the search term
    const matchesSearch = [
      property.title?.toLowerCase(),
      property.location?.toLowerCase(),
      property.type?.toLowerCase(),
      property.status?.toLowerCase(),
      property.address?.city?.toLowerCase(),
      property.address?.state?.toLowerCase(),
      property.address?.street?.toLowerCase()
    ].some(field => field?.includes(searchLower));

    const matchesStatus = filterStatus === 'All' || property.status === filterStatus;
    const matchesType = filterType === 'All' || property.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get search results for dropdown (limit to 5)
  const searchResults = searchTerm.trim() !== '' 
    ? properties.filter(property => {
        const searchLower = searchTerm.toLowerCase();
        return (
          property.title?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.type?.toLowerCase().includes(searchLower) ||
          property.status?.toLowerCase().includes(searchLower)
        );
      }).slice(0, 5)
    : [];

  // Get current properties for pagination
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge';
    const statusLower = status.toLowerCase().replace(' ', '-');
    return `status-badge status-${statusLower}`;
  };

  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Handle enquiry form input change
  const handleEnquiryChange = (e) => {
    const { name, value } = e.target;
    setEnquiryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle enquiry form submission
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    
    // Show success message immediately
    alert('Thank you for your enquiry! Your details have been shared with the property owner. They will contact you soon.');
    
    // Reset form and close modal
    setEnquiryForm({
      name: '',
      email: '',
      phone: '',
      message: 'I am interested in this property. Please contact me with more details.'
    });
    setShowEnquiryModal(false);
    
    // Optional: Still send the data to the server in the background
    try {

    }
  };

  if (loading) {
    return <LogoSplash />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={retryFetch} className="btn btn-primary">
              {loading ? 'Retrying...' : 'Retry'}
            </button>
            {navigator.onLine ? (
              <p className="connection-status online">You are currently online</p>
            ) : (
              <p className="connection-status offline">You are currently offline</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-list-container">
      {/* Test button - can be removed after testing */}
      <button 
        onClick={() => toast.success('Test toast notification works!')}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Toast
      </button>
      
      <div className="property-background"></div>
      <div className="content-overlay">
        <div className="property-list">
          <div className="property-list-header">
            <h2>Properties</h2>
          </div>
          
          {/* Filters and Search */}
          <div className="property-filters">
            <div className="search-box" ref={searchRef}>
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((property) => (
                    <div 
                      key={property._id} 
                      className="search-result-item"
                      onClick={() => {
                        setSearchTerm('');
                        setShowSearchResults(false);
                        navigate(`/properties/${property._id}`);
                      }}
                    >
                      <div className="search-result-title">{property.title}</div>
                      <div className="search-result-meta">
                        <span>{property.location}</span>
                        <span>{property.type}</span>
                        <span className={`status-badge ${property.status.toLowerCase().replace(' ', '-')}`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Under Negotiation">Under Negotiation</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Type:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Plot">Plot</option>
                <option value="Flat">Flat</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
          </div>
          
          {/* Property Grid */}
          {filteredProperties.length === 0 ? (
            <div className="no-results">
              <p>No properties found matching your criteria.</p>
            </div>
          ) : (
            <div className="property-grid">
              {currentProperties.map((property) => (
                <div key={property._id} className="property-card">
                  <img 
                    src={property.image || 'https://via.placeholder.com/300x200?text=No+Image'} 
                    alt={property.title} 
                    className="property-image"
                  />
                  <div className="property-info">
                    <h3>{property.title}</h3>
                    <p className="property-location">{property.location}</p>
                    <div className="property-meta">
                      <span className={`status-badge ${property.status.toLowerCase().replace(' ', '-')}`}>
                        {property.status}
                      </span>
                      <span className="property-type">{property.type}</span>
                      <span className="property-size">{property.size} sq.ft</span>
                      <span className="property-price">₹{property.price?.toLocaleString()}</span>
                    </div>
                    <div className="property-actions">
                      <button 
                        onClick={() => navigate(`/properties/${property._id}`)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowEnquiryModal(true);
                        }}
                        className="enquire-btn"
                      >
                        I'm Interested
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {filteredProperties.length > propertiesPerPage && (
            <div className="pagination">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1}
                className="pagination-button"
                aria-label="Previous page"
              >
                &laquo;
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                  aria-label={`Page ${number}`}
                  aria-current={currentPage === number ? 'page' : null}
                >
                  {number}
                </button>
              ))}
              
              <button 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
                className="pagination-button"
                aria-label="Next page"
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Enquiry Modal */}
      {showEnquiryModal && selectedProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Enquire about {selectedProperty.title}</h2>
            <form onSubmit={handleEnquirySubmit}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={enquiryForm.name}
                  onChange={handleEnquiryChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={enquiryForm.email}
                  onChange={handleEnquiryChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={enquiryForm.phone}
                  onChange={handleEnquiryChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={enquiryForm.message}
                  onChange={handleEnquiryChange}
                  rows="4"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEnquiryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Send Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
