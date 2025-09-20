import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings, deleteProperty, updateProperty, api } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaEye, FaPlus, FaMapMarkerAlt, FaRupeeSign, FaHome, FaUserPlus, FaSave, FaTimes } from 'react-icons/fa';
import './MyListings.css';
import LogoSplash from './LogoSplash';

function MyListings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Fetch user's properties
  useEffect(() => {
    fetchMyListings();
  }, []);

  // Delete property
  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await deleteProperty(id);
        setProperties(properties.filter(property => property._id !== id));
        toast.success('Property deleted successfully!');
      } catch (err) {
        console.error('Error deleting property:', err);
        if (err.response?.status === 403) {
          toast.error('You are not authorized to delete this property');
        } else {
          toast.error('Failed to delete property. Please try again.');
        }
      }
    }
  };

  // Start editing a property
  const startEditing = (property) => {
    setEditingProperty(property._id);
    setEditForm({
      title: property.title,
      description: property.description || '',
      price: property.price,
      size: property.size,
      status: property.status,
      type: property.type,
      location: property.location
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProperty(null);
    setEditForm({});
  };

  // Save edited property
  const saveProperty = async (propertyId) => {
    try {
      setSaving(true);
      const response = await updateProperty(propertyId, editForm);
      
      // Update the local state
      setProperties(properties.map(prop => 
        prop._id === propertyId ? { ...prop, ...response.data } : prop
      ));
      
      setEditingProperty(null);
      setEditForm({});
      toast.success('Property updated successfully!');
    } catch (err) {
      console.error('Error updating property:', err);
      toast.error('Failed to update property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle form input changes
  const handleEditInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Extracted function to fetch listings
  const fetchMyListings = async () => {
    try {
      setLoading(true);
      console.log('Fetching my properties...');
      
      // Use the /properties/my-listings endpoint to get only the current user's properties
      const response = await api.get('/properties/my-listings');
      console.log('My properties:', response.data);
      
      // Set the properties directly
      setProperties(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching my properties:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to load your properties. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesStatus = filterStatus === 'All' || property.status === filterStatus;
    const matchesType = filterType === 'All' || property.type === filterType;
    return matchesStatus && matchesType;
  });

  // Format price
  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  if (loading) {
    return <LogoSplash />;
  }

  if (error) {
    return (
      <div className="my-listings-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-listings-container">
      <div className="listings-header">
        <div className="header-content">
          <h1>My Property Listings</h1>
          <p>Manage your property listings - edit, delete, or add new properties</p>
        </div>
        <Link 
          to="/AddProperty" 
          className="add-property-btn"
          style={{
            position: 'relative',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          <FaPlus /> Add New Property
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Under Negotiation">Under Negotiation</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            <option value="Plot">Plot</option>
            <option value="Flat">Flat</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        <div className="listings-count">
          <span>{filteredProperties.length} of {properties.length} properties</span>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="no-listings">
          <div className="no-listings-content">
            <FaHome className="no-listings-icon" />
            <h2>No Properties Found</h2>
            <p>
              {properties.length === 0 
                ? "You haven't listed any properties yet. Start by adding your first property!"
                : "No properties match your current filters. Try adjusting the filters above."
              }
            </p>
            {properties.length === 0 && (
              <div className="no-listings-actions">
                <Link to="/AddProperty" className="add-first-property-btn">
                  <FaPlus /> Add Your First Property
                </Link>
              </div>
            )}
            {properties.length > 0 && (
              <Link to="/AddProperty" className="add-first-property-btn">
                <FaPlus /> Add New Property
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="properties-grid">
          {filteredProperties.map(property => (
            <div key={property._id} className="property-card">
              <div className="property-image">
                {property.image ? (
                  <img src={property.image} alt={property.title} />
                ) : (
                  <div className="no-image">
                    <FaHome />
                    <span>No Image</span>
                  </div>
                )}
                <div className={`status-badge ${property.status.toLowerCase().replace(' ', '-')}`}>
                  {editingProperty === property._id ? (
                    <select 
                      value={editForm.status || property.status}
                      onChange={(e) => handleEditInputChange('status', e.target.value)}
                      className="status-edit-select"
                    >
                      <option value="Available">Available</option>
                      <option value="Under Negotiation">Under Negotiation</option>
                      <option value="Sold">Sold</option>
                    </select>
                  ) : (
                    property.status
                  )}
                </div>
              </div>

              <div className="property-info">
                {editingProperty === property._id ? (
                  <div className="edit-form">
                    <input 
                      type="text"
                      value={editForm.title || property.title}
                      onChange={(e) => handleEditInputChange('title', e.target.value)}
                      className="edit-input title-input"
                      placeholder="Property Title"
                    />
                    
                    <textarea 
                      value={editForm.description || property.description || ''}
                      onChange={(e) => handleEditInputChange('description', e.target.value)}
                      className="edit-input description-input"
                      placeholder="Property Description"
                      rows={3}
                    />
                    
                    <div className="edit-details-grid">
                      <div className="edit-detail-group">
                        <label>Price (₹)</label>
                        <input 
                          type="number"
                          value={editForm.price || property.price}
                          onChange={(e) => handleEditInputChange('price', parseFloat(e.target.value) || 0)}
                          className="edit-input price-input"
                          placeholder="Price"
                        />
                      </div>
                      
                      <div className="edit-detail-group">
                        <label>Area (sq ft)</label>
                        <input 
                          type="number"
                          value={editForm.size || property.size}
                          onChange={(e) => handleEditInputChange('size', parseFloat(e.target.value) || 0)}
                          className="edit-input size-input"
                          placeholder="Size"
                        />
                      </div>
                      
                      <div className="edit-detail-group">
                        <label>Type</label>
                        <select 
                          value={editForm.type || property.type}
                          onChange={(e) => handleEditInputChange('type', e.target.value)}
                          className="edit-input type-select"
                        >
                          <option value="Plot">Plot</option>
                          <option value="Flat">Flat</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>
                      
                      <div className="edit-detail-group">
                        <label>Location</label>
                        <input 
                          type="text"
                          value={editForm.location || property.location}
                          onChange={(e) => handleEditInputChange('location', e.target.value)}
                          className="edit-input location-input"
                          placeholder="Location"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="property-title">{property.title}</h3>
                    
                    {property.description && (
                      <p className="property-description">{property.description}</p>
                    )}
                    
                    <div className="property-details">
                      <div className="detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span>{property.location}</span>
                      </div>
                      
                      <div className="detail-item">
                        <FaRupeeSign className="detail-icon" />
                        <span className="price">{formatPrice(property.price)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <FaHome className="detail-icon" />
                        <span>{property.type} • {property.size} sq ft</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="property-actions">
                  {editingProperty === property._id ? (
                    <>
                      <button 
                        onClick={() => saveProperty(property._id)}
                        className="action-btn save-btn"
                        disabled={saving}
                        title="Save Changes"
                      >
                        <FaSave /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      
                      <button 
                        onClick={cancelEditing}
                        className="action-btn cancel-btn"
                        title="Cancel"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to={`/properties/${property._id}`} 
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <FaEye /> View
                      </Link>
                      
                      <Link 
                        to={`/properties/edit/${property._id}`}
                        className="action-btn edit-btn"
                        title="Edit Property"
                      >
                        <FaEdit /> Edit
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(property._id, property.title)}
                        className="action-btn delete-btn"
                        title="Delete Property"
                      >
                        <FaTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="property-meta">
                <small>
                  Listed: {new Date(property.createdAt).toLocaleDateString()}
                </small>
                {property.updatedAt !== property.createdAt && (
                  <small>
                    Updated: {new Date(property.updatedAt).toLocaleDateString()}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;
