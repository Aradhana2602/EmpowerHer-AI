import React, { useState } from 'react';
import axios from 'axios';
import './ResumeEvaluator.css';

const ResumeEvaluator = () => {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or DOCX file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !jobRole) {
      setError('Please select a resume file and enter a job role');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobRole', jobRole);

    try {
      const response = await axios.post('http://localhost:5000/api/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err) {
      setError('Failed to analyze resume. Please try again.');
      console.error('Resume analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderScoreCircle = (score, label) => {
    const percentage = score;
    const strokeDasharray = `${percentage}, 100`;

    return (
      <div className="score-circle">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#e0e0e0"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#4CAF50"
            strokeWidth="10"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="65" textAnchor="middle" fontSize="20" fontWeight="bold">
            {score}
          </text>
        </svg>
        <p className="score-label">{label}</p>
      </div>
    );
  };

  return (
    <div className="resume-evaluator">
      <h2>AI Resume Evaluation System</h2>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="resume">Upload Resume (PDF or DOCX):</label>
          <input
            type="file"
            id="resume"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="jobRole">Target Job Role:</label>
          <input
            type="text"
            id="jobRole"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g., Frontend Developer, Data Scientist"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="analyze-btn">
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing your resume with AI...</p>
        </div>
      )}

      {results && (
        <div className="results">
          <h3>Analysis Results</h3>

          <div className="scores-container">
            {renderScoreCircle(results.overallScore, 'Overall Score')}
            {renderScoreCircle(results.jobFitScore, 'Job Fit Score')}
          </div>

          <div className="feedback-sections">
            <div className="feedback-section">
              <h4>Strengths</h4>
              <ul>
                {results.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="feedback-section">
              <h4>Weaknesses</h4>
              <ul>
                {results.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>

            <div className="feedback-section">
              <h4>Suggestions for Improvement</h4>
              <ul>
                {results.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            <div className="feedback-section">
              <h4>Missing Keywords</h4>
              <div className="keywords">
                {results.missingKeywords.map((keyword, index) => (
                  <span key={index} className="keyword">{keyword}</span>
                ))}
              </div>
            </div>

            <div className="feedback-section">
              <h4>ATS Issues</h4>
              <ul>
                {results.atsIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEvaluator;