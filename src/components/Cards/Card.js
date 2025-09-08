import React from 'react';
import './Card.css';

function Card({ event, onClick }) {
  const getEventStatus = () => {
    if (event.status === 'cancelled') {
      return { text: '🚫 Cancelled', class: 'status-cancelled' };
    }
    if (event.status === 'completed') {
      return { text: '✅ Completed', class: 'status-completed' };
    }
    if (event.status === 'closed') {
      return { text: '🔒 Registration Closed', class: 'status-closed' };
    }
    return null;
  };

  const status = getEventStatus();
  const isClickable = event.status === 'active';

  return (
    <div 
      className={`event-card ${!isClickable ? 'card-disabled' : ''}`} 
      onClick={isClickable ? onClick : undefined}
    >
      <div className="card-image">
        <img src={event.image} alt={event.title} />
        {status && (
          <div className={`event-status-overlay ${status.class}`}>
            {status.text}
          </div>
        )}
      </div>
      <div className="card-content">
        <h3 className="event-title">{event.title}</h3>
        <div className="event-details">
          <p className="event-date">📅 {event.date}</p>
          <p className="event-time">🕐 {event.time}</p>
          <p className="event-location">📍 {event.location}</p>
          <p className="event-price">💰 ₹{event.price}</p>
          {event.participation_type === 'group' && event.team_size_max > 1 && (
            <p className="event-team-info">🏆 Team Event ({event.team_size_min}-{event.team_size_max} members)</p>
          )}
        </div>
        <p className="event-description">{event.description}</p>
        <div className="card-footer">
          <span className="participants-count">
            Max participants: {event.maxParticipants}
          </span>
          <button 
            className={`register-btn ${!isClickable ? 'btn-disabled' : ''}`}
            disabled={!isClickable}
          >
            {isClickable ? 'View Details' : status?.text || 'Not Available'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default Card;