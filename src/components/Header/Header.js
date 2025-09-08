import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import EventManagement from '../EventManagement/EventManagement';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    getUserDisplayName, 
    getUserType, 
    isExecutive, 
    isMember 
  } = useUser();

  const [showEventManagement, setShowEventManagement] = useState(false);

  const handleLogout = async () => {
    try {
      console.log('Logout initiated'); // Debug log
      const result = await logout();
      console.log('Logout result:', result); // Debug log
      
      if (result.success) {
        console.log('Logout successful'); // Debug log
        // User state is cleared successfully
        navigate('/'); // Redirect to root page after logout
      } else {
        console.log('Logout had issues but state cleared'); // Debug log
        // Even if logout has error, local state is still cleared
        navigate('/'); // Still redirect to root page
      }
    } catch (error) {
      console.error('Logout error:', error); // Debug log
      // Don't show error to user since logout should always "succeed" from UX perspective
      navigate('/'); // Redirect to root page even on error
    }
  };

  const handleAddEvent = () => {
    navigate('/create-event');
  };

  const handleManageEvents = () => {
    setShowEventManagement(true);
  };

  const handleCloseEventManagement = () => {
    setShowEventManagement(false);
  };

  const getUserDisplayInfo = () => {
    const userType = getUserType();
    const displayName = getUserDisplayName();
    
    if (userType === 'member') {
      return {
        greeting: `Welcome back, ${displayName}!`,
        badge: isExecutive() ? '👑 Executive' : '👥 Member',
        badgeClass: isExecutive() ? 'executive-badge' : 'member-badge'
      };
    } else {
      return {
        greeting: `Hello, ${displayName}!`,
        badge: '🎓 Student',
        badgeClass: 'student-badge'
      };
    }
  };

  const displayInfo = getUserDisplayInfo();

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/logo192.png" alt="Club Logo" className="logo-img" />
            <span className="club-name">Tech Club</span>
          </div>
          
          <nav className="nav">
            <ul className="nav-list">
              <li><a href="/events" className="nav-link">Events</a></li>
            </ul>
          </nav>

          <div className="user-info">
            <div className="user-details">
              <span className="user-greeting">{displayInfo.greeting}</span>
              <span className={`user-badge ${displayInfo.badgeClass}`}>
                {displayInfo.badge}
              </span>
            </div>
            
            {isExecutive() && (
              <>
                <button 
                  className="add-event-btn"
                  onClick={handleAddEvent}
                  title="Add New Event"
                >
                  ➕ Add Event
                </button>
                <button 
                  className="manage-events-btn"
                  onClick={handleManageEvents}
                  title="Manage Events"
                >
                  🛠️ Manage Events
                </button>
              </>
            )}
            
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
              style={{ 
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: 1000
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>
      
      {showEventManagement && (
        <EventManagement 
          onClose={handleCloseEventManagement}
        />
      )}
    </>
  );
}
export default Header;