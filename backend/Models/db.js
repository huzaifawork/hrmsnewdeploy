const mongoose = require('mongoose');

// Use environment variables or fallback to your actual connection string
const mongo_url = process.env.Mongo_Conn ||
                  process.env.MONGO_URI ||
                  "mongodb+srv://mhuzaifatariq7:zqdaRL05TfaNgD8x@cluster0.kyswp.mongodb.net/hrms?retryWrites=true&w=majority";

if (!mongo_url) {
    console.error('❌ No MongoDB connection string found');
} else {
    console.log('✅ MongoDB connection string found');
    console.log('🔗 Using connection:', mongo_url.substring(0, 30) + '...');
}

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
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            // Remove problematic options for serverless
            bufferCommands: true, // Enable buffering for serverless
        };

        console.log('🔄 Connecting to MongoDB...');
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
