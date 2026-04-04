import React, { useState, useEffect, useRef } from 'react';
import './SafetyPanel.css';

function SafetyPanel({ logs }) {
  const [location, setLocation] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [listening, setListening] = useState(false);
  const [routeInput, setRouteInput] = useState('');
  const [routeStatus, setRouteStatus] = useState('');
  const recognitionRef = useRef(null);

  // 🚨 SOS FUNCTION
  const sendSOS = () => {
    if (!navigator.geolocation) {
      alert("Location not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      setLocation(coords);
      setAlertSent(true);

      console.log("🚨 SOS SENT:", coords);

      alert("🚨 SOS sent with your location!");
    });
  };

  // 🎤 VOICE SOS
  const startVoiceSOS = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();

      if (text.includes("help") || text.includes("emergency")) {
        sendSOS();
      }
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopVoiceSOS = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // 🗺️ ROUTE SAFETY
  const analyzeRoute = () => {
    if (!routeInput.trim()) return;

    if (routeInput.toLowerCase().includes("isolated")) {
      setRouteStatus("⚠️ This route may be unsafe");
    } else {
      setRouteStatus("✅ Route looks safe");
    }
  };

  // 🧠 ACTIVITY DETECTION
  const detectActivity = () => {
    if (!logs || logs.length < 1) return "No data";

    const last = logs[logs.length - 1];

    if (last.energy <= 1) {
      return "⚠️ Unusual inactivity detected";
    }

    return "✅ Activity normal";
  };

  return (
    <div className="safety-container">
      <h2>🛡️ Safety & Security</h2>

      {/* 🚨 SOS */}
      <button className="sos-btn" onClick={sendSOS}>
        🚨 SOS
      </button>

      {alertSent && location && (
        <p className="location">
          📍 {location.lat}, {location.lng}
        </p>
      )}

      {/* 🎤 VOICE */}
      <div className="voice-box">
        {!listening ? (
          <button onClick={startVoiceSOS}>🎤 Start Voice SOS</button>
        ) : (
          <button onClick={stopVoiceSOS}>🛑 Stop</button>
        )}
      </div>

      {/* 🗺️ ROUTE */}
      <div className="route-box">
        <h3>🗺️ Route Safety</h3>
        <input
          type="text"
          placeholder="Enter destination..."
          value={routeInput}
          onChange={(e) => setRouteInput(e.target.value)}
        />
        <button onClick={analyzeRoute}>Check</button>
        {routeStatus && <p>{routeStatus}</p>}
      </div>

      {/* 🧠 ACTIVITY */}
      <div className="activity-box">
        <h3>🧠 Activity Status</h3>
        <p>{detectActivity()}</p>
      </div>
    </div>
  );
}

export default SafetyPanel;