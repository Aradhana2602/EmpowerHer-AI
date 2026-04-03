import React, { useState, useEffect } from 'react';
import './LoggingForm.css';

function LoggingForm({ onSubmit, loading, initialData, cyclePhase }) {
  const [formData, setFormData] = useState({
    energyLevel: 3,
    productivityRating: 3,
    mood: 'happy',
    symptoms: [],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        energyLevel: initialData.energyLevel || 3,
        productivityRating: initialData.productivityRating || 3,
        mood: initialData.mood || 'happy',
        symptoms: initialData.symptoms || [],
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const symptomsList = [
    'Everything is Fine', 
    'Cramps', 
    'Tender Breasts', 
    'Headache', 
    'Acne', 
    'Fatigue', 
    'Bloating', 
    'Cravings'
  ];

  const moodsList = [
    { label: 'Calm', emoji: '😌', id: 'calm' },
    { label: 'Happy', emoji: '😊', id: 'happy' },
    { label: 'Anxious', emoji: '😰', id: 'anxious' },
    { label: 'Sad', emoji: '😢', id: 'sad' },
    { label: 'Angry', emoji: '😠', id: 'angry' },
    { label: 'Sleepy', emoji: '😴', id: 'sleepy' },
    { label: 'Distracted', emoji: '🫠', id: 'distracted' },
    { label: 'Confused', emoji: '😵‍💫', id: 'confused' }
  ];

  const handleSymptomToggle = (symptom) => {
    if (symptom === 'Everything is Fine') {
      setFormData(prev => ({
        ...prev,
        symptoms: prev.symptoms.includes('Everything is Fine') ? [] : ['Everything is Fine']
      }));
      return;
    }

    setFormData(prev => {
      let newSymptoms = prev.symptoms.filter(s => s !== 'Everything is Fine');
      if (newSymptoms.includes(symptom)) {
        newSymptoms = newSymptoms.filter(s => s !== symptom);
      } else {
        newSymptoms.push(symptom);
      }
      return { ...prev, symptoms: newSymptoms };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      energyLevel: 3,
      productivityRating: 3,
      mood: 'happy',
      symptoms: [],
      notes: ''
    });
  };

  return (
    <form className="logging-form" onSubmit={handleSubmit}>
      {cyclePhase && (
        <div className="cycle-phase-badge">
          <span className="phase-icon">🩸</span>
          <div className="phase-details">
            <p className="phase-name">{cyclePhase.phase.charAt(0).toUpperCase() + cyclePhase.phase.slice(1)} Phase</p>
            <p className="phase-hint">Day {cyclePhase.dayOfCycle} • {getCyclePhaseDescription(cyclePhase.phase)}</p>
          </div>
        </div>
      )}

      {/* Discrete Metric Selectors */}
      <div className="metrics-group">
        <div className="metric-row">
          <label className="metric-label">Energy Level</label>
          <div className="metric-pills">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={`energy-${val}`}
                type="button"
                className={`metric-pill ${formData.energyLevel === val ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, energyLevel: val }))}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="metric-row">
          <label className="metric-label">Productivity</label>
          <div className="metric-pills">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={`prod-${val}`}
                type="button"
                className={`metric-pill ${formData.productivityRating === val ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, productivityRating: val }))}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Mood</h3>
        <div className="pill-grid">
          {moodsList.map(mood => (
            <button
              key={mood.id}
              type="button"
              className={`select-pill ${formData.mood === mood.id ? 'active-mood' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, mood: mood.id }))}
            >
              <span className="pill-emoji">{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Symptoms</h3>
        <div className="pill-grid symptoms-grid">
          {symptomsList.map(symptom => {
            const isActive = formData.symptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                className={`select-pill ${isActive ? 'active-symptom' : ''}`}
                onClick={() => handleSymptomToggle(symptom)}
              >
                {symptom}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Journal</h3>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="How was your day?"
          className="journal-input"
          rows="3"
        />
      </div>

      <button type="submit" className="save-btn" disabled={loading}>
        {loading ? 'Saving...' : 'Save day'}
      </button>
    </form>
  );
}

export default LoggingForm;

function getCyclePhaseDescription(phase) {
  const descriptions = {
    menstrual: 'Rest and self-care',
    follicular: 'Great for new projects',
    ovulation: 'Peak sociability',
    luteal: 'Reflection time'
  };
  return descriptions[phase] || '';
}
