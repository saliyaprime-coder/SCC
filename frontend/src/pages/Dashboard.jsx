import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../features/auth/authSlice";

const Dashboard = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>SCC Dashboard</h2>
        </div>
        <div className="nav-links">
          <Link to="/groups" className="nav-link">Groups</Link>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user.name}!</h1>
          <p className="user-info">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            {user.studentId && ` • ID: ${user.studentId}`}
            {user.department && ` • ${user.department}`}
            {user.year && ` • Year ${user.year}`}
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📚 Academic Schedule</h3>
            <p>View your classes and attendance</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="dashboard-card">
            <h3>📝 Assignments</h3>
            <p>Track your deadlines and submissions</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="dashboard-card">
            <h3>🤖 AI Timetable</h3>
            <p>Generate personalized study schedules</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <Link to="/groups" className="dashboard-card link-card">
            <h3>👥 Study Groups</h3>
            <p>Collaborate with your peers</p>
            <span className="available-now">Available Now →</span>
          </Link>

          <div className="dashboard-card">
            <h3>📅 Calendar Integration</h3>
            <p>Sync with Google Calendar</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="dashboard-card">
            <h3>📄 Notes Sharing</h3>
            <p>Share and access study materials</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="dashboard-card">
            <h3>🗳️ Polls & Meetings</h3>
            <p>Schedule and participate in meetings</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="dashboard-card">
            <h3>📖 Exam Mode</h3>
            <p>AI-powered exam preparation</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.studentId && <p><strong>Student ID:</strong> {user.studentId}</p>}
            {user.department && <p><strong>Department:</strong> {user.department}</p>}
            {user.year && <p><strong>Year:</strong> {user.year}</p>}
            <p><strong>Account Status:</strong> {user.isVerified ? "✅ Verified" : "⏳ Pending"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
