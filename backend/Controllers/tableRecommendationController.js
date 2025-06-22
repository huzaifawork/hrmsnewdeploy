const Table = require('../Models/Table');
const TableInteraction = require('../Models/TableInteraction');
const TableRecommendation = require('../Models/TableRecommendation');
const tableMLLoader = require('../utils/tableMLModelLoader');

// Record user interaction with a table
const recordTableInteraction = async (req, res) => {
  try {
    const { tableId, interactionType, rating, sessionDuration, context = {} } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Validate required fields
    if (!tableId || !interactionType || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID, interaction type, and user ID are required'
      });
    }

    // Validate table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Validate and sanitize context
    const validOccasions = ['Romantic', 'Business', 'Family', 'Friends', 'Celebration', 'Casual'];
    const validTimeSlots = ['Lunch', 'Early Dinner', 'Prime Dinner', 'Late Dinner'];

    const normalizeOccasion = (occasion) => {
      if (!occasion) return 'Casual';
      const normalized = occasion.charAt(0).toUpperCase() + occasion.slice(1).toLowerCase();
      return validOccasions.includes(normalized) ? normalized : 'Casual';
    };

    const normalizeTimeSlot = (timeSlot) => {
      if (!timeSlot) return 'Prime Dinner';
      const timeMap = {
        'lunch': 'Lunch',
        'early': 'Early Dinner',
        'evening': 'Prime Dinner',
        'prime': 'Prime Dinner',
        'late': 'Late Dinner',
        'dinner': 'Prime Dinner'
      };
      return timeMap[timeSlot.toLowerCase()] || 'Prime Dinner';
    };

    const validatedContext = {
      occasion: normalizeOccasion(context.occasion),
      timeSlot: normalizeTimeSlot(context.timeSlot),
      partySize: parseInt(context.partySize) || 2
    };

    // Create interaction record
    const interaction = new TableInteraction({
      userId,
      tableId,
      interactionType,
      rating: interactionType === 'rating' ? rating : undefined,
      sessionDuration: interactionType === 'view' ? sessionDuration : undefined,
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      source: req.body.source || 'direct',
      context: validatedContext
    });

    await interaction.save();

    // Update table statistics if it's a rating
    if (interactionType === 'rating' && rating) {
      await updateTableRating(tableId, rating);
    }

    // Update table booking count if it's a booking
    if (interactionType === 'booking') {
      await Table.findByIdAndUpdate(tableId, { $inc: { totalBookings: 1 } });
    }

    res.status(201).json({
      success: true,
      message: 'Interaction recorded successfully',
      interaction: {
        id: interaction._id,
        interactionType,
        timestamp: interaction.timestamp
      }
    });

  } catch (error) {
    console.error('Error recording table interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record interaction',
      error: error.message
    });
  }
};

// Get table recommendations for a user
const getTableRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const {
      occasion = 'casual',
      partySize,
      timeSlot = 'evening',
      numRecommendations = 10,
      useCache = true
    } = req.query;

    // Validate and sanitize inputs
    const validOccasions = ['Romantic', 'Business', 'Family', 'Friends', 'Celebration', 'Casual'];
    const validTimeSlots = ['Lunch', 'Early Dinner', 'Prime Dinner', 'Late Dinner'];

    const normalizeOccasion = (occasion) => {
      if (!occasion) return 'Casual';
      const normalized = occasion.charAt(0).toUpperCase() + occasion.slice(1).toLowerCase();
      return validOccasions.includes(normalized) ? normalized : 'Casual';
    };

    const normalizeTimeSlot = (timeSlot) => {
      if (!timeSlot) return 'Prime Dinner';
      const timeMap = {
        'lunch': 'Lunch',
        'early': 'Early Dinner',
        'evening': 'Prime Dinner',
        'prime': 'Prime Dinner',
        'late': 'Late Dinner',
        'dinner': 'Prime Dinner'
      };
      return timeMap[timeSlot.toLowerCase()] || 'Prime Dinner';
    };

    const validatedPartySize = parseInt(partySize) || 2;
    const validatedOccasion = normalizeOccasion(occasion);
    const validatedTimeSlot = normalizeTimeSlot(timeSlot);
    const validatedUserId = userId || 'guest';

    // Ensure partySize is a valid number
    if (isNaN(validatedPartySize) || validatedPartySize < 1 || validatedPartySize > 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid party size. Must be between 1 and 20.',
        partySize: validatedPartySize
      });
    }

    // Check for cached recommendations if requested
    if (useCache && validatedUserId !== 'guest') {
      const cachedRecs = await TableRecommendation.findOne({
        userId: validatedUserId,
        'context.requestedOccasion': validatedOccasion,
        'context.requestedPartySize': validatedPartySize,
        generatedAt: { $gte: new Date(Date.now() - 3600000) } // 1 hour cache
      }).populate('recommendedTables.tableId');

      if (cachedRecs) {
        return res.status(200).json({
          success: true,
          recommendations: cachedRecs.recommendedTables,
          cached: true,
          generatedAt: cachedRecs.generatedAt
        });
      }
    }

    // Prepare context for ML model
    const context = {
      occasion: validatedOccasion,
      partySize: validatedPartySize,
      timeSlot: validatedTimeSlot
    };

    // Always get available tables first as base data
    const allAvailableTables = await Table.find({ status: 'Available' }).sort({ avgRating: -1, totalBookings: -1 });

    if (allAvailableTables.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: [],
        cached: false,
        fallback: true,
        message: 'No tables available at the moment'
      });
    }

    let mlRecommendations = [];
    let usingMLModel = false;

    // Try to get recommendations from ML model
    try {
      if (tableMLLoader.isLoaded()) {
        mlRecommendations = tableMLLoader.getRecommendations(
          validatedUserId,
          context,
          parseInt(numRecommendations)
        );
        usingMLModel = true;
        console.log(`🤖 ML Model provided ${mlRecommendations.length} recommendations`);
      }
    } catch (mlError) {
      console.log('⚠️ ML model failed, using smart fallback:', mlError.message);
    }

    // If ML model didn't provide enough recommendations, use smart matching
    if (mlRecommendations.length < parseInt(numRecommendations)) {
      console.log(`🔄 Supplementing with smart matching (need ${parseInt(numRecommendations) - mlRecommendations.length} more)`);

      // Smart table matching based on context and preferences
      const matchCriteria = { status: 'Available' };

      // Match capacity preference (within reasonable range)
      if (validatedPartySize) {
        matchCriteria.capacity = {
          $gte: Math.max(1, validatedPartySize - 1),
          $lte: validatedPartySize + 2
        };
      }

      // Match ambiance for occasion
      if (validatedOccasion === 'Romantic') {
        matchCriteria.ambiance = { $in: ['Intimate', 'Romantic', 'Quiet'] };
      } else if (validatedOccasion === 'Business') {
        matchCriteria.ambiance = { $in: ['Formal', 'Quiet'] };
      } else if (validatedOccasion === 'Celebration') {
        matchCriteria.ambiance = { $in: ['Lively', 'Social'] };
      }

      const smartMatchedTables = await Table.find(matchCriteria).sort({ avgRating: -1, totalBookings: -1 });
      const tablesToUse = smartMatchedTables.length > 0 ? smartMatchedTables : allAvailableTables;

      // Get existing table IDs from ML recommendations
      const existingTableIds = new Set(mlRecommendations.map(rec => rec.tableId));

      // Add smart recommendations for missing slots
      const additionalTables = tablesToUse
        .filter(table => !existingTableIds.has(table._id.toString()))
        .slice(0, parseInt(numRecommendations) - mlRecommendations.length);

      // Convert additional tables to recommendation format
      const additionalRecommendations = additionalTables.map((table, index) => ({
        tableId: table._id.toString(),
        score: usingMLModel ? 0.6 + (Math.random() * 0.2) : (additionalTables.length - index) / additionalTables.length,
        reason: usingMLModel ? 'smart_matching' : 'popularity',
        confidence: 'medium',
        rank: mlRecommendations.length + index + 1,
        explanation: `Great table for ${validatedOccasion.toLowerCase()} dining`
      }));

      mlRecommendations = [...mlRecommendations, ...additionalRecommendations];
    }

    // Enrich recommendations with table details
    const enrichedRecommendations = await Promise.all(
      mlRecommendations.slice(0, parseInt(numRecommendations)).map(async (rec, index) => {
        let table = null;

        // Enhanced table matching logic
        if (rec.tableId && rec.tableId.match(/^[0-9a-fA-F]{24}$/)) {
          // Direct MongoDB ObjectId match
          table = await Table.findById(rec.tableId);
        }

        // Fallback to finding table by index if direct match fails
        if (!table) {
          table = allAvailableTables[index % allAvailableTables.length];
          if (!table) return null;
        }

        // Generate intelligent explanation based on matching factors
        const explanationFactors = [];

        if (table.capacity >= validatedPartySize && table.capacity <= validatedPartySize + 2) {
          explanationFactors.push(`perfect size for ${validatedPartySize} guests`);
        }

        if (validatedOccasion === 'Romantic' && ['Intimate', 'Romantic', 'Quiet'].includes(table.ambiance)) {
          explanationFactors.push(`${table.ambiance.toLowerCase()} ambiance ideal for romantic dining`);
        } else if (validatedOccasion === 'Business' && ['Formal', 'Quiet'].includes(table.ambiance)) {
          explanationFactors.push(`${table.ambiance.toLowerCase()} setting perfect for business meetings`);
        } else if (validatedOccasion === 'Celebration' && ['Lively', 'Social'].includes(table.ambiance)) {
          explanationFactors.push(`${table.ambiance.toLowerCase()} atmosphere great for celebrations`);
        }

        if (table.hasWindowView) {
          explanationFactors.push('beautiful window view');
        }

        if (table.isPrivate) {
          explanationFactors.push('private dining experience');
        }

        if (table.avgRating >= 4.0) {
          explanationFactors.push(`highly rated (${table.avgRating}/5 stars)`);
        }

        const intelligentExplanation = explanationFactors.length > 0 ?
          `Recommended for ${explanationFactors.join(', ')}` :
          `Great table for ${validatedOccasion.toLowerCase()} dining`;

        return {
          tableId: table._id,
          table: {
            _id: table._id,
            tableName: table.tableName,
            capacity: table.capacity,
            location: table.location,
            ambiance: table.ambiance,
            hasWindowView: table.hasWindowView,
            isPrivate: table.isPrivate,
            priceTier: table.priceTier,
            features: table.features,
            avgRating: table.avgRating,
            image: table.image,
            description: table.description,
            tableType: table.tableType,
            status: table.status
          },
          score: rec.score || (0.7 + Math.random() * 0.3), // Better default scores
          reason: rec.reason || 'smart_matching',
          confidence: rec.confidence || (explanationFactors.length >= 2 ? 'high' : 'medium'),
          rank: index + 1,
          explanation: intelligentExplanation,
          contextFactors: {
            occasion: validatedOccasion,
            timePreference: validatedTimeSlot,
            partySize: validatedPartySize,
            ambiance: table.ambiance,
            location: table.location,
            matchingFactors: explanationFactors
          }
        };
      })
    );

    // Filter out null recommendations
    const validRecommendations = enrichedRecommendations.filter(rec => rec !== null);

    // If no ML recommendations, get popular tables
    if (validRecommendations.length === 0) {
      const popularTables = await Table.find({ status: 'Available' })
        .sort({ avgRating: -1, totalBookings: -1 })
        .limit(parseInt(numRecommendations));

      const fallbackRecs = popularTables.map((table, index) => ({
        tableId: table._id,
        table: {
          _id: table._id,
          tableName: table.tableName,
          capacity: table.capacity,
          location: table.location,
          ambiance: table.ambiance,
          hasWindowView: table.hasWindowView,
          isPrivate: table.isPrivate,
          priceTier: table.priceTier,
          features: table.features,
          avgRating: table.avgRating,
          image: table.image,
          description: table.description
        },
        score: (popularTables.length - index) / popularTables.length,
        reason: 'popularity',
        confidence: 'medium',
        rank: index + 1,
        explanation: 'Popular table with high ratings'
      }));

      return res.status(200).json({
        success: true,
        recommendations: fallbackRecs,
        cached: false,
        fallback: true,
        message: 'Showing popular tables'
      });
    }

    // Cache recommendations (only for logged-in users)
    if (validatedUserId !== 'guest') {
      const recommendationDoc = new TableRecommendation({
        userId: validatedUserId,
        recommendedTables: validRecommendations,
        context: {
          requestedOccasion: validatedOccasion,
          requestedTime: validatedTimeSlot,
          requestedPartySize: validatedPartySize
        }
      });

      await recommendationDoc.save();
    }

    res.status(200).json({
      success: true,
      recommendations: validRecommendations,
      cached: false,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Error getting table recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};

// Get user's table interaction history
const getUserTableHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 50, interactionType } = req.query;

    const query = { userId };
    if (interactionType) {
      query.interactionType = interactionType;
    }

    const interactions = await TableInteraction.find(query)
      .populate('tableId', 'tableName capacity location ambiance image')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const summary = await TableInteraction.aggregate([
      { $match: { userId: userId } },
      { $group: {
        _id: '$interactionType',
        count: { $sum: 1 }
      }}
    ]);

    res.status(200).json({
      success: true,
      interactions,
      summary: summary.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      total: interactions.length
    });

  } catch (error) {
    console.error('Error getting user table history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user history',
      error: error.message
    });
  }
};

// Get popular tables
const getPopularTables = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const requestedLimit = parseInt(limit);

    // First try to get available tables
    let popularTables = await Table.find({ status: 'Available' })
      .sort({ avgRating: -1, totalBookings: -1 })
      .limit(requestedLimit * 2); // Get more to ensure we have enough

    // If we don't have enough available tables, supplement with all tables
    if (popularTables.length < requestedLimit) {
      console.log(`⚠️ Only ${popularTables.length} available tables, supplementing with all tables`);

      const allTables = await Table.find({})
        .sort({ avgRating: -1, totalBookings: -1 })
        .limit(requestedLimit * 2);

      // Get existing IDs to avoid duplicates
      const existingIds = new Set(popularTables.map(table => table._id.toString()));

      // Add non-duplicate tables
      const additionalTables = allTables.filter(table =>
        !existingIds.has(table._id.toString())
      );

      popularTables = [...popularTables, ...additionalTables].slice(0, requestedLimit);
    } else {
      // Limit to requested amount
      popularTables = popularTables.slice(0, requestedLimit);
    }

    // Ensure we have some data
    if (popularTables.length === 0) {
      return res.status(200).json({
        success: true,
        tables: [],
        popularTables: [],
        message: 'No tables found in database'
      });
    }

    const formattedTables = popularTables.map((table, index) => ({
      ...table.toObject(),
      popularityRank: index + 1,
      score: (parseInt(limit) - index) / parseInt(limit)
    }));

    res.status(200).json({
      success: true,
      tables: formattedTables,
      popularTables: formattedTables,
      message: `Found ${formattedTables.length} popular tables`
    });

  } catch (error) {
    console.error('Error getting popular tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular tables',
      error: error.message
    });
  }
};

// Helper function to update table rating
const updateTableRating = async (tableId, newRating) => {
  try {
    const table = await Table.findById(tableId);
    if (!table) return;

    // Get all ratings for this table
    const ratings = await TableInteraction.find({
      tableId,
      interactionType: 'rating',
      rating: { $exists: true }
    });

    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await Table.findByIdAndUpdate(tableId, { 
        avgRating: Math.round(avgRating * 10) / 10 
      });
    }
  } catch (error) {
    console.error('Error updating table rating:', error);
  }
};

// Get table analytics for admin
const getTableAnalytics = async (req, res) => {
  try {
    const analytics = await TableInteraction.aggregate([
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgSessionDuration: { $avg: '$sessionDuration' }
        }
      },
      {
        $project: {
          totalInteractions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgSessionDuration: { $round: ['$avgSessionDuration', 2] }
        }
      }
    ]);

    const interactionTypes = await TableInteraction.aggregate([
      {
        $group: {
          _id: '$interactionType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: analytics[0] || {
        totalInteractions: 0,
        uniqueUsers: 0,
        avgSessionDuration: 0
      },
      interactionTypes: interactionTypes.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mlModelStatus: tableMLLoader.getModelInfo()
    });

  } catch (error) {
    console.error('Error getting table analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

// Track table reservation from recommendations
const trackTableReservation = async (req, res) => {
  try {
    const { tableId, reservationId, userId } = req.body;
    const validatedUserId = userId || req.user?.id;

    if (!tableId || !validatedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID and user ID are required'
      });
    }

    // Find the most recent recommendation for this user
    const recentRecommendation = await TableRecommendation.findOne({
      userId: validatedUserId,
      'recommendedTables.tableId': tableId,
      generatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    }).sort({ generatedAt: -1 });

    if (recentRecommendation) {
      // Find the rank of this table in the recommendations
      const tableRec = recentRecommendation.recommendedTables.find(
        rec => rec.tableId.toString() === tableId.toString()
      );

      const rank = tableRec ? tableRec.rank : null;

      // Add to reserved tables tracking
      recentRecommendation.reservedTables.push({
        tableId,
        reservedAt: new Date(),
        rank,
        reservationId
      });

      await recentRecommendation.save();

      // Also record as an interaction
      await recordTableInteraction({
        body: {
          tableId,
          interactionType: 'booking',
          userId: validatedUserId,
          source: 'recommendation'
        },
        user: { id: validatedUserId }
      }, { status: () => ({ json: () => {} }) });

      res.status(200).json({
        success: true,
        message: 'Table reservation tracked successfully',
        rank
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Reservation recorded (no recent recommendation found)'
      });
    }

  } catch (error) {
    console.error('Error tracking table reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track reservation',
      error: error.message
    });
  }
};

// Get user's reserved tables from recommendations
const getReservedTablesFromRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find recommendations with reserved tables
    const recommendationsWithReservations = await TableRecommendation.find({
      userId,
      'reservedTables.0': { $exists: true } // Has at least one reserved table
    })
    .populate('reservedTables.tableId', 'tableName capacity location ambiance image avgRating')
    .populate('reservedTables.reservationId')
    .sort({ 'reservedTables.reservedAt': -1 })
    .limit(parseInt(limit));

    // Extract reserved tables with their recommendation context
    const reservedTables = [];
    recommendationsWithReservations.forEach(recommendation => {
      recommendation.reservedTables.forEach(reserved => {
        if (reserved.tableId) {
          reservedTables.push({
            table: reserved.tableId,
            reservedAt: reserved.reservedAt,
            rank: reserved.rank,
            reservationId: reserved.reservationId,
            recommendationContext: {
              occasion: recommendation.context.requestedOccasion,
              partySize: recommendation.context.requestedPartySize,
              timeSlot: recommendation.context.requestedTime,
              generatedAt: recommendation.generatedAt
            }
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      reservedTables: reservedTables.slice(0, parseInt(limit)),
      total: reservedTables.length,
      message: reservedTables.length > 0 ?
        `Found ${reservedTables.length} tables reserved from recommendations` :
        'No tables reserved from recommendations yet'
    });

  } catch (error) {
    console.error('Error getting reserved tables from recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reserved tables',
      error: error.message
    });
  }
};

module.exports = {
  recordTableInteraction,
  getTableRecommendations,
  getUserTableHistory,
  getPopularTables,
  getTableAnalytics,
  trackTableReservation,
  getReservedTablesFromRecommendations
};
