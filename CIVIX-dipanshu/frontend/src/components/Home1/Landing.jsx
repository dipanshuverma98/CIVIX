import React from 'react';
import { useNavigate } from 'react-router-dom';
import  { useEffect } from "react";
import { FaMapMarkerAlt, FaUsers, FaClipboardCheck } from 'react-icons/fa';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (token && user) {
      navigate("/dashboard");
    }
  }, [token, user, navigate]);


  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo">CiviX</div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/login')} className="btn-secondary">Login</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Sign Up</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <h1>Making Communities Better Together</h1>
          <p>Report and track civic issues in your neighborhood - from potholes to broken streetlights</p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
            <button onClick={() => navigate('/about')} className="btn-outline">Learn More</button>
          </div>
        </section>

        <section className="features">
          <h2>Why Choose CivicTracker?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FaMapMarkerAlt className="feature-icon" />
              <h3>Easy Reporting</h3>
              <p>Report issues in your area with just a few clicks. Add photos and location details easily.</p>
            </div>
            <div className="feature-card">
              <FaUsers className="feature-icon" />
              <h3>Community Driven</h3>
              <p>Join your neighbors in making your community better. Track issues that matter to you.</p>
            </div>
            <div className="feature-card">
              <FaClipboardCheck className="feature-icon" />
              <h3>Real Results</h3>
              <p>Get updates as issues are addressed. See real progress in your neighborhood.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2 className='footer-heading'>Ready to improve your community?</h2>
          <p className="footer-heading">Join thousands of citizens making a difference in their neighborhoods.</p>
          <button onClick={() => navigate('/register')} className="btn-primary">Sign Up Now</button>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2024 CivicTracker. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;