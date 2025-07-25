import React, { useEffect } from 'react';
import { FiX, FiStar, FiMapPin, FiUsers, FiHome } from 'react-icons/fi';
import { facility } from './data/Data';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RoomDetailsModal.css';

const RoomDetailsModal = ({ room, onClose }) => {
  const navigate = useNavigate();

  // Record room interaction when modal opens
  useEffect(() => {
    if (!room) return;

    const recordInteraction = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) return;

      try {
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://hrms-bace.vercel.app/api';
        await axios.post(
          `${apiUrl}/rooms/interactions`,
          {
            userId,
            roomId: room._id,
            interactionType: 'view'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (error) {
        console.error('Error recording room interaction:', error);
      }
    };

    recordInteraction();
  }, [room]);

  if (!room) return null;

  // Helper function to extract room ID
  const getRoomId = () => {
    // Since we're now passing the room with the correct _id from Rooms.js,
    // this should be straightforward
    const roomId = room._id || room.roomId || room.id;

    console.log('🔍 Modal Room ID debug:', {
      'room._id': room._id,
      'room.roomId': room.roomId,
      'room.id': room.id,
      'final roomId': roomId,
      'roomId type': typeof roomId
    });

    return roomId;
  };

  // Helper function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/placeholder-room.jpg';

    try {
      if (imagePath.startsWith('http')) return imagePath;
      const cleanPath = imagePath.replace(/^\/+/, '');
      // Use the base server URL (without /api) for images
      const serverURL = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_API_URL || 'https://hrms-bace.vercel.app';
      if (cleanPath.includes('uploads')) {
        return `${serverURL}/${cleanPath}`;
      }
      return `${serverURL}/uploads/${cleanPath}`;
    } catch (error) {
      console.error('Error formatting image URL:', error);
      return '/images/placeholder-room.jpg';
    }
  };

  // Format price in Pakistani Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX size={24} />
        </button>
        
        <div className="modal-header">
          <h2 className="modal-title">
            Room {room.roomNumber || room.roomName}
            <small className="text-muted ms-2">({room.roomType})</small>
          </h2>
          <div className="modal-rating">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`${i < (room.averageRating || 4) ? 'text-warning' : 'text-muted'}`}
                style={{ fill: i < (room.averageRating || 4) ? '#ffc107' : 'none' }}
                size={16}
              />
            ))}
            {room.totalRatings > 0 && (
              <small className="text-muted ms-2">({room.totalRatings} reviews)</small>
            )}
          </div>
        </div>

        <div className="modal-image-container">
          <img
            src={getImageUrl(room.image)}
            alt={room.roomNumber || room.roomName}
            className="modal-image"
            onError={(e) => {
              console.error('Error loading image:', room.image);
              e.target.src = '/images/placeholder-room.jpg';
              e.target.onerror = null;
            }}
          />
          <div className="modal-price">
            {formatPrice(room.price)}<small>/night</small>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-description">
            <h3>Description</h3>
            <p>{room.description}</p>
          </div>

          {/* Room Details */}
          <div className="modal-details mb-4">
            <h3>Room Details</h3>
            <div className="row">
              <div className="col-md-6">
                <div className="detail-item">
                  <FiHome className="me-2" />
                  <strong>Room Type:</strong> {room.roomType}
                </div>
                {room.capacity && (
                  <div className="detail-item">
                    <FiUsers className="me-2" />
                    <strong>Capacity:</strong> {room.capacity} guests
                  </div>
                )}
                {room.size && (
                  <div className="detail-item">
                    <FiMapPin className="me-2" />
                    <strong>Size:</strong> {room.size} sq ft
                  </div>
                )}
              </div>
              <div className="col-md-6">
                {room.bedType && (
                  <div className="detail-item">
                    <strong>Bed Type:</strong> {room.bedType}
                  </div>
                )}
                {room.floor && (
                  <div className="detail-item">
                    <strong>Floor:</strong> {room.floor}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Status:</strong>
                  <span className={`badge ms-2 ${room.status === 'Available' ? 'bg-success' : 'bg-warning'}`}>
                    {room.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Room Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="modal-amenities mb-4">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {room.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <span className="badge bg-secondary">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Features */}
          <div className="modal-features">
            <h3>Standard Features</h3>
            <div className="features-grid">
              {facility.map((fac, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-icon">{fac.icon}</span>
                  <span className="feature-text">{fac.quantity} {fac.facility}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                const roomId = getRoomId();

                if (!roomId) {
                  console.error('No valid room ID found for booking');
                  return;
                }

                // Record booking interaction
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                if (token && userId) {
                  const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://hrms-bace.vercel.app/api';
                  axios.post(
                    `${apiUrl}/rooms/interactions`,
                    {
                      userId,
                      roomId: roomId,
                      interactionType: 'booking'
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  ).catch(error => console.error('Error recording booking interaction:', error));
                }

                // Store room details for the booking page (same as in Rooms.js)
                const roomBookingData = {
                  roomId: roomId,
                  roomNumber: room.roomNumber,
                  roomType: room.roomType,
                  price: room.price,
                  description: room.description,
                  image: room.image,
                  capacity: room.capacity,
                  amenities: room.amenities,
                  averageRating: room.averageRating,
                  totalRatings: room.totalRatings,
                };
                localStorage.setItem(
                  "roomBookingData",
                  JSON.stringify(roomBookingData)
                );

                // Close modal first, then navigate
                onClose();
                navigate(`/booking-page/${roomId}`);
              }}
            >
              Book Now - {formatPrice(room.price)}/night
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsModal; 