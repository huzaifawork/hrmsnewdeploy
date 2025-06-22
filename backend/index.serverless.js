const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Initialize database connection
try {
  require("./Models/db");
} catch (error) {
  console.error("Database connection error:", error);
}

// Initialize ML models (simplified for serverless)
const mlModelLoader = require('./utils/mlModelLoader');

// Load recommendation models without Python services for serverless
async function initializeRecommendationSystem() {
  try {
    console.log('🤖 Initializing Food Recommendation System (Serverless)...');

    // Load ML models without Python service
    const mlSuccess = await mlModelLoader.loadModels();

    if (mlSuccess) {
      console.log('Food Recommendation System initialized successfully!');
      console.log('Using mock SVD model (Python service unavailable in serverless)');
    } else {
      console.log('Food Recommendation System failed to initialize');
    }

    return mlSuccess;
  } catch (error) {
    console.error('Error initializing recommendation system:', error);
    return false;
  }
}

// Initialize the recommendation system
initializeRecommendationSystem().catch(console.error);

const app = express();

// CORS Setup for Vercel
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app",
    /\.vercel\.app$/
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import Routes
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

// Health check route
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
    environment: 'production'
  });
});

// ML Model info endpoint
app.get('/api/ml-info', (req, res) => {
  const modelInfo = mlModelLoader.getModelInfo();
  res.status(200).json({
    success: true,
    mlSystem: modelInfo,
    timestamp: new Date().toISOString()
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
