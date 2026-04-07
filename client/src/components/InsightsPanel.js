import React from 'react';
import './InsightsPanel.css';

function InsightsPanel({ insights, cycleInfo, onBack }) {
  const getEnergyTrend = () => {
    if (insights.avgEnergyLevel >= 4) return { text: 'High Energy Trend', type: 'up' };
    if (insights.avgEnergyLevel >= 3) return { text: 'Stable Energy', type: 'stable' };
    return { text: 'Low Energy Trend', type: 'down' };
  };

  const getProductivityTrend = () => {
    if (insights.avgProductivity >= 4) return { text: 'High Productivity', type: 'up' };
    if (insights.avgProductivity >= 3) return { text: 'Moderate Productivity', type: 'stable' };
    return { text: 'Low Productivity', type: 'down' };
  };

  const energyTrend = getEnergyTrend();
  const prodTrend = getProductivityTrend();

  return (
    <div className="insights-panel">
      <div className="insights-header-nav">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Logging
        </button>
      </div>

      <div className="insights-hero-header">
        <h2 className="insights-title">AI Insights & Analytics</h2>
        <p className="insights-subtitle">Your personalized biology-driven performance dashboard.</p>
      </div>

      <div className="insights-primary-grid">
        <div className="insight-card glass-card energy">
          <div className="card-header">
            <div className="icon-circle icon-yellow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3>Energy Patterns</h3>
          </div>
          <div className="insight-stat">
            <span className="stat-value">{insights.avgEnergyLevel?.toFixed(1)}</span>
            <span className="stat-label">/ 5 Avg</span>
          </div>
          <div className={`insight-trend-badge trend-${energyTrend.type}`}>
            {energyTrend.type === 'up' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
            {energyTrend.type === 'stable' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
            {energyTrend.type === 'down' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
            <span>{energyTrend.text}</span>
          </div>
          
          {insights.bestEnergyDays && insights.bestEnergyDays.length > 0 && (
            <div className="insight-detail-elegant">
              <p className="detail-label-subtle">Recent Peak Energy</p>
              <div className="pills-container">
                {insights.bestEnergyDays.map(day => (
                  <span className="day-pill" key={day}>{day}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="insight-card glass-card productivity">
          <div className="card-header">
            <div className="icon-circle icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <h3>Productivity Insights</h3>
          </div>
          <div className="insight-stat">
            <span className="stat-value">{insights.avgProductivity?.toFixed(1)}</span>
            <span className="stat-label">/ 5 Avg</span>
          </div>
          <div className={`insight-trend-badge trend-${prodTrend.type}`}>
            {prodTrend.type === 'up' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
            {prodTrend.type === 'stable' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
            {prodTrend.type === 'down' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
            <span>{prodTrend.text}</span>
          </div>

          {insights.mostProductiveMood && (
            <div className="insight-detail-elegant">
              <p className="detail-label-subtle">Most Productive Mood</p>
              <div className="mood-pill mood-pill-highlight">
                <span className="mood-dot" style={{backgroundColor: getMoodColor(insights.mostProductiveMood)}}></span>
                {insights.mostProductiveMood}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="insights-secondary-grid">
        <div className="insight-card glass-card symptoms">
          <div className="card-header">
            <div className="icon-circle icon-pink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
            </div>
            <h3>Symptom Patterns</h3>
          </div>
          {insights.symptomFrequency && Object.keys(insights.symptomFrequency).length > 0 ? (
            <ul className="symptoms-list-elegant">
              {Object.entries(insights.symptomFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([symptom, count]) => (
                  <li key={symptom}>
                    <span className="symptom-name">{symptom}</span>
                    <span className="symptom-count">{count}x</span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-circle"></div>
              <p>Keep logging to see symptom patterns.</p>
            </div>
          )}
        </div>

        <div className="insight-card glass-card mood">
          <div className="card-header">
            <div className="icon-circle icon-purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
            </div>
            <h3>Distribution</h3>
          </div>
          {insights.moodFrequency && Object.keys(insights.moodFrequency).length > 0 ? (
            <div className="mood-distribution-elegant">
              {Object.entries(insights.moodFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([mood, count]) => (
                  <div key={mood} className="mood-bar-elegant">
                    <div className="mood-label-wrapper">
                      <span className="mood-name">{mood}</span>
                      <span className="mood-count-subtle">{count}</span>
                    </div>
                    <div className="bar-container-elegant">
                      <div 
                        className="bar-fill-fluid" 
                        style={{
                          width: `${(count / insights.totalDaysLogged) * 100}%`,
                          backgroundColor: getMoodColor(mood)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
             <div className="empty-state">
              <div className="empty-circle"></div>
              <p>Not enough mood data yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="recommendations-section glass-card full-width">
        <div className="section-header">
          <div className="icon-circle icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <h3>AI Recommendations</h3>
        </div>
        
        <div className="recommendations-grid">
          {insights.recommendations && insights.recommendations.length > 0 ? (
            insights.recommendations.map((rec, index) => {
              // Extract emoji if present at start
              const hasEmoji = /^[\u2600-\u27BF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEFF]/g.test(rec);
              const emoji = hasEmoji ? rec.match(/^[\u2600-\u27BF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEFF]/g)[0] : '💡';
              const text = hasEmoji ? rec.replace(/^[\u2600-\u27BF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEFF]/g, '').trim() : rec;

              return (
                <div key={index} className="recommendation-card-elegant">
                  <div className="rec-icon">{emoji}</div>
                  <p>{text}</p>
                </div>
              );
            })
          ) : (
            <div className="empty-state">Keep logging to get personalized recommendations!</div>
          )}
        </div>
      </div>

      {insights.careerCoaching && insights.careerCoaching.careerPhases && Object.keys(insights.careerCoaching.careerPhases).length > 0 && (
        <div className="career-coaching-section glass-card full-width">
          <div className="section-header">
             <div className="icon-circle icon-indigo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3>Career Phase Optimization</h3>
          </div>
          
          <div className="career-phases-elegant">
            {Object.entries(insights.careerCoaching.careerPhases).map(([phase, data]) => (
              <div key={phase} className={`phase-card-elegant phase-${phase}`}>
                <div className="phase-card-inner">
                  <div className="phase-header-elegant">
                    <h4 className="phase-title">{phase}</h4>
                    <div className="phase-metrics-elegant">
                      <span className="metric-pill energy-pill">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        {data.avgEnergy}
                      </span>
                      <span className="metric-pill prod-pill">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        {data.avgProductivity}
                      </span>
                    </div>
                  </div>
                  <p className="phase-description-elegant">{data.description}</p>
                  
                  <div className="activities-container">
                    <span className="activities-label">Optimal for:</span>
                    <div className="activities-tags">
                      {data.optimalActivities.map((activity, idx) => (
                        <span key={idx} className="activity-tag">{activity}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {insights.careerCoaching.optimalWorkTimes && insights.careerCoaching.optimalWorkTimes.length > 0 && (
             <div className="optimal-work-timing">
                <h4 className="sub-section-title">Schedule Highlights</h4>
                <div className="timing-cards">
                  {insights.careerCoaching.optimalWorkTimes.map((timing, index) => (
                    <div key={`timing-${index}`} className="timing-card-elegant">
                      <h5>{timing.activity}</h5>
                      <span className={`timing-phase-badge phase-${timing.phase}`}>{timing.phase}</span>
                      <p className="timing-reason-subtle">{timing.reasoning}</p>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      )}

      {cycleInfo && cycleInfo.isConfigured && (
        <div className="insights-summary-elegant">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>
           <span>Based on <strong>{insights.totalDaysLogged}</strong> days of logged data syncing with your <strong>{cycleInfo.cycleLength}-day cycle</strong>.</span>
        </div>
      )}
    </div>
  );
}

function getMoodColor(mood) {
  const colors = {
    calm: '#34d399',      // mint green
    happy: '#fbbf24',     // warm yellow
    anxious: '#fb923c',   // soft orange
    sad: '#60a5fa',       // soft blue
    angry: '#ef4444',     // red
    sleepy: '#c084fc',    // lavender
    distracted: '#f472b6',// pink
    confused: '#94a3b8',  // slate grey
    // Legacy support
    great: '#34d399',
    good: '#fde047',
    neutral: '#94a3b8',
    low: '#93c5fd',
    irritable: '#f87171'
  };
  return colors[mood.toLowerCase()] || '#cbd5e1';
}

export default InsightsPanel;
