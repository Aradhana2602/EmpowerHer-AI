import React, { useState } from 'react';
import axios from 'axios';
import './CopilotPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CopilotPanel({ cyclePhase }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [actionType, setActionType] = useState('Reschedule Meeting');
  const [tone, setTone] = useState('Professional and polite');

  // Hardcoded conflict for hackathon demo purposes
  const mockConflict = {
    title: 'High-Stress Client Pitch',
    time: 'Tomorrow, 10:00 AM - 11:30 AM',
    participants: 'Executive Board',
    type: 'Meeting'
  };

  const handleGenerateDraft = async () => {
    try {
      setLoading(true);
      setDraft('');
      
      const currentPhase = cyclePhase ? cyclePhase.phase : 'Luteal Phase (Low Energy Context)';

      const response = await axios.post(`${API_URL}/copilot/draft`, {
        conflictType: mockConflict.title,
        phase: currentPhase,
        actionType: actionType,
        tone: tone
      });

      setDraft(response.data.draft);
    } catch (error) {
      console.error('Error generating AI draft:', error);
      if (error.response && error.response.status === 500) {
        alert('Server Error. Ensure your OPENAI_API_KEY is configured in the backend .env file.');
      } else {
        alert('Failed to generate draft. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    alert('Copied to clipboard!');
  };

  return (
    <div className="copilot-container">
      <div className="copilot-header">
        <h2>🛡️ BioBoundary AI</h2>
        <p>Your AI assistant for protecting your energy and setting biology-aligned workplace boundaries.</p>
      </div>

      <div className="conflict-card">
        <div className="conflict-card-header">
          <h3 className="conflict-title">⚠️ Burnout Risk Detected</h3>
          <span className="conflict-badge">Calendar Clash</span>
        </div>
        <p className="conflict-description">
          You have a demanding task scheduled during a period of predicted low energy.
        </p>
        <div className="conflict-details">
          <span>📅 Event: {mockConflict.title}</span>
          <span>⌚ Time: {mockConflict.time}</span>
        </div>
      </div>

      <div className="copilot-controls">
        <div className="control-group">
          <label>How would you like to handle this?</label>
          <select 
            className="control-select" 
            value={actionType} 
            onChange={(e) => setActionType(e.target.value)}
          >
            <option value="Reschedule Meeting to next week">Reschedule to Next Week</option>
            <option value="Request to work from home (WFH)">Request Work From Home (WFH)</option>
            <option value="Delegate task to a team member">Delegate to Team</option>
            <option value="Decline meeting / Send Async Update instead">Decline & Send Async Update</option>
          </select>
        </div>

        <div className="control-group">
          <label>Tone of Voice</label>
          <select 
            className="control-select" 
            value={tone} 
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="Professional and polite">Professional & Polite</option>
            <option value="Direct and assertive">Direct & Assertive</option>
            <option value="Warm and collaborative">Warm & Collaborative</option>
          </select>
        </div>

        <button 
          className="generate-btn" 
          onClick={handleGenerateDraft}
          disabled={loading}
        >
          {loading ? '🧠 Drafting Message...' : '✨ Draft Message with AI'}
        </button>
      </div>

      {draft && (
        <div className="copilot-output">
          <div className="output-label">Generated Draft</div>
          <button className="copy-btn" onClick={copyToClipboard}>Copy</button>
          <textarea
            className="draft-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default CopilotPanel;
