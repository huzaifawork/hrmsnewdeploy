const mongoose = require('mongoose');

// Table Recommendation Model
const tableRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  recommendedTables: [{
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    reason: {
      type: String,
      enum: ['collaborative_filtering', 'content_based', 'popularity', 'contextual', 'hybrid', 'smart_matching'],
      required: true
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    rank: {
      type: Number,
      required: true
    },
    contextFactors: {
      occasion: String,
      timePreference: String,
      partySize: Number,
      ambiance: String,
      location: String
    },
    explanation: {
      type: String,
      required: true
    }
  }],
  context: {
    requestedOccasion: String,
    requestedTime: String,
    requestedPartySize: Number,
    userPreferences: {
      prefersQuiet: Boolean,
      prefersWindow: Boolean,
      prefersPrivate: Boolean,
      accessibilityNeeds: Boolean
    }
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  // Cache recommendations for 1 hour
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour in seconds
  },
  // Track which recommended tables were actually reserved
  reservedTables: [{
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table'
    },
    reservedAt: {
      type: Date,
      default: Date.now
    },
    rank: Number, // The rank of this table in the original recommendations
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TableReservation'
    }
  }],
  // Track which recommended tables were clicked/viewed
  clickedTables: [{
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    },
    rank: Number
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
tableRecommendationSchema.index({ userId: 1, generatedAt: -1 });
tableRecommendationSchema.index({ generatedAt: -1 });

// Check if model already exists to prevent recompilation
const TableRecommendation = mongoose.models.TableRecommendation || mongoose.model('TableRecommendation', tableRecommendationSchema);

module.exports = TableRecommendation;
