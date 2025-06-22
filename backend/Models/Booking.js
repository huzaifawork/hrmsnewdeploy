const mongoose = require("mongoose");

// Check if the model already exists to prevent recompilation
const Booking = mongoose.models.Booking || mongoose.model("Booking", new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  roomType: { type: String, required: true },
  roomNumber: { type: String, required: true },
  checkInDate: { type: String, required: true },
  checkOutDate: { type: String, required: true },
  guests: { type: Number, required: true },
  payment: { type: String, enum: ["card", "paypal"], required: true },
  totalPrice: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associate booking with user
  // Add customer information fields
  fullName: { type: String },
  email: { type: String },
  phone: { type: String },
  specialRequests: { type: String },
  // Payment tracking fields
  paymentIntentId: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'confirmed'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
}));

module.exports = Booking;