import React, { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useUser } from '../../contexts/UserContext';
import './EventManagement.css';

const EventManagement = ({ onClose }) => {
  const { events, loading, error, toggleEventRegistrations, deleteEvent, refreshEvents } = useEvents();
  const { isExecutive } = useUser();
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Only executives can access this component
  if (!isExecutive()) {
    return (
      <div className="event-management-overlay">
        <div className="event-management-container">
          <div className="access-denied">
            <h2>❌ Access Denied</h2>
            <p>Only executives can manage events.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleRegistrations = async (eventId) => {
    try {
      console.log('Toggling registrations for event:', eventId); // Debug log
      await toggleEventRegistrations(eventId);
      alert('Registration status toggled successfully');
    } catch (error) {
      console.error('Failed to toggle registration status:', error); // Debug log
      alert('Failed to toggle registration status: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (confirmDelete === eventId) {
      try {
        console.log('Deleting event:', eventId); // Debug log
        await deleteEvent(eventId);
        alert('Event deleted successfully');
        setConfirmDelete(null);
      } catch (error) {
        console.error('Failed to delete event:', error); // Debug log
        alert('Failed to delete event: ' + error.message);
      }
    } else {
      setConfirmDelete(eventId);
    }
  };

  if (loading) {
    return (
      <div className="event-management-overlay">
        <div className="event-management-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-management-overlay">
        <div className="event-management-container">
          <div className="error-container">
            <h2>❌ Error Loading Events</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => refreshEvents()}>
              Try Again
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (event) => {
    if (event.status === 'cancelled') {
      return <span className="status-badge cancelled">🚫 Cancelled</span>;
    }
    if (event.status === 'completed') {
      return <span className="status-badge completed">✅ Completed</span>;
    }
    // Don't show registration closed badge - only show for cancelled or completed events
    return <span className="status-badge active">🟢 Active</span>;
  };

  return (
    <div className="event-management-overlay">
      <div className="event-management-container">
        <div className="event-management-header">
          <h2>🛠️ Event Management</h2>
          <div className="header-actions">
            <button className="btn btn-small btn-secondary" onClick={() => refreshEvents()}>
              🔄 Refresh
            </button>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="event-management-content">
          <div className="management-info">
            <p>Manage your club events: Change status, enable/disable registrations, or delete events.</p>
            <small>Debug: Events loaded: {events.length}</small>
          </div>

          <div className="events-list">
            {events.length === 0 ? (
              <div className="no-events">
                <p>No events available to manage.</p>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-management-card">
                  <div className="event-card-header">
                    <div className="event-title-section">
                      <h3>{event.title}</h3>
                      {getStatusBadge(event)}
                    </div>
                    <div className="event-meta">
                      <span className="event-date">📅 {event.date}</span>
                      <span className="event-time">🕒 {event.time}</span>
                    </div>
                  </div>

                  <div className="event-card-body">
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <span>📍 {event.location}</span>
                      <span>💰 {event.price}</span>
                      <span>👥 Max: {event.maxParticipants}</span>
                      {event.participation_type === 'group' && (
                        <span>🏆 Team Event ({event.team_size_min}-{event.team_size_max} members)</span>
                      )}
                    </div>
                  </div>

                  <div className="event-card-actions">
                    <div className="action-buttons">
                      <button
                        className={`btn btn-small ${event.status === 'closed' ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => handleToggleRegistrations(event.id)}
                        disabled={event.status === 'completed' || event.status === 'cancelled'}
                      >
                        {event.status === 'closed' ? '🔓 Open Registration' : '🔒 Close Registration'}
                      </button>

                      <button
                        className={`btn btn-small ${confirmDelete === event.id ? 'btn-confirm-danger' : 'btn-danger'}`}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        {confirmDelete === event.id ? '⚠️ Confirm Delete' : '🗑️ Delete'}
                      </button>

                      {confirmDelete === event.id && (
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="event-management-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
