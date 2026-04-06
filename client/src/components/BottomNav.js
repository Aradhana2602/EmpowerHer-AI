import React from 'react';
import './BottomNav.css';

function BottomNav({ currentPage, onPageChange }) {
  return (
    <div className="bottom-nav">
      <button className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`} onClick={() => onPageChange('home')}>
        <span>🏠</span>
        <small>Home</small>
      </button>
      <button className={`nav-btn ${currentPage === 'copilot' ? 'active' : ''}`} onClick={() => onPageChange('copilot')}>
        <span>🧠</span>
        <small>Ask Laiqa</small>
      </button>
      <button className={`nav-btn ${currentPage === 'streamlit' ? 'active' : ''}`} onClick={() => onPageChange('streamlit')}>
        <span>📈</span>
        <small>Analysis</small>
      </button>
     <button 
  className={`nav-btn ${currentPage === 'meeting' ? 'active' : ''}`}
  onClick={() => onPageChange('meeting')}
>
  <span>🎤</span>
  Meetings
</button>
<button 
  className={`nav-btn ${currentPage === 'safety' ? 'active' : ''}`}
  onClick={() => onPageChange('safety')}
>
  <span>🛡️</span>
  Safety
</button>
      <button className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => onPageChange('settings')}>
        <span>⚙️</span>
        <small>More</small>
      </button>
    </div>
  );
}

export default BottomNav;
