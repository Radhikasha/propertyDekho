import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, createClient, deleteClient } from '../services/api';
import './ClientManager.css';
import { FaPlus, FaTrash, FaEdit, FaSearch } from 'react-icons/fa';

function ClientManager() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({
    name: '',
    contact: '',
    budget: '',
    preferredLocation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load clients when component mounts
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await getClients();
      setClients(response.data);
    } catch (err) {
      setError('Failed to load clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({ ...newClient, [name]: value });
  };

  const addClient = async () => {
    if (!newClient.name || !newClient.contact) {
      setError('Name and contact are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await createClient({
        name: newClient.name,
        contact: newClient.contact,
        budget: parseFloat(newClient.budget) || 0,
        preferredLocation: newClient.preferredLocation || '',
        email: '',
        notes: ''
      });
      
      // Update local state with the new client from the server
      setClients([...clients, response.data]);
      
      // Reset form
      setNewClient({
        name: '',
        contact: '',
        budget: '',
        preferredLocation: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add client');
      console.error('Error adding client:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteClient(id);
      setClients(clients.filter(client => client._id !== id));
    } catch (err) {
      setError('Failed to delete client');
      console.error('Error deleting client:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Inline style for background image
  const containerStyle = {
    minHeight: '100vh',
    padding: '2rem 1rem',
    backgroundImage: `url(${process.env.PUBLIC_URL}/images/client_page.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  };

  return (
    <div className="client-manager-container" style={containerStyle}>
      <div className="client-manager-content">
        <div className="client-manager-header">
          <h2>Client Manager</h2>
        </div>
        
        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Add Client Form */}
        <div className="add-client-form">
          <h3>Add New Client</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={newClient.name}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Client name"
              />
            </div>
            <div className="form-group">
              <label>Contact</label>
              <input
                type="text"
                name="contact"
                value={newClient.contact}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Phone number"
              />
            </div>
            <div className="form-group">
              <label>Budget</label>
              <input
                type="number"
                name="budget"
                value={newClient.budget}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Budget amount"
              />
            </div>
            <div className="form-group">
              <label>Preferred Location</label>
              <input
                type="text"
                name="preferredLocation"
                value={newClient.preferredLocation}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Location"
              />
            </div>
          </div>
          <button 
            onClick={addClient} 
            className="btn btn-primary"
            disabled={isLoading}
          >
            <FaPlus style={{ marginRight: '8px' }} />
            {isLoading ? 'Adding...' : 'Add Client'}
          </button>
        </div>
        
        {/* Client List */}
        <div className="client-list">
          {isLoading && clients.length === 0 ? (
            <div className="loading">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-people"></i>
              <h3>No Clients Found</h3>
              <p>Add your first client to get started</p>
            </div>
          ) : (
            <table className="client-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Budget</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id}>
                    <td>
                      <Link to={`/clients/${client._id}`} className="client-link">
                        {client.name}
                      </Link>
                    </td>
                    <td>{client.contact}</td>
                    <td>{client.budget ? `$${client.budget.toLocaleString()}` : '-'}</td>
                    <td>{client.preferredLocation || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/clients/edit/${client._id}`} 
                          className="btn btn-sm"
                          style={{ marginRight: '8px' }}
                        >
                          <FaEdit />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClient(client._id)}
                          className="btn btn-sm btn-danger"
                          disabled={isLoading}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientManager;
