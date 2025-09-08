import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useEvents } from '../../hooks/useEvents';
import './AddEvent.css';

const AddEvent = ({ onClose, onEventAdded }) => {
  const { isExecutive } = useUser();
  const { addCustomEvent } = useEvents();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    price: '',
    max_participants: '',
    participation_type: 'individual', // 'individual' or 'group'
    min_team_size: '',
    max_team_size: '',
    category: 'workshop', // workshop, competition, meetup, seminar
    tags: '',
    image_url: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only executives can access this component
  if (!isExecutive()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Only executives can create events.</p>
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.time.trim()) newErrors.time = 'Event time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    if (!formData.max_participants || formData.max_participants <= 0) {
      newErrors.max_participants = 'Maximum participants must be greater than 0';
    }

    // Validate group participation specific fields
    if (formData.participation_type === 'group') {
      if (!formData.min_team_size || formData.min_team_size <= 0) {
        newErrors.min_team_size = 'Minimum team size is required for group events';
      }
      if (!formData.max_team_size || formData.max_team_size <= 0) {
        newErrors.max_team_size = 'Maximum team size is required for group events';
      }
      if (formData.min_team_size && formData.max_team_size && 
          parseInt(formData.min_team_size) > parseInt(formData.max_team_size)) {
        newErrors.max_team_size = 'Maximum team size cannot be less than minimum team size';
      }
    }

    // Validate date is in the future
    const eventDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      newErrors.date = 'Event date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Process form data - only send the fields we need
      const eventData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        price: formData.price,
        max_participants: formData.max_participants,
        participation_type: formData.participation_type,
        min_team_size: formData.min_team_size,
        max_team_size: formData.max_team_size,
        category: formData.category,
        image_url: formData.image_url
      };
      
      // Use the addCustomEvent function from the hook
      const newEvent = await addCustomEvent(eventData);

      // Call parent callback
      if (onEventAdded) {
        onEventAdded(newEvent);
      }

      alert('Event created successfully!');
      onClose();

    } catch (error) {
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-event-overlay">
      <div className="add-event-container">
        <div className="add-event-header">
          <h2>Create New Event</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="add-event-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Event Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="workshop">Workshop</option>
                  <option value="competition">Competition</option>
                  <option value="meetup">Meetup</option>
                  <option value="seminar">Seminar</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="networking">Networking</option>
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Event Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-message">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="time">Event Time *</label>
                <input
                  type="text"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="e.g., 2:00 PM - 5:00 PM"
                  className={errors.time ? 'error' : ''}
                />
                {errors.time && <span className="error-message">{errors.time}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter event location"
                  className={errors.location ? 'error' : ''}
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., $25 or Free"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows="4"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Participation Details</h3>
            
            <div className="form-group">
              <label htmlFor="participation_type">Participation Type *</label>
              <select
                id="participation_type"
                name="participation_type"
                value={formData.participation_type}
                onChange={handleChange}
                className={errors.participation_type ? 'error' : ''}
              >
                <option value="individual">Individual Participation</option>
                <option value="group">Group/Team Participation</option>
              </select>
              {errors.participation_type && <span className="error-message">{errors.participation_type}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max_participants">
                  {formData.participation_type === 'group' ? 'Maximum Teams' : 'Maximum Participants'} *
                </label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  placeholder="Enter maximum number"
                  className={errors.max_participants ? 'error' : ''}
                />
                {errors.max_participants && <span className="error-message">{errors.max_participants}</span>}
              </div>

              {formData.participation_type === 'group' && (
                <>
                  <div className="form-group">
                    <label htmlFor="min_team_size">Minimum Team Size *</label>
                    <input
                      type="number"
                      id="min_team_size"
                      name="min_team_size"
                      value={formData.min_team_size}
                      onChange={handleChange}
                      min="1"
                      placeholder="Minimum members per team"
                      className={errors.min_team_size ? 'error' : ''}
                    />
                    {errors.min_team_size && <span className="error-message">{errors.min_team_size}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_team_size">Maximum Team Size *</label>
                    <input
                      type="number"
                      id="max_team_size"
                      name="max_team_size"
                      value={formData.max_team_size}
                      onChange={handleChange}
                      min="1"
                      placeholder="Maximum members per team"
                      className={errors.max_team_size ? 'error' : ''}
                    />
                    {errors.max_team_size && <span className="error-message">{errors.max_team_size}</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., coding, beginner, networking (comma separated)"
                />
                <small className="form-hint">Separate multiple tags with commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="image_url">Image URL</label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvent;
