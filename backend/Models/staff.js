const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['manager', 'chef', 'waiter', 'host', 'admin'],
    default: 'waiter'
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Front Desk', 'Housekeeping', 'Kitchen', 'Maintenance', 'Management', 'kitchen', 'service', 'management', 'front-desk'],
    default: 'service'
  },
  salary: {
    type: Number,
    default: 0
  },
  hireDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'active', 'inactive', 'on-leave'],
    default: 'Active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    sparse: true // This allows multiple null values and prevents unique constraint issues
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
staffSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
