import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiCoffee, FiCalendar, FiStar } from "react-icons/fi";
import { BsShieldCheck, BsAward, BsClock } from "react-icons/bs";
import { useHotelInfo, useHeroContent } from "../../hooks/useHotelInfo";
import './MainContentCarousel.css';

const MainContentCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Get dynamic hotel content
  const hotelInfo = useHotelInfo();
  const heroContent = useHeroContent();

  // Fallback images in case Unsplash fails
  const fallbackImages = [
    "https://via.placeholder.com/2070x1380/1a365d/ffffff?text=Luxury+Hotel",
    "https://via.placeholder.com/2070x1380/2d3748/ffffff?text=Fine+Dining",
    "https://via.placeholder.com/2070x1380/4a5568/ffffff?text=Premium+Experience"
  ];

  // Debug: Check if router context is available
  useEffect(() => {
    console.log('Router context available:', !!navigate);
    console.log('Current location:', location.pathname);
  }, [navigate, location]);

  const handleNavigation = (path, event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Navigating to:', path); // Debug log
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location if navigate fails
      window.location.href = path;
    }
  };

  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: heroContent.mainTitle,
      subtitle: heroContent.subtitle,
      description: heroContent.description
    },
    {
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Culinary Excellence Awaits",
      subtitle: "AUTHENTIC FLAVORS",
      description: `Finest cuisine at ${hotelInfo.hotelName}`
    },
    {
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Premium Dining Experience",
      subtitle: "RESTAURANT",
      description: `Exceptional cuisine and service at ${hotelInfo.hotelName}`
    }
  ];

  // Handle image loading errors
  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Get image URL with fallback
  const getImageUrl = (slide, index) => {
    return imageErrors[index] ? fallbackImages[index] : slide.image;
  };

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Preload images to ensure they display
  useEffect(() => {
    heroSlides.forEach((slide, index) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Image ${index} loaded successfully`);
      };
      img.onerror = () => {
        console.log(`Image ${index} failed to load, using fallback`);
        handleImageError(index);
      };
      img.src = slide.image;
    });
  }, [heroSlides]);

  return (
    <div className={`hero-section ${isLoaded ? 'loaded' : ''}`}>
      {/* Background Images with Parallax Effect */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`hero-background ${index === currentSlide ? 'active' : ''}`}
          style={{
            backgroundImage: `url(${getImageUrl(slide, index)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      ))}

      {/* Enhanced Gradient Overlays */}
      <div className="gradient-overlay-primary" />
      <div className="gradient-overlay-secondary" />
      <div className="gradient-overlay-accent" />

      {/* Animated Particles */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Main Hero Content */}
      <div className="hero-content">
        <div className="hero-badge">
          <BsAward className="badge-icon" />
          <span>5-Star Luxury Hotel</span>
        </div>

        <p className="hero-subtitle">{heroSlides[currentSlide].subtitle}</p>
        <h1 className="hero-title">{heroSlides[currentSlide].title}</h1>
        <p className="hero-description">{heroSlides[currentSlide].description}</p>

        {/* Enhanced Action Buttons */}
        <div className="hero-buttons">
          <button
            onClick={(e) => handleNavigation('/rooms', e)}
            className="hero-btn primary book-room"
            type="button"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000
            }}
          >
            <div className="btn-icon">
              <FiHome />
            </div>
            <div className="btn-content">
              <span className="btn-title">Book Room</span>
            </div>
          </button>

          <button
            onClick={(e) => handleNavigation('/order-food', e)}
            className="hero-btn secondary order-food"
            type="button"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000
            }}
          >
            <div className="btn-icon">
              <FiCoffee />
            </div>
            <div className="btn-content">
              <span className="btn-title">Order Food</span>
            </div>
          </button>

          <button
            onClick={(e) => handleNavigation('/reserve-table', e)}
            className="hero-btn tertiary reserve-table"
            type="button"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000
            }}
          >
            <div className="btn-icon">
              <FiCalendar />
            </div>
            <div className="btn-content">
              <span className="btn-title">Reserve Table</span>
            </div>
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="trust-indicators">
          <div className="trust-item">
            <BsShieldCheck className="trust-icon" />
            <span>Secure Booking</span>
          </div>
          <div className="trust-item">
            <BsClock className="trust-icon" />
            <span>24/7 Service</span>
          </div>
          <div className="trust-item">
            <FiStar className="trust-icon" />
            <span>5-Star Rated</span>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="slide-indicators">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>


    </div>
  );
};

export default MainContentCarousel;