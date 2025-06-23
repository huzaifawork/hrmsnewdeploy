import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiClock, FiMapPin, FiPrinter, FiArrowLeft, FiDollarSign, FiHash,  } from 'react-icons/fi';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';
import PageLayout from '../components/layout/PageLayout';
import './OrderConfirmationNew.css';

import { apiConfig } from '../config/api';

// Create a configurable axios instance
const apiClient = axios.create({
  baseURL: apiConfig.serverURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to handle token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * IMPORTANT: This is the correct implementation for the Order Confirmation page
 * It fetches the most recent order dynamically from the API.
 * Do NOT use hardcoded order data for this component.
 */

/**
 * IMPORTANT: This component now uses the same approach as the MyOrders component
 * to ensure we always show the most recent order.
 */
const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Helper functions for responsive design
  const isMobile = () => windowWidth <= 768;
  const isTablet = () => windowWidth <= 1024 && windowWidth > 768;

  // Log function to help with troubleshooting if needed
  const logInfo = (message, data) => {
    console.log(`[INFO] ${message}:`, data);
  };
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On component mount, fetch the most recent order
  useEffect(() => {
    logInfo('Component mounted', new Date().toISOString());
    testBackendConnection();
    fetchMostRecentOrder();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Simple test to check if backend is reachable
  const testBackendConnection = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://hrms-bace.vercel.app/api';
      logInfo("Testing backend connection", {
        url: `${apiUrl}/health`,
        timestamp: new Date().toISOString()
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      const status = response.status;
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : 'Not JSON';
      
      logInfo("Backend connection test result", {
        status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        data: isJson ? data : null,
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (err) {
      logInfo("Backend connection error", {
        name: err.name,
        message: err.message,
        isAbortError: err.name === 'AbortError',
        timestamp: new Date().toISOString()
      });
      
      if (err.name === 'AbortError') {
        // toast.error("Connection timed out. Server might be down.");
      } else if (err.message.includes('Failed to fetch')) {
        // toast.error("Cannot connect to backend server. Please check if it's running.");
      } else {
        // toast.error(`Connection error: ${err.message}`);
      }
    }
  };
  
  // This function uses the same approach as the working MyOrders component
  const fetchMostRecentOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('DEBUG - Token:', token ? `${token.substring(0, 15)}...` : 'No token found');
      
      logInfo("Token check", {
        available: !!token,
        length: token ? token.length : 0,
        firstChars: token ? token.substring(0, 10) : 'none'
      });
      
      if (!token) {
        setError('Please login to view your order');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      logInfo("Fetching most recent order", {
        url: '/api/orders',
        timestamp: new Date().toISOString()
      });
      
      // Use API client with error handling
      try {
        const response = await apiClient.get('/api/orders', {
        params: {
          page: 1,
          limit: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          _nocache: new Date().getTime()
        }
      });
      
      logInfo("Server response", response.data);
      
      // Process response exactly like MyOrders does
      if (response.data && 
          response.data.orders && 
          Array.isArray(response.data.orders) && 
          response.data.orders.length > 0) {
        
        const mostRecentOrder = response.data.orders[0];
        logInfo("Most recent order found", {
          id: mostRecentOrder._id,
          createdAt: mostRecentOrder.createdAt,
          status: mostRecentOrder.status
        });
        
        setOrder(mostRecentOrder);
          
          // Save the order ID for future reference
          localStorage.setItem('lastOrderId', mostRecentOrder._id);
          
          // Fetch user profile data and save it to localStorage
          apiClient.get('/api/user/profile')
            .then(userResponse => {
              const userData = userResponse.data;
              console.log("User profile fetched:", userData);
              
              // Save important user details
              localStorage.setItem('userData', JSON.stringify(userData));
              
              if (userData.name) localStorage.setItem('name', userData.name);
              if (userData.email) localStorage.setItem('email', userData.email);
              if (userData.phone) localStorage.setItem('phone', userData.phone);
            })
            .catch(err => console.error("Failed to fetch user profile:", err));
          
        // toast.success("Showing your most recent order");
      } else {
        logInfo("No orders found", response.data);
        setError("No recent orders found. Please place an order first.");
        }
      } catch (apiError) {
        // Handle specific API errors
        logInfo("API Error", {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data
        });
        
        if (apiError.response?.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => navigate('/login'), 2000);
        } else if (apiError.code === 'ECONNABORTED') {
          setError("Request timed out. Server might be down.");
        } else if (!apiError.response) {
          setError("Cannot connect to server. Please try again later.");
        } else {
          setError(`Error: ${apiError.response?.data?.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      logInfo("Error", {
        message: err.message,
        response: err.response?.data
      });
      setError("Failed to load order data. Please try again or check 'My Orders'.");
    } finally {
      setLoading(false);
    }
  };
  
  // Format price with 2 decimal places
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };
  
  // Calculate subtotal from items
  const calculateSubtotal = () => {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  // Check if order is trackable
  const isOrderTrackable = () => {
    if (!order) return false;
    const status = order.status?.toLowerCase() || '';
    return status !== 'delivered' && status !== 'cancelled';
  };
  
  // Handle track order button
  const handleTrackOrder = () => {
    if (!order || !order._id) {
      // toast.error("Order data missing");
      return;
    }
    
    navigate(`/track-order/${order._id}`, { 
      state: { order }
    });
  };
  
  // Handle invoice button
  const handleViewInvoice = () => {
    if (!order || !order._id) {
      // toast.error("Order data missing");
      return;
    }

    // Scroll to top on mobile for better UX
    if (isMobile()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Clean up the order object to remove any MongoDB specific properties
    const cleanOrder = {
      _id: order._id,
      user: order.user,
      items: order.items.map(item => {
        // Extract the item name safely using the same logic as in the order summary
        const itemName = item.name || 
                        (item._doc && item._doc.name) || 
                        (item.__parentArray && item.__parentArray[0] && item.__parentArray[0].name) || 
                        'Unknown Item';
                        
        const itemPrice = typeof item.price === 'number' ? item.price : 
                     (item._doc?.price || item.__parentArray?.[0]?.price || 0);
                     
        const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 
                        (item._doc?.quantity || item.__parentArray?.[0]?.quantity || 1);
        
        return {
          name: itemName,
          price: Number(itemPrice),
          quantity: Number(itemQuantity),
          _id: item._id
        };
      }),
      totalPrice: Number(order.totalPrice),
      deliveryFee: Number(order.deliveryFee),
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
    
    // Store it in localStorage as a backup
    localStorage.setItem('lastOrderId', order._id);
    
    // Also fetch the user profile to ensure user details are available
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.get('/api/user/profile')
        .then(response => {
          console.log("User profile fetched:", response.data);
          localStorage.setItem('userData', JSON.stringify(response.data));
        })
        .catch(err => console.error("Failed to fetch user profile:", err));
    }
    
    // Navigate to the invoice with the cleaned order data
    navigate(`/invoice/${order._id}`, {
      state: { 
        order: cleanOrder,
        // Add current user information to be used in the invoice
        userDetails: {
          name: localStorage.getItem('name') || 'Customer',
          email: localStorage.getItem('email') || '',
          phone: localStorage.getItem('phone') || ''
        }
      }
    });
  };
  

  
  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="order-confirmation-container">
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading your most recent order...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <PageLayout>
        <div className="order-confirmation-container">
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
            <div className="action-buttons">
              <button onClick={() => {
                testBackendConnection();
                fetchMostRecentOrder();
              }}>Try Again</button>
              <button onClick={() => navigate('/my-orders')}>View All Orders</button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // No order found state
  if (!order) {
    return (
      <PageLayout>
        <div className="order-confirmation-container">
          <div className="error-message">
            <h3>No Order Found</h3>
            <p>We couldn't find any orders for your account.</p>
            <div className="action-buttons">
              <button onClick={() => navigate('/order-food')}>Order Food</button>
              <button onClick={() => navigate('/my-orders')}>View All Orders</button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Main render with order data
  return (
    <div className="order-confirmation-page">
      {/* Hero Section */}
      <div className="confirmation-hero">
        <div className="hero-content">
          <div className="success-animation">
            <MdRestaurant className="success-icon" />
          </div>
          <h1 className="hero-title">🍕 Order Confirmed!</h1>
          <p className="hero-subtitle">Your delicious meal is being prepared with care</p>
          <div className="order-id-badge">
            <FiHash className="badge-icon" />
            <span>Order ID: {order._id?.substring(0, 8).toUpperCase() || 'TEMP'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="confirmation-content">
        <div className="content-container">

          {/* Quick Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card primary">
              <div className="card-icon">
                <FiClock />
              </div>
              <div className="card-content">
                <h3>Delivery Time</h3>
                <p>{order.estimatedDelivery || '30-45 minutes'}</p>
              </div>
            </div>

            <div className="summary-card accent">
              <div className="card-icon">
                <FiMapPin />
              </div>
              <div className="card-content">
                <h3>Delivery To</h3>
                <p>{order.deliveryAddress || 'Address not available'}</p>
              </div>
            </div>

            <div className="summary-card primary">
              <div className="card-icon">
                <FiPackage />
              </div>
              <div className="card-content">
                <h3>Status</h3>
                <p>{order.status || 'Processing'}</p>
              </div>
            </div>

            <div className="summary-card success">
              <div className="card-icon">
                <FiDollarSign />
              </div>
              <div className="card-content">
                <h3>Total Paid</h3>
                <p>Rs. {formatPrice(order.totalPrice || 0)}</p>
              </div>
            </div>
          </div>

          {/* Order Items Section */}
          <div className="order-items-section">
            <h2 className="section-title">Your Order</h2>
            <div className="order-items-grid">
              {order.items?.map((item, index) => {
                // Extract the required properties safely from any object structure
                const itemName = item.name ||
                                (item._doc && item._doc.name) ||
                                (item.__parentArray && item.__parentArray[0] && item.__parentArray[0].name) ||
                                'Unknown Item';

                const itemPrice = typeof item.price === 'number' ? item.price :
                             (item._doc?.price || item.__parentArray?.[0]?.price || 0);

                const itemQuantity = typeof item.quantity === 'number' ? item.quantity :
                                (item._doc?.quantity || item.__parentArray?.[0]?.quantity || 1);

                return (
                  <div key={index} className="order-item-card">
                    <div className="item-details">
                      <h4 className="item-name">{itemName}</h4>
                      <div className="item-meta">
                        <span className="item-quantity">Qty: {itemQuantity}</span>
                        <span className="item-unit-price">Rs. {formatPrice(itemPrice)} each</span>
                      </div>
                    </div>
                    <div className="item-total">
                      <span className="total-price">Rs. {formatPrice(itemPrice * itemQuantity)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Total */}
            <div className="order-total-section">
              <div className="total-row">
                <span className="total-label">Subtotal:</span>
                <span className="total-value">Rs. {formatPrice(calculateSubtotal())}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Delivery Fee:</span>
                <span className="total-value">Rs. {formatPrice(order.deliveryFee || 0)}</span>
              </div>
              <div className="total-row final-total">
                <span className="total-label">Total:</span>
                <span className="total-value">Rs. {formatPrice(order.totalPrice || 0)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            {isOrderTrackable() && (
              <button
                onClick={handleTrackOrder}
                className="action-btn secondary"
              >
                <FiPackage />
                <span>Track Order</span>
              </button>
            )}
            <button
              onClick={handleViewInvoice}
              className="action-btn primary"
            >
              <FiPrinter />
              <span>View & Download Invoice</span>
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="action-btn secondary"
            >
              <FiArrowLeft />
              <span>View All Orders</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 
