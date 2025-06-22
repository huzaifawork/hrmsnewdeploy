const mongoose = require('mongoose');

const mongo_url = process.env.Mongo_Conn || process.env.MONGO_URI;

if (!mongo_url) {
    console.error('❌ No MongoDB connection string found in environment variables');
    process.exit(1);
}

// Optimized connection for serverless
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const options = {
            bufferCommands: false,
            bufferMaxEntries: 0,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
        };

        const connection = await mongoose.connect(mongo_url, options);
        console.log("✅ Connected to MongoDB");
        return connection;
    } catch (err) {
        console.error("❌ MongoDB Connection error:", err);
        throw err;
    }
};

// Initialize connection
connectDB().catch(console.error);

// Create default admin only when needed
const createDefaultAdmin = async () => {
    try {
        const UserModel = require('./User');
        const bcrypt = require('bcrypt');

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
            console.log("✅ Default admin created: admin@example.com / admin123");
        }
    } catch (error) {
        console.error("❌ Error creating default admin:", error);
    }
};

// Export the connection function
module.exports = { connectDB, createDefaultAdmin };
