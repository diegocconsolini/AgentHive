import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <header className="hero">
        <h1>Memory Manager</h1>
        <p>Your personal knowledge management system</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
        </div>
      </header>
      
      <section className="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🧠 Smart Memory</h3>
            <p>Organize and retrieve your thoughts with intelligent tagging</p>
          </div>
          <div className="feature-card">
            <h3>🔍 Powerful Search</h3>
            <p>Find exactly what you're looking for with full-text search</p>
          </div>
          <div className="feature-card">
            <h3>⚡ CLI Access</h3>
            <p>Manage memories from the command line for power users</p>
          </div>
        </div>
      </section>
    </div>
  );
};