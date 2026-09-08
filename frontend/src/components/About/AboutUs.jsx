import React from "react";
import "./AboutUs.css";
import { useNavigate } from "react-router-dom";
const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <div className="about-container">
      <header className="about-hero">
        <h1>About CivicTracker</h1>
        <p>
          Empowering citizens to take charge of their communities, one issue at
          a time.
        </p>
      </header>

      <section className="about-section mission">
        <h2>Our Mission</h2>
        <p>
          CivicTracker was created to bridge the gap between citizens and civic
          authorities. We believe that reporting a pothole, a broken
          streetlight, or a sanitation issue should be simple. Our
          platform enables users to not just report problems, but also track
          their progress and see changes happen.
        </p>
      </section>

      <section className="about-section values">
        <h2>What We Stand For</h2>
        <ul>
          <li>
            <strong>Transparency:</strong> Everyone should be able to see what's
            being fixed and what's not.
          </li>
          <li>
            <strong>Community:</strong> Civic issues impact us all. Working
            together makes us stronger.
          </li>
          <li>
            <strong>Action:</strong> Reporting should lead to resolution, not
            just a dead end.
          </li>
        </ul>
      </section>

      <section className="about-section team">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <img src="/abc.webp" alt="Team member 1" />
            <h4>Aditya Pawar</h4>
          </div>
          <div className="team-member">
            <img src="/abc.webp" alt="Team member 2" />
            <h4>Divyam Gupta</h4>
          </div>
          <div className="team-member">
            <img src="/abc.webp" alt="Team member 3" />
            <h4>Amit Kumar</h4>
          </div>
        </div>
      </section>

      <section className="about-section cta">
        <h2>Want to Make a Difference?</h2>
        <p className="para">Join thousands of people making their communities better.</p>
        <button onClick={() => navigate("/register")} className="btn-primary">
          Join Us
        </button>
      </section>

      <footer className="about-footer">
        <p>© 2024 CivicTracker.</p>
      </footer>
    </div>
  );
};

export default AboutUs;
