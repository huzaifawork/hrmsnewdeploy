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
  require("./Models/db");
  dbConnected = true;
  console.log('Database connection initialized');
} catch (error) {
  console.error("Database connection error:", error);
}

// Import Routes with error handling
let routesLoaded = false;
try {
  const menuRoutes = require("./Routes/menuRoutes");
  const fileRoutes = require("./Routes/PicRoutes");
  const tableRoutes = require("./Routes/tableRoutes");
  const roomRoutes = require("./Routes/roomRoutes");
  const staffRoutes = require("./Routes/staffRoutes");
  const shiftRoutes = require("./Routes/shiftroutes");
  const AuthRouter = require("./Routes/AuthRouter");
  const ProductRouter = require("./Routes/ProductRouter");
  const GoogleRoutes = require("./Routes/GoogleRoutes");
  const bookingRoutes = require("./Routes/bookingRoutes");
  const orderRoutes = require("./Routes/orderRoutes");
  const reservationRoutes = require("./Routes/ReservationRoutes");
  const userRoutes = require("./Routes/UserRoutes");
  const feedbackRoutes = require("./Routes/feedbackRoutes");
  const adminRoutes = require('./Routes/AdminRoutes');
  const paymentRoutes = require('./Routes/paymentRoutes');
  const recommendationRoutes = require('./Routes/recommendationRoutes');

  // Register Routes
  app.use("/api/menus", menuRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api/tables", tableRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/shift", shiftRoutes);
  app.use("/auth", AuthRouter);
  app.use("/api/products", ProductRouter);
  app.use("/auth/google", GoogleRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/reservations", reservationRoutes);
  app.use("/api/table-reservations", reservationRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/food-recommendations", recommendationRoutes);
  app.use("/api/table-recommendations", tableRoutes);

  routesLoaded = true;
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

// System info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    success: true,
    system: {
      database: dbConnected ? 'connected' : 'disconnected',
      routes: routesLoaded ? 'loaded' : 'failed',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    }
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

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS Backend API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/status', '/api/info', '/api/test']
  });
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
