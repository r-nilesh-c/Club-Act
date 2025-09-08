import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../Cards/Card';
import { useEvents } from '../../hooks/useEvents';
import './EventsContainer.css';

const EventsContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, loading, error } = useEvents();
  const [message, setMessage] = useState(null);

  // Handle success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setMessage({
        text: location.state.message,
        type: location.state.type || 'info'
      });
      
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const handleCardClick = (event) => {
    // Check if the event is available for registration
    if (event.status !== 'active') {
      return; // Don't navigate for events that are not active
    }
    
    // Navigate to event details page
    navigate(`/event/${event.id}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <main className="main-content">
      <section className="hero-section">
        <div className="hero-header">
          <div>
            <h1>Club Events</h1>
            <p>Discover and register for exciting club events</p>
          </div>
        </div>
        
        {message && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {error && (
          <div className="demo-notice">
            <p>⚠️ {error}</p>
          </div>
        )}
      </section>
      
      <section className="events-section">
        {events.length === 0 ? (
          <div className="no-events">
            <h2>No Events Found</h2>
            <p>There are currently no events available. Please check back later!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(event => (
              <Card 
                key={event.id} 
                event={event} 
                onClick={() => handleCardClick(event)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default EventsContainer;
