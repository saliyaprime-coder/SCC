import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Smart Campus Companion</h1>
        <p className="hero-subtitle">
          Your all-in-one platform for managing campus life
        </p>
        <p className="hero-description">
          Track schedules, manage assignments, collaborate with peers, and optimize your academic journey with AI-powered tools.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📚</span>
            <h3>Academic Management</h3>
            <p>Track classes, attendance, and academic schedules effortlessly</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Assignment Tracker</h3>
            <p>Never miss a deadline with intelligent assignment management</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>AI Timetable Generator</h3>
            <p>Generate personalized study schedules with AI assistance</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Study Groups</h3>
            <p>Collaborate and chat with classmates in real-time</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📅</span>
            <h3>Calendar Integration</h3>
            <p>Sync with Google Calendar for seamless scheduling</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📄</span>
            <h3>Notes Sharing</h3>
            <p>Share and access study materials with OneDrive integration</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🗳️</span>
            <h3>Polls & Meetings</h3>
            <p>Schedule meetings and create polls for group decisions</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🔔</span>
            <h3>Real-time Notifications</h3>
            <p>Stay updated with instant notifications and alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
