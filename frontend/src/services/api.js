import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Use environment variable if available, otherwise use production URL
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://propertydekho-6tu7.onrender.com';

const API_URL = `${BASE_URL}/api`;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for cookies if using sessions
  timeout: 30000 // Increased timeout to 30 seconds
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Single response interceptor with comprehensive error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Please check your internet connection');
      toast.error('Request timed out. Please check your internet connection and try again.');
    } else if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('Response error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // No response received
      console.error('No response received:', error.request);
      toast.error('No response from server. Please check your internet connection.');
    } else {
      // Request setup error
      console.error('Request error:', error.message);
      toast.error(`Request error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Properties API
export const getProperties = () => api.get('/properties');
export const getProperty = (id) => api.get(`/properties/${id}`);
export const getMyListings = () => api.get('/properties/my-listings');
export const createProperty = (propertyData) => api.post('/properties', propertyData);
export const updateProperty = (id, propertyData) => api.patch(`/properties/${id}`, propertyData);
export const deleteProperty = (id) => api.delete(`/properties/${id}`);

// Clients API
export const getClients = () => api.get('/clients');
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (clientData) => api.post('/clients', clientData);
export const updateClient = (id, clientData) => api.put(`/clients/${id}`, clientData);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Meetings API
export const getMeetings = () => api.get('/meetings');
export const getMeeting = (id) => api.get(`/meetings/${id}`);
export const createMeeting = (meetingData) => api.post('/meetings', meetingData);
export const updateMeeting = (id, meetingData) => api.put(`/meetings/${id}`, meetingData);
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);

// Auth API
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Export all API methods as a single object
const apiService = {
  // Properties
  getProperties,
  getProperty,
  getMyListings,
  createProperty,
  updateProperty,
  deleteProperty,
  
  // Clients
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  
  // Meetings
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  
  // Auth
  login,
  register,
};

export default apiService;

// Export the api instance for direct usage when needed
export { api };
