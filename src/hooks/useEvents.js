import { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '../lib/database';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await eventsAPI.getAllEvents();
      
      if (!data || data.length === 0) {
        setEvents([]);
        setError(null); // No error, just empty state
        return;
      }

      setEvents(transformEvents(data));
    } catch (err) {
      setEvents([]);
      setError(`Database error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const transformEvents = (data) => {
    return data.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.includes('-') 
        ? new Date(event.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      image: event.image_url || "/logo192.png",
      price: event.price,
      maxParticipants: event.max_participants,
      participation_type: event.participation_type || 'individual',
      team_size_min: event.team_size_min || null,
      team_size_max: event.team_size_max || null,
      status: event.status || 'active'
    }));
  };

  const addCustomEvent = async (eventData) => {
    try {
      // Start with minimal required fields only
      const cleanEventData = {
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        description: eventData.description,
        price: eventData.price,
        max_participants: parseInt(eventData.max_participants) || 50
      };
      
      console.log('Sending minimal event data:', cleanEventData); // Temporary debug log
      
      const result = await eventsAPI.createEvent(cleanEventData);
      
      // Refresh the events list
      loadEvents();
      
      return result;
    } catch (err) {
      console.error('addCustomEvent error:', err); // Temporary debug log
      throw err;
    }
  };

  const toggleEventRegistrations = async (eventId) => {
    try {
      // Get current event to determine new registration state
      const currentEvent = events.find(event => event.id === eventId);
      if (!currentEvent) {
        throw new Error('Event not found');
      }
      
      // Toggle between 'active' and 'closed'
      const newStatus = currentEvent.status === 'closed' ? 'active' : 'closed';
      await eventsAPI.updateEvent(eventId, { status: newStatus });
      
      // Refresh the events list
      loadEvents();
      
      return true;
    } catch (err) {
      throw err;
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await eventsAPI.deleteEvent(eventId);
      
      // Refresh the events list
      loadEvents();
      
      return true;
    } catch (err) {
      throw err;
    }
  };

  const refreshEvents = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents,
    addCustomEvent,
    toggleEventRegistrations,
    deleteEvent
  };
};
