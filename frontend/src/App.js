import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PropertyList from './components/PropertyList';
import PropertyDetails from './components/PropertyDetails';
import AddProperty from './components/AddProperty';
import EditProperty from './components/EditProperty';
import ClientManager from './components/ClientManager';
import MyListings from './components/MyListings';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import LogoSplash from './components/LogoSplash';

// Layout Component
const Layout = ({ children }) => (
  <>
    <Navbar />
    <div className="main-content">
      {children}
    </div>
  </>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      // Simulate API call to check auth
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 2.1s (animation duration + fade)
    const timer = setTimeout(() => setShowSplash(false), 2100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && <LogoSplash />}
      {!showSplash && (
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Navigate to="/dashboard" replace />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/edit-property/:id" element={<EditProperty />} />
              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PropertyList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/AddProperty"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AddProperty />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PropertyDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditProperty />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MyListings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientManager />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* 404 Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      )}
    </>
  );
}

export default App;