const mongoose = require('mongoose');

// HARDCODED CONNECTION STRING FOR IMMEDIATE FIX
const mongo_url = "mongodb+srv://mhuzaifatariq7:zqdaRL05TfaNgD8x@cluster0.kyswp.mongodb.net/hrms?retryWrites=true&w=majority";

console.log('✅ Using hardcoded MongoDB connection string');
console.log('🔗 Connection URL:', mongo_url.substring(0, 50) + '...');
console.log('🔍 Cluster:', mongo_url.includes('cluster0.kyswp') ? 'CORRECT' : 'WRONG');

// Global connection state
let isConnected = false;

// Optimized connection for serverless
const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        return mongoose.connection;
    }

    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 5, // Reduced for serverless
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            bufferCommands: true,
            retryWrites: true,
            w: 'majority'
        };

        console.log('🔄 Connecting to MongoDB with URL:', mongo_url.substring(0, 50) + '...');
        console.log('🔄 Connection options:', JSON.stringify(options, null, 2));

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
