const express = require("express");
const cors = require("cors");

// Initialize express app first
const app = express();

// Basic middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Setup for Vercel
const corsOptions = {
  origin: [
    "http://localhost:3000",
    /\.vercel\.app$/,
    /\.localhost$/
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Health check route (must be first)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Serverless function is running'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Hotel Management System API - Serverless',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Initialize database connection (with error handling)
let dbConnected = false;
try {
  require("dotenv").config();
  console.log('Environment variables loaded');

  // Only try to connect to database if we have connection string
  if (process.env.MONGO_URI || process.env.Mongo_Conn) {
    require("./Models/db");
    dbConnected = true;
    console.log('Database connection initialized');
  } else {
    console.warn('No database connection string found');
  }
} catch (error) {
  console.error("Database connection error:", error);
  // Don't crash, just continue without database
}

// Import and register routes individually with error handling
let routesLoaded = 0;
let totalRoutes = 0;
let routeErrors = [];

// Helper function to safely load routes
function safeLoadRoute(routePath, mountPath, routeName) {
  try {
    console.log(`🔄 Attempting to load ${routeName} from ${routePath}...`);
    const route = require(routePath);
    app.use(mountPath, route);
    routesLoaded++;
    console.log(`✅ ${routeName} loaded successfully at ${mountPath}`);
    return true;
  } catch (error) {
    const errorInfo = {
      routeName,
      routePath,
      mountPath,
      error: error.message,
      stack: error.stack
    };
    routeErrors.push(errorInfo);
    console.error(`❌ Failed to load ${routeName}:`, error.message);
    console.error(`   Route path: ${routePath}`);
    console.error(`   Mount path: ${mountPath}`);
    console.error(`   Error stack:`, error.stack);
    return false;
  }
}

// Load core routes first
console.log('🔄 Loading routes...');

try {
  // Test route first (simplest)
  safeLoadRoute("./Routes/testRoutes", "/api/test-routes", "Test Routes");

  // Essential routes
  safeLoadRoute("./Routes/menuRoutes", "/api/menus", "Menu Routes");
  safeLoadRoute("./Routes/roomRoutes", "/api/rooms", "Room Routes");
  safeLoadRoute("./Routes/tableRoutes", "/api/tables", "Table Routes");
  safeLoadRoute("./Routes/orderRoutes", "/api/orders", "Order Routes");
  safeLoadRoute("./Routes/bookingRoutes", "/api/bookings", "Booking Routes");
  safeLoadRoute("./Routes/AuthRouter", "/auth", "Auth Routes");
} catch (error) {
  console.error('Critical error loading core routes:', error);
}

try {
  // Additional routes
  safeLoadRoute("./Routes/PicRoutes", "/api/files", "File Routes");
  safeLoadRoute("./Routes/staffRoutes", "/api/staff", "Staff Routes");
  safeLoadRoute("./Routes/shiftroutes", "/api/shift", "Shift Routes");
  safeLoadRoute("./Routes/ProductRouter", "/api/products", "Product Routes");
  safeLoadRoute("./Routes/GoogleRoutes", "/auth/google", "Google Auth Routes");
  safeLoadRoute("./Routes/ReservationRoutes", "/api/reservations", "Reservation Routes");
  safeLoadRoute("./Routes/ReservationRoutes", "/api/table-reservations", "Table Reservation Routes");
  safeLoadRoute("./Routes/UserRoutes", "/api/user", "User Routes");
  safeLoadRoute("./Routes/feedbackRoutes", "/api/feedback", "Feedback Routes");
  safeLoadRoute("./Routes/AdminRoutes", "/api/admin", "Admin Routes");
  safeLoadRoute("./Routes/paymentRoutes", "/api/payment", "Payment Routes");
  safeLoadRoute("./Routes/recommendationRoutes", "/api/food-recommendations", "Food Recommendation Routes");
} catch (error) {
  console.error('Error loading additional routes:', error);
}

totalRoutes = 18;
console.log(`📊 Routes loaded: ${routesLoaded}/${totalRoutes}`);

// Add a simple test route to verify routing works
app.get('/api/simple-test', (req, res) => {
  res.json({
    success: true,
    message: 'Simple routing test successful',
    timestamp: new Date().toISOString()
  });
});

// Test file system access
app.get('/api/debug/filesystem', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  try {
    const routesDir = path.join(__dirname, 'Routes');
    const files = fs.readdirSync(routesDir);

    res.json({
      success: true,
      routesDirectory: routesDir,
      filesFound: files,
      testRouteExists: files.includes('testRoutes.js'),
      menuRouteExists: files.includes('menuRoutes.js'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      __dirname,
      timestamp: new Date().toISOString()
    });
  }
});

// System info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    success: true,
    system: {
      database: dbConnected ? 'connected' : 'disconnected',
      routes: `${routesLoaded}/${totalRoutes} loaded`,
      routesWorking: routesLoaded > 0,
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    }
  });
});

// Route errors endpoint
app.get('/api/debug/errors', (req, res) => {
  res.status(200).json({
    success: true,
    routesLoaded,
    totalRoutes,
    errors: routeErrors,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

// Debug routes endpoint
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });

  res.json({
    success: true,
    routesLoaded: routesLoaded,
    totalRoutes: totalRoutes,
    registeredRoutes: routes,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS Backend API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/status', '/api/info', '/api/test']
  });
});

// Public test endpoints for API verification
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      success: true,
      database: {
        state: states[connectionState],
        readyState: connectionState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Public menu test (no auth required)
app.get('/api/test-menus', async (req, res) => {
  try {
    const Menu = require('./Models/Menu');
    const count = await Menu.countDocuments();
    const sample = await Menu.findOne().lean();

    res.json({
      success: true,
      menuCount: count,
      sampleMenu: sample ? {
        id: sample._id,
        name: sample.name,
        category: sample.category,
        price: sample.price
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Public rooms test (no auth required)
app.get('/api/test-rooms', async (req, res) => {
  try {
    const Room = require('./Models/Room');
    const count = await Room.countDocuments();
    const sample = await Room.findOne().lean();

    res.json({
      success: true,
      roomCount: count,
      sampleRoom: sample ? {
        id: sample._id,
        roomType: sample.roomType,
        roomNumber: sample.roomNumber,
        price: sample.price,
        status: sample.status
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Export for Vercel
module.exports = app;
