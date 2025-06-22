const mongoose = require('mongoose');

// HARDCODED CONNECTION STRING FOR IMMEDIATE FIX
const mongo_url = "mongodb+srv://mhuzaifatariq7:zqdaRL05TfaNgD8x@cluster0.kyswp.mongodb.net/hrms?retryWrites=true&w=majority&appName=HRMS&maxIdleTimeMS=30000&serverSelectionTimeoutMS=10000";

console.log('✅ Using hardcoded MongoDB connection string');
console.log('🔗 Connection URL:', mongo_url.substring(0, 50) + '...');
console.log('🔍 Cluster:', mongo_url.includes('cluster0.kyswp') ? 'CORRECT' : 'WRONG');

// Global connection state
let isConnected = false;

// Optimized connection for serverless
const connectDB = async () => {
    // Force fresh connection - don't reuse if there were previous errors
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        return mongoose.connection;
    }

    try {
        // Close any existing connection first
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔄 Closed previous connection');
        }

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Reduced for faster failure
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
            maxPoolSize: 3, // Reduced for serverless
            minPoolSize: 0, // Allow 0 connections when idle
            maxIdleTimeMS: 30000,
            bufferCommands: false, // Disable for serverless
            retryWrites: true,
            w: 'majority',
            heartbeatFrequencyMS: 10000,
            family: 4 // Force IPv4
        };

        console.log('🔄 Attempting fresh MongoDB connection...');
        console.log('🔗 URL:', mongo_url.substring(0, 60) + '...');

        await mongoose.connect(mongo_url, options);

        isConnected = true;
        console.log("✅ Connected to MongoDB successfully");

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });

        return mongoose.connection;
    } catch (err) {
        console.error("❌ MongoDB Connection failed:", err);
        isConnected = false;
        throw err;
    }
};

// Create default admin function
const createDefaultAdmin = async () => {
    try {
        if (!isConnected) {
            await connectDB();
        }

        const UserModel = require('./User');
        const bcrypt = require('bcrypt');

        const adminExists = await UserModel.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            const admin = new UserModel({
                name: "Default Admin",
                email: "admin@hrms.com",
                password: hashedPassword,
                role: "admin"
            });
            await admin.save();
            console.log("✅ Default admin created: admin@hrms.com / admin123");
        } else {
            console.log("✅ Admin user already exists");
        }
    } catch (error) {
        console.error("❌ Error creating default admin:", error);
    }
};

// Export connection function and utilities
module.exports = {
    connectDB,
    isConnected: () => isConnected,
    createDefaultAdmin
};
