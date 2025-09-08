import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import './LandingPage.css';

const LandingPage = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithEmail, continueAsStudent } = useUser();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await loginWithEmail(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleContinueAsStudent = () => {
    continueAsStudent();
  };

  if (!showLoginForm) {
    return (
      <div className="landing-container">
        <div className="landing-content">
          <div className="club-header">
            <h1>Tech Club Events</h1>
            <p>Join exciting workshops, competitions, and meetups!</p>
          </div>

          <div className="user-type-selection">
            <div className="selection-card member-card">
              <div className="card-icon">👥</div>
              <h3>Club Member</h3>
              <p>Access member-only events, get discounts, and enjoy priority registration</p>
              <ul className="benefits-list">
                <li>🎟️ Member discounts (up to 50% off)</li>
                <li>⚡ Priority registration</li>
                <li>🎁 Exclusive member events</li>
                <li>📱 Access to member dashboard</li>
              </ul>
              <button 
                className="btn btn-primary"
                onClick={() => setShowLoginForm(true)}
              >
                Login as Member
              </button>
            </div>

            <div className="selection-card student-card">
              <div className="card-icon">🎓</div>
              <h3>Student</h3>
              <p>Join our events as a student and explore what our club has to offer</p>
              <ul className="benefits-list">
                <li>📚 Access to all public events</li>
                <li>🔍 Discover club activities</li>
                <li>🤝 Network with members</li>
                <li>💡 Learn new technologies</li>
              </ul>
              <button 
                className="btn btn-secondary"
                onClick={handleContinueAsStudent}
              >
                Continue as Student
              </button>
            </div>
          </div>

          <div className="join-club-info">
            <p>Want to become a club member? Contact our executives to join!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="login-form-container">
        <div className="login-header">
          <h2>Member Login</h2>
          <p>Welcome back to Tech Club!</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your club email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-text"
              onClick={() => setShowLoginForm(false)}
            >
              Back to Options
            </button>
          </div>

          <div className="login-help">
            <p><a href="#forgot">Forgot your password?</a></p>
            <p>Demo credentials: president@club.com / password123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;