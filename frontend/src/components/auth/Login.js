import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';
import { login } from '../../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;
  const location = useLocation();
  
  // Check for success message from registration
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setError(''); // Clear any existing errors
      const successMessage = location.state.message || 'Registration successful! Please log in.';
      // Show success message (you might want to style this differently)
      alert(successMessage);
      // Clear the location state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  // Validate form on input change
  useEffect(() => {
    const isValid = email.trim() !== '' && password.trim() !== '' && password.length >= 6;
    setIsFormValid(isValid);
  }, [email, password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Mock user data - In a real app, this would be handled by your backend
  const mockUsers = [
    { email: 'admin@example.com', password: 'Admin@123' },
    { email: 'user@example.com', password: 'User@123' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email });
      
      // Add more detailed logging
      console.log('Sending request to:', 'https://propertydekho-6tu7.onrender.com/api/auth/login');
      
      const response = await login({ 
        email: email.trim(), 
        password: password.trim() 
      });
      
      console.log('Login response:', response);
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (response.data && response.data.token) {
        console.log('Login successful, token received');
        localStorage.setItem('token', response.data.token);
        
        // Store user data in local storage
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Redirect to dashboard or home page
        console.log('Redirecting to /dashboard');
        navigate('/dashboard');
      } else {
        console.error('Login failed - no token in response:', response);
        throw new Error(response.data?.message || 'No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
      } else if (err.request) {
        console.error('No response received:', err.request);
      }
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <div className="password-label">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className={`auth-button ${!isFormValid || isLoading ? 'auth-button--disabled' : ''}`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
