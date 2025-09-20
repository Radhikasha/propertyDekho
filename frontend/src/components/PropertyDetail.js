
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProperty, deleteProperty } from '../services/api';
import './PropertyDetail.css';
import MapboxStaticMap from './MapboxStaticMap';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await getProperty(id);
        setProperty(response.data);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Handle property deletion
  const handleDelete = async () => {
    try {
      await deleteProperty(id);
      navigate('/properties', { 
        state: { message: 'Property deleted successfully' } 
      });
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
        return 'status-badge status-available';
      case 'Under Negotiation':
        return 'status-badge status-negotiation';
      case 'Sold':
        return 'status-badge status-sold';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <div className="property-detail-container">
        <div className="loading">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-detail-container">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-back"
        >
          ← Back to Properties
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail-container">
        <div className="not-found">
          <h2>Property Not Found</h2>
          <p>The property you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/properties')} 
            className="btn btn-primary"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="property-detail-vertical-container">
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-back"
      >
        ← Back to Properties
      </button>

      {/* Photo with location icon */}
      <div className="property-photo-section">
        {property.image ? (
          <div className="property-photo-wrapper">
            <img src={property.image} alt={property.title} className="main-image-vertical" />
            {property.coordinates && (
              <button className="location-icon-btn" title="View Location" onClick={() => document.getElementById('property-map-section').scrollIntoView({ behavior: 'smooth' })}>
                <span role="img" aria-label="location" className="location-icon">📍</span>
              </button>
            )}
          </div>
        ) : (
          <div className="image-placeholder">
            <span>No Image Available</span>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="property-info-card">
        <h2>{property.title}</h2>
        <div className="property-meta">
          <span className={getStatusBadgeClass(property.status)}>{property.status}</span>
          <span className="property-price">₹{property.price.toLocaleString()}</span>
        </div>
        <div className="info-list">
          <div><strong>Type:</strong> {property.type}</div>
          <div><strong>Size:</strong> {property.size} sq.ft</div>
          <div><strong>Location:</strong> {property.location}</div>
        </div>
        <div className="property-description">
          <strong>Description:</strong> {property.description || 'No description available.'}
        </div>
      </div>

      {/* Map Section */}
      {property.coordinates && (
        <div id="property-map-section" className="property-map-section">
          <MapboxStaticMap coordinates={property.coordinates} />
        </div>
      )}
    </div>
  );
}

export default PropertyDetail;
