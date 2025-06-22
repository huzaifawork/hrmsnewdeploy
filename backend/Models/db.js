const mongoose = require('mongoose');
const UserModel = require('./User');
const bcrypt = require('bcrypt');

const mongo_url = process.env.Mongo_Conn || process.env.MONGO_URI;

// Serverless-optimized MongoDB connection
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB already connected");
            return;
        }

        const options = {
            bufferCommands: false,
            bufferMaxEntries: 0,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 1, // Maintain at least 1 socket connection
            maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
        };

        await mongoose.connect(mongo_url, options);
        console.log("✅ Connected to MongoDB");

        // Only create admin in development or first run
        if (process.env.NODE_ENV !== 'production') {
            createDefaultAdmin();
        }
    } catch (err) {
        console.error("❌ MongoDB Connection error:", err);
        throw err;
    }
};

// Connect immediately
connectDB();

const createDefaultAdmin = async () => {
    const adminExists = await UserModel.findOne({ role: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const admin = new UserModel({
            name: "Default Admin",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin"
        });
        await admin.save();
        console.log("Default admin account created with email: admin@example.com and password: admin123");
    }
};
