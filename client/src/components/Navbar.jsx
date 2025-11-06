import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" data-testid="navbar-brand">
          MERN Testing App
        </Link>
        
        <div className="navbar-nav">
          <Link to="/" className="nav-link" data-testid="home-link">
            Home
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link" data-testid="dashboard-link">
                Dashboard
              </Link>
              <Link to="/create-post" className="nav-link" data-testid="create-post-link">
                Create Post
              </Link>
              <Link to="/profile" className="nav-link" data-testid="profile-link">
                Profile
              </Link>
              <div className="nav-user" data-testid="nav-user">
                <span className="user-greeting">
                  Hello, {user?.firstName || user?.username}!
                </span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline"
                  data-testid="logout-button"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" data-testid="login-link">
                Login
              </Link>
              <Link to="/register" className="nav-link" data-testid="register-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;