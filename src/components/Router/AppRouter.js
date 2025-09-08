import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import EventsContainer from '../Events/EventsContainer';
import LandingPage from '../Landing/LandingPage';
import EventDetails from '../../pages/EventDetails/EventDetails';
import CreateEvent from '../../pages/CreateEvent/CreateEvent';
import { useUser } from '../../contexts/UserContext';

const AppRouter = () => {
  const { loading, isAuthenticated } = useUser();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Redirect any other routes to landing page for unauthenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // If user is authenticated or is a student, show main app with layout
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsContainer />} />
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/create-event" element={<CreateEvent />} />
          {/* Add more routes here as needed */}
          {/* <Route path="/about" element={<About />} /> */}
          {/* <Route path="/contact" element={<Contact />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;
