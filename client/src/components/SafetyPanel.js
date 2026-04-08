import React, { useState, useEffect, useRef } from 'react';
import './SafetyPanel.css';

function SafetyPanel({ logs }) {
  // SOS State
  const [sosActive, setSosActive] = useState(false);
  const [triggerMethod, setTriggerMethod] = useState('');
  
  // Navigation & Route State
  const [routeInput, setRouteInput] = useState('');
  const [routeChecked, setRouteChecked] = useState(false);
  const [routeStats, setRouteStats] = useState({ crime: 'med', light: 'med', pop: 'med' });

  // Live Tracking State
  const [isTracking, setIsTracking] = useState(false);

  // Audio Detection State
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioLog, setAudioLog] = useState(['Waiting for audio signal...']);
  const recognitionRef = useRef(null);

  // Suspicious Activity & Wearable State
  const [environmentScan, setEnvironmentScan] = useState(false);
  const [wearableSynced, setWearableSynced] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const hrIntervalRef = useRef(null);

  // --- 🚨 SMART SOS --- //
  const triggerSOS = (method) => {
    setSosActive(true);
    setTriggerMethod(method);
    // Vibrate device if supported
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    alert(`🚨 SOS Activated via ${method}! Alerting trusted contacts and emergency services.`);
  };

  const cancelSOS = () => {
    setSosActive(false);
    setTriggerMethod('');
  };

  // --- 🗺️ SAFE ROUTE NAVIGATION --- //
  const checkRoute = () => {
    if (!routeInput.trim()) return;
    setRouteChecked(true);
    // Mock algorithm based on keyword
    const input = routeInput.toLowerCase();
    if (input.includes('park') || input.includes('alley')) {
      setRouteStats({ crime: 'med', light: 'low', pop: 'low' });
    } else if (input.includes('downtown') || input.includes('main')) {
      setRouteStats({ crime: 'low', light: 'high', pop: 'high' });
    } else {
      setRouteStats({ crime: 'low', light: 'med', pop: 'med' });
    }
  };

  // --- 🎧 AUDIO DETECTION --- //
  const toggleAudioDetection = () => {
    if (audioEnabled) {
      recognitionRef.current?.stop();
      setAudioEnabled(false);
      setAudioLog(['Audio monitoring disabled.']);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Audio recognition not supported in this browser. Please use Chrome/Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setAudioEnabled(true);
      setAudioLog(['Listening for distress sounds (e.g. "help", "emergency")...']);
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setAudioLog(prev => [...prev.slice(-3), `Heard: "${text}"`]);
      
      if (text.includes("help") || text.includes("emergency") || text.includes("stop")) {
        triggerSOS('Audio Detection');
        recognition.stop();
        setAudioEnabled(false);
      }
    };

    recognition.onerror = (e) => setAudioLog(prev => [...prev, `Error: ${e.error}`]);
    recognition.start();
  };

  // --- ⌚ WEARABLE INTEGRATION --- //
  const toggleWearable = () => {
    if (wearableSynced) {
      clearInterval(hrIntervalRef.current);
      setWearableSynced(false);
    } else {
      setWearableSynced(true);
      hrIntervalRef.current = setInterval(() => {
        setHeartRate(prev => {
          // slight fluctuation
          const jump = Math.floor(Math.random() * 5) - 2;
          let next = prev + jump;
          if (next < 65) next = 65;
          if (next > 180) next = 180;
          
          // Spike simulation logic if tracking + isolated route
          if (isTracking && routeStats.pop === 'low' && Math.random() > 0.95) {
            next = 135; // sudden spike
          }
          return next;
        });
      }, 2000);
    }
  };

  useEffect(() => {
    if (wearableSynced && heartRate > 130 && !sosActive) {
      triggerSOS('Wearable Spike + Auto-detect');
    }
  }, [heartRate, wearableSynced, sosActive]);

  useEffect(() => {
    return () => clearInterval(hrIntervalRef.current);
  }, []);

  return (
    <div className="safety-wrapper">
      <div className="safety-header">
        <h2>🛡️ Safety Center</h2>
        <p>AI-powered personal security network</p>
      </div>

      <div className="safety-grid">

        {/* 1. SMART SOS */}
        <div className="safety-card sos-card">
          <button 
            className="sos-main-btn" 
            onClick={() => sosActive ? cancelSOS() : triggerSOS('Tap')}
            style={sosActive ? { background: '#fecaca', color: '#dc2626', animation: 'none' } : {}}
          >
            {sosActive ? 'STOP' : <span>SOS</span>}
          </button>
          
          <div className="sos-triggers">
            <span className={`trigger-badge ${triggerMethod === 'Tap' ? 'active' : ''}`}>👆 Tap</span>
            <span className={`trigger-badge ${audioEnabled ? 'active' : ''}`}>🎤 Voice</span>
            <span className={`trigger-badge ${triggerMethod === 'Shake' ? 'active' : ''}`}>👋 Shake</span>
            <span className={`trigger-badge ${wearableSynced ? 'active' : ''}`}>⌚ Wearable</span>
          </div>
          {sosActive && <p style={{color: '#dc2626', fontWeight: 800, marginTop: '16px'}}>🚨 ACTIVE ALERT SENT</p>}
        </div>

        {/* 2. SAFE ROUTE NAVIGATION */}
        <div className="safety-card">
          <div className="card-header">
            <div className="card-icon">🗺️</div>
            <h3>Safe Route Navigation</h3>
          </div>
          <div className="route-input-group">
            <input 
              type="text" 
              placeholder="Enter destination..." 
              value={routeInput}
              onChange={(e) => setRouteInput(e.target.value)}
            />
            <button onClick={checkRoute}>Scan</button>
          </div>
          
          {routeChecked && (
            <div className="route-stats">
              <div className="stat-row">
                <span>Crime Data Index</span>
                <div className="stat-bar-container"><div className={`stat-bar ${routeStats.crime === 'low' ? 'high' : 'low'}`} style={{width: routeStats.crime === 'low' ? '90%' : '30%'}}></div></div>
              </div>
              <div className="stat-row">
                <span>Street Lighting</span>
                <div className="stat-bar-container"><div className={`stat-bar ${routeStats.light}`} style={{width: routeStats.light === 'high' ? '95%' : routeStats.light === 'low' ? '25%' : '60%'}}></div></div>
              </div>
              <div className="stat-row">
                <span>Crowd Density</span>
                <div className="stat-bar-container"><div className={`stat-bar ${routeStats.pop}`} style={{width: routeStats.pop === 'high' ? '85%' : routeStats.pop === 'low' ? '20%' : '50%'}}></div></div>
              </div>
              
              <div style={{marginTop: '10px'}}>
               {routeStats.pop === 'low' && routeStats.light === 'low' 
                  ? <div className="alert-box danger"><span className="alert-icon">⚠️</span><div className="alert-content"><h4>High Risk Route</h4><p>Route is poorly lit and isolated.</p></div></div>
                  : <div className="alert-box"><span className="alert-icon">✅</span><div className="alert-content"><h4>Safest Path Found</h4><p>This route is well lit and populated.</p></div></div>
               }
              </div>
            </div>
          )}
        </div>

        {/* 3. LIVE TRACKING */}
        <div className="safety-card">
          <div className="card-header">
            <div className="card-icon">📍</div>
            <h3>Live Tracking</h3>
          </div>
          <div className="tracking-status">
            {isTracking ? (
               <div>
                  <div className="radar-circle"><div className="radar-core"></div></div>
                  <p style={{fontWeight: 700, color: '#3b82f6', marginTop: '16px'}}>Transmitting Location</p>
                  <div className="contact-list">
                    <div className="contact-avatar">M</div>
                    <div className="contact-avatar">S</div>
                    <div className="contact-avatar">D</div>
                  </div>
                  <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '12px'}}>No unusual stops detected.</p>
               </div>
            ) : (
               <div style={{opacity: 0.5}}>
                  <div style={{fontSize: '3rem', margin: '20px 0'}}>📡</div>
                  <p>Tracking offline</p>
               </div>
            )}
          </div>
          <button 
             className={`action-btn ${isTracking ? 'btn-outline active' : 'btn-primary'}`} 
             onClick={() => setIsTracking(!isTracking)}
          >
             {isTracking ? 'Stop Sharing' : 'Start Live Sharing'}
          </button>
        </div>

        {/* 4. WEARABLE INTEGRATION & ACTIVITY */}
        <div className="safety-card">
          <div className="card-header">
            <div className="card-icon">⌚</div>
            <h3>Biometric & Environment</h3>
          </div>
          
          <div className="monitor-card">
            <div className="monitor-info">
              <h4>Apple Watch Sync</h4>
              <p>Heart rate & panic button</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={wearableSynced} onChange={toggleWearable} />
              <span className="slider"></span>
            </label>
          </div>

          {wearableSynced && (
            <div style={{textAlign: 'center', margin: '16px 0'}}>
              <div className="hr-display">
                <span className="hr-icon">❤️</span> {heartRate} <span>BPM</span>
              </div>
              <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '4px'}}>
               {heartRate > 120 ? 'Elevated Heart Rate Detected!' : 'Normal resting rate'}
              </p>
            </div>
          )}

          <div className="monitor-card" style={{marginTop: '12px'}}>
            <div className="monitor-info">
              <h4>Suspicious Activity</h4>
              <p>Proximity scanner</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={environmentScan} onChange={() => setEnvironmentScan(!environmentScan)} />
              <span className="slider"></span>
            </label>
          </div>

          {environmentScan && (
             <div className="alert-box" style={{background: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '8px', padding: '10px'}}>
               <span className="alert-icon">🛡️</span>
               <div className="alert-content">
                 <h4 style={{color: '#166534'}}>Environment Safe</h4>
                 <p style={{color: '#15803d'}}>No unusual behaviors nearby.</p>
               </div>
             </div>
          )}
        </div>

        {/* 5. AUDIO DETECTION & PREDICTIVE ALERTS */}
        <div className="safety-card">
          <div className="card-header">
            <div className="card-icon">🎧</div>
            <h3>AI Detection & Alerts</h3>
          </div>

          <div className="monitor-card">
            <div className="monitor-info">
              <h4>Predictive Alerts</h4>
              <p>Geofence warnings</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>

          <div className="monitor-card" style={{marginTop: '12px'}}>
            <div className="monitor-info">
              <h4>Audio SOS Detection</h4>
              <p>Listens for distress sounds</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={audioEnabled} onChange={toggleAudioDetection} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="ai-log">
             <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '8px'}}>
                <span>System Logs</span>
                <span className={audioEnabled ? 'success' : ''}>{audioEnabled ? '● REC' : '○'}</span>
             </div>
             {audioLog.map((log, i) => <p key={i}>{log}</p>)}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SafetyPanel;