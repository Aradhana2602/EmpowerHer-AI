import React from 'react';
import '../styles/Navbar.css';

function Navbar({ currentPage, setCurrentPage }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">🩸</span>
          <span className="logo-text">Periodically</span>
        </div>
        
        <ul className="navbar-menu">
          <li className="navbar-item">
            <button
              className={`navbar-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Dashboard
            </button>
          </li>

          <li className="navbar-item">
            <button
              className={`navbar-link ${currentPage === 'copilot' ? 'active' : ''}`}
              onClick={() => setCurrentPage('copilot')}
            >
              BioBoundary AI
            </button>
          </li>

          <li className="navbar-item">
            <button
              className={`navbar-link ${currentPage === 'resume' ? 'active' : ''}`}
              onClick={() => setCurrentPage('resume')}
            >
              Resume AI
            </button>
          </li>


          <li className="navbar-item">
            <a
              href="https://ecetpgml2gtkkxarnyfuvp.streamlit.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-link"
            >
              AI Analysis
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
