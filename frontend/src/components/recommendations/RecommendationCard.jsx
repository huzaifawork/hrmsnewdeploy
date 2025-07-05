import React, { useState, useEffect, useCallback } from 'react';
import { OverlayTrigger, Tooltip, Toast } from 'react-bootstrap';
import { FiStar, FiShoppingCart, FiHeart, FiInfo, FiClock, FiAward } from 'react-icons/fi';
import { recommendationHelpers, recommendationAPI } from '../../api/recommendations';
import './RecommendationCard.css';

const RecommendationCard = ({ 
  recommendation, 
  onAddToCart, 
  onRate, 
  showReason = true,
  showConfidence = true,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [interactionCount, setInteractionCount] = useState(0);

  const {  score, reason, confidence } = recommendation;
  // Now all recommendations have a clean, consistent structure
  const menuItem = recommendation;

  // Debug: Log the menu item data to check price
  console.log('RecommendationCard - menuItem:', {
    name: menuItem.name,
    price: menuItem.price,
    _id: menuItem._id
  });

  // Define all hooks first (before any conditional returns)
  const recordInteraction = useCallback(async (type, rating = null) => {
    try {
      const userId = recommendationHelpers.getCurrentUserId();
      if (userId && menuItem?._id) {
        await recommendationAPI.recordInteraction(userId, menuItem._id, type, rating);
        setInteractionCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }, [menuItem?._id]);

  // Track view interaction when component mounts
  useEffect(() => {
    if (!isViewed && menuItem?._id) {
      setIsViewed(true);
      recordInteraction('view');
    }
  }, [menuItem?._id, isViewed, recordInteraction]);

  // Ensure we have valid menu item data (after all hooks)
  if (!menuItem || !menuItem.name) {
    console.warn('Invalid menu item data:', recommendation);
    return null; // Don't render if no valid data
  }

  // Format data for display
  const spiceInfo = recommendationHelpers.formatSpiceLevel(menuItem.spiceLevel);
  const dietaryTags = recommendationHelpers.formatDietaryTags(menuItem.dietaryTags || []);
  const confidenceInfo = recommendationHelpers.formatConfidence(confidence);
  const reasonText = recommendationHelpers.formatReason(reason);
  const starRating = recommendationHelpers.getStarRating(score || menuItem.averageRating || 4.5);

  const handleAddToCart = () => {
    recordInteraction('order');
    setToastMessage('Added to cart! 🛒');
    setShowToast(true);
    if (onAddToCart) {
      onAddToCart(menuItem);
    }
  };

  const handleRating = async (rating) => {
    setCurrentRating(rating);
    setIsRating(false);
    await recordInteraction('rating', rating);
    setToastMessage(`Rated ${rating} stars! ⭐`);
    setShowToast(true);
    if (onRate && menuItem?._id) {
      onRate(menuItem._id, rating);
    }
  };

  const handleFavorite = async () => {
    setIsFavorited(!isFavorited);
    await recordInteraction('favorite');
    setToastMessage(isFavorited ? 'Removed from favorites' : 'Added to favorites! ❤️');
    setShowToast(true);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder-food.jpg";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms-bace.vercel.app';
    return `${apiUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  };

  return (
    <div
      className={`recommendation-card ${className} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="recommendation-image-container">
        <img
          src={getImageUrl(menuItem.image)}
          alt={menuItem.name}
          className="recommendation-image"
          onError={(e) => {
            e.target.src = "/placeholder-food.jpg";
            e.target.onerror = null;
          }}
        />
        
        {/* Overlay Badges */}
        <div className="image-overlay">
          {/* Confidence Badge */}
          {showConfidence && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{confidenceInfo.text}</Tooltip>}
            >
              <span
                className="confidence-badge"
              >
                {confidenceInfo.icon}
              </span>
            </OverlayTrigger>
          )}

          {/* Score Badge */}
          <div className="score-badge">
            <FiStar className="star-icon" />
            {starRating.rating}
          </div>

          {/* Price Badge */}
          <div className="price-badge">
            Rs. {menuItem.price ? menuItem.price.toFixed(0) : 'N/A'}
          </div>
        </div>

        {/* Availability Overlay */}
        {!menuItem.availability && (
          <div className="unavailable-overlay">
            <span>Currently Unavailable</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="recommendation-body">
        {/* Header */}
        <div className="recommendation-header">
          <h5 className="recommendation-title">{menuItem.name}</h5>
          {showReason && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{reasonText}</Tooltip>}
            >
              <FiInfo className="reason-icon" />
            </OverlayTrigger>
          )}
        </div>

        {/* Description */}
        <p className="recommendation-description">
          {menuItem.description || "Delicious Pakistani cuisine prepared with authentic spices and fresh ingredients."}
        </p>

        {/* Price Display */}
        <div className="price-display">
          <span className="price-text">Rs. {menuItem.price ? menuItem.price.toFixed(0) : 'Price not available'}</span>
        </div>

        {/* Tags Row */}
        <div className="tags-row">
          {/* Cuisine Badge */}
          <span className="cuisine-badge">
            🍛 {menuItem.cuisine || 'Pakistani'}
          </span>

          {/* Spice Level */}
          <span className="spice-badge">
            {spiceInfo.emoji} {spiceInfo.text}
          </span>

          {/* Preparation Time */}
          {menuItem.preparationTime && (
            <span className="time-badge">
              <FiClock size={12} /> {menuItem.preparationTime}min
            </span>
          )}
        </div>

        {/* Dietary Tags */}
        {dietaryTags.length > 0 && (
          <div className="dietary-tags">
            {dietaryTags.map((tag, index) => (
              <span
                key={index}
                className="dietary-badge"
              >
                {tag.emoji} {tag.text}
              </span>
            ))}
          </div>
        )}

        {/* Star Rating Display */}
        <div className="star-rating-display">
          {[...Array(starRating.full)].map((_, i) => (
            <FiStar key={i} className="star filled" />
          ))}
          {starRating.half > 0 && <FiStar className="star half" />}
          {[...Array(starRating.empty)].map((_, i) => (
            <FiStar key={i + starRating.full + starRating.half} className="star empty" />
          ))}
          <span className="rating-text">
            ({menuItem.totalRatings || 0} reviews)
          </span>
        </div>

        {/* Interactive Rating */}
        {isRating && (
          <div className="interactive-rating">
            <span>Rate this dish:</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`rating-star ${star <= currentRating ? 'active' : ''}`}
                  onClick={() => handleRating(star)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="recommendation-actions">
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!menuItem.availability}
          >
            <FiShoppingCart className="btn-icon" />
            Add Cart
          </button>

          <button
            className="rate-btn"
            onClick={() => setIsRating(!isRating)}
          >
            <FiStar className="btn-icon" />
            Rate
          </button>

          <button
            className={`favorite-btn ${isFavorited ? "favorited" : ""}`}
            onClick={handleFavorite}
          >
            <FiHeart className={isFavorited ? "favorited" : ""} />
          </button>
        </div>

        {/* Recommendation Reason */}
        {showReason && reason && reason !== 'menu_item' && (
          <div className="recommendation-reason">
            <small className="reason-text">
              <FiAward className="reason-icon" />
              {reasonText}
            </small>
          </div>
        )}


      </div>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={2000}
        autohide
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000
        }}
      >
        <Toast.Body className="text-center">
          {toastMessage}
        </Toast.Body>
      </Toast>
    </div>
  );
};

export default RecommendationCard;
