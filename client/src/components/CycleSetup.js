import React, { useState } from 'react';
import './CycleSetup.css';

function CycleSetup({ onSubmit, loading }) {
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [lastPeriodStartDate, setLastPeriodStartDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalDate = lastPeriodStartDate || defaultDateString;
    onSubmit({ cycleLength, periodDuration, lastPeriodStartDate: finalDate });
  };

  // Set default date to 30 days ago
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 30);
  const defaultDateString = defaultDate.toISOString().split('T')[0];

  return (
    <form className="cycle-setup-form" onSubmit={handleSubmit}>
      <div className="setup-info">
        <h2>🔄 Set Up Your Menstrual Cycle</h2>
        <p>This helps the AI predict your energy patterns and optimize your schedule</p>
      </div>

      <div className="form-section">
        <label className="form-label">
          📅 Last Period Start Date
        </label>
        <p className="form-hint">Select the date when your last period started</p>
        <input
          type="date"
          value={lastPeriodStartDate || defaultDateString}
          onChange={(e) => setLastPeriodStartDate(e.target.value)}
          className="date-input"
          required
        />
      </div>

      <div className="form-section">
        <label className="form-label">
          📊 Average Cycle Length: <span className="value">{cycleLength} days</span>
        </label>
        <p className="form-hint">The average number of days between periods (typically 21-35 days)</p>
        <input
          type="range"
          min="21"
          max="35"
          value={cycleLength}
          onChange={(e) => setCycleLength(parseInt(e.target.value))}
          className="slider cycle-length"
        />
        <div className="slider-labels">
          <span>21 days</span>
          <span>28 days (average)</span>
          <span>35 days</span>
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">
          🩸 Period Duration: <span className="value">{periodDuration} days</span>
        </label>
        <p className="form-hint">How many days your period typically lasts (usually 3-7 days)</p>
        <input
          type="range"
          min="3"
          max="7"
          value={periodDuration}
          onChange={(e) => setPeriodDuration(parseInt(e.target.value))}
          className="slider period-duration"
        />
        <div className="slider-labels">
          <span>3 days</span>
          <span>5 days (average)</span>
          <span>7 days</span>
        </div>
      </div>

      <div className="cycle-info-display">
        <div className="phase-info">
          <h4>Your Cycle Phases:</h4>
          <div className="phase-item menstrual">
            <span className="phase-name">Menstrual</span>
            <span className="phase-duration">{periodDuration} days</span>
          </div>
          <div className="phase-item follicular">
            <span className="phase-name">Follicular</span>
            <span className="phase-duration">~7 days</span>
          </div>
          <div className="phase-item ovulation">
            <span className="phase-name">Ovulation</span>
            <span className="phase-duration">~7 days</span>
          </div>
          <div className="phase-item luteal">
            <span className="phase-name">Luteal</span>
            <span className="phase-duration">~{cycleLength - periodDuration - 14} days</span>
          </div>
        </div>

        <div className="benefits">
          <h4>📈 Benefits of Cycle Tracking:</h4>
          <ul>
            <li>🎯 Predict high-energy and peak productivity days</li>
            <li>📊 Understand your symptoms and energy patterns</li>
            <li>💡 Get personalized recommendations for your cycle phase</li>
            <li>📅 Plan important work during optimal days</li>
          </ul>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? '⏳ Setting Up...' : '✅ Complete Setup'}
      </button>

      <p className="privacy-note">
        ✓ Your data is stored locally and never sent to external servers
      </p>
    </form>
  );
}

export default CycleSetup;
