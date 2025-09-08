import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { useRegistration } from '../../hooks/useRegistration';
import Form from '../../components/Form/Form';
import './EventDetails.css';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const { submitRegistration, isSubmitting } = useRegistration();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (events && eventId) {
      const foundEvent = events.find(e => e.id === parseInt(eventId));
      setEvent(foundEvent);
    }
  }, [events, eventId]);

  const handleRegistration = async (registrationData) => {
    const result = await submitRegistration(event.id, registrationData, event);
    
    if (result.success) {
      // Show success message and navigate back to events
      navigate('/', { 
        state: { 
          message: `Registration successful for "${event.title}"!`,
          type: 'success'
        }
      });
    } else {
      // Show error message
      alert(result.message || 'Registration failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading event details...</h2>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="error-container">
        <h2>Event not found</h2>
        <button onClick={() => navigate('/events')} className="btn-primary">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="event-details-page">
      <div className="event-details-header">
        <button onClick={() => navigate('/events')} className="back-button">
          ← Back to Events
        </button>
        <h1>{event.title}</h1>
      </div>

      <div className="event-details-content">
        <div className="event-info-section">
          {event.image_url && (
            <div className="event-poster">
              <img src={event.image_url} alt={event.title} />
            </div>
          )}
          
          <div className="event-info">
            <h2>Event Details</h2>
            <p className="event-description">{event.description}</p>
            
            <div className="event-meta">
              <div className="meta-item">
                <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="meta-item">
                <strong>Time:</strong> {event.time}
              </div>
              <div className="meta-item">
                <strong>Venue:</strong> {event.location}
              </div>
              <div className="meta-item">
                <strong>Registration Fee:</strong> ₹{event.price}
              </div>
              <div className="meta-item">
                <strong>Team Size:</strong> {event.team_size_min || event.min_team_size} - {event.team_size_max || event.max_team_size} members
              </div>
              {(event.team_size_max || event.max_team_size) > 1 && (
                <div className="meta-item team-pricing">
                  <strong>Total Team Cost:</strong> ₹{event.price} × {event.team_size_max || event.max_team_size} members = ₹{event.price * (event.team_size_max || event.max_team_size)}
                  <small>(Each member pays ₹{event.price})</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="registration-section">
          <h2>Register for this Event</h2>
          {!event.registrations_open && event.status !== 'active' ? (
            <div className="registration-closed">
              <p>Registration for this event is currently closed.</p>
            </div>
          ) : (
            <Form 
              selectedEvent={event} 
              onSubmit={handleRegistration}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
