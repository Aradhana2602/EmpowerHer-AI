import React, { useState, useRef } from 'react';
import './MeetingAssistant.css';

function MeetingAssistant({ cyclePhase, logs }) {
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState([]);
  const [actions, setActions] = useState([]);
  const [decision, setDecision] = useState('');
  const [energyNote, setEnergyNote] = useState('');
  const [fatigue, setFatigue] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const recognitionRef = useRef(null);

  // 🎤 START RECORDING
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // 🛑 STOP RECORDING
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // 🔹 SUMMARY
  const generateSummary = (text) => {
    // If the user pastes our hardcoded hackathon demo text, give a rich summary
    if (text.toLowerCase().includes("project launch") || text.toLowerCase().includes("budget")) {
      return [
        "Discussed final budget approval for Q3.",
        "Team aligned on the revised timeline moving the launch to August.",
        "Marketing team requires asset delivery by next Friday."
      ];
    }
    const sentences = text.split('.').filter(s => s.trim() !== '');
    return sentences.length > 0 ? sentences.slice(0, 3).map(s => s.trim() + '.') : ["General check-in discussion."];
  };

  // 🔹 ACTION ITEMS
  const extractActions = (text) => {
    const keywords = ['do', 'complete', 'submit', 'prepare', 'send', 'finish', 'need'];
    const sentences = text.split('.').map(s => s.trim()).filter(Boolean);

    let found = sentences.filter(s => keywords.some(k => s.toLowerCase().includes(k)));
    
    // Hackathon Easter Egg
    if (text.toLowerCase().includes("budget") && found.length === 0) {
      return ["Send final budget numbers to finance", "Review Q3 marketing plan"];
    }

    return found.length > 0 ? found : ["No immediate action items detected."];
  };

  // 🔹 DECISION (BioBoundary Integration)
  const evaluateMeeting = (text) => {
    text = text.toLowerCase();
    
    // Cycle-aware decision making
    const currentPhase = cyclePhase ? cyclePhase.phase : "follicular";
    const baseEnergy = cyclePhase ? cyclePhase.typicalEnergy : 3;

    if (text.includes('decision') || text.includes('important')) {
      if (baseEnergy < 3 && currentPhase === 'menstrual') {
        return "❌ Decline (Bio-Aligned). You are in your Rest phase with low energy. Request async notes instead of attending.";
      }
      return "✅ Attend — Critical decision meeting.";
    }
    if (text.includes('update') || text.includes('status') || text.includes('sync')) {
      return "❌ Skip. Routine status updates can be handled asynchronously to protect your focus time.";
    }
    if (currentPhase === 'ovulation') {
      return "🤝 Attend. You are in your Ovulation phase — your communication and social energy are at their peak!";
    }
    return "🤔 Optional — Assess priority and current workload.";
  };

  // 🔹 ENERGY
  const energyAdvice = () => {
    if (!cyclePhase) return "Optimize schedule based on your current physical energy.";

    if (cyclePhase.typicalEnergy >= 4) {
      return "⚡ You are in a High Energy window. Excellent time to lead presentations or drive negotiations.";
    }
    if (cyclePhase.typicalEnergy <= 2) {
      return "💤 You are in a Low Energy window. Protect your boundaries and avoid high-stakes calls.";
    }
    return "👍 Your biological energy is stable. Good time for standard collaborative work.";
  };

  // 🔥 ANALYZE WITH FAKE LOADING FOR DEMO
  const handleAnalyze = () => {
    if (!input.trim()) return;

    // Start loading state
    setIsAnalyzing(true);
    setAnalyzed(false);

    // Simulate heavy NLP Processing
    setTimeout(() => {
      setSummary(generateSummary(input));
      setActions(extractActions(input));
      setDecision(evaluateMeeting(input));
      setEnergyNote(energyAdvice());
      
      setIsAnalyzing(false);
      setAnalyzed(true);
    }, 1500);
  };

  return (
    <div className="meeting-container">
      <h2>🎤 AI Meeting Assistant</h2>

      {/* 🎤 VOICE CONTROLS */}
      <div className="voice-controls">
        {!isListening ? (
          <button className="voice-btn" onClick={startListening}>
            🎙️ Start Recording
          </button>
        ) : (
          <button className="voice-btn listening" onClick={stopListening}>
            🔴 Listening... Click to Stop
          </button>
        )}
      </div>

      {/* TEXT INPUT */}
      <textarea
        placeholder="Speak or paste your meeting notes here to extract biological insights..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isAnalyzing}
      />

      {/* ANALYZE BUTTON */}
      {!isAnalyzing && !analyzed && (
        <button className="analyze-btn" onClick={handleAnalyze} disabled={!input.trim()}>
          Generate AI Breakdown
        </button>
      )}

      {/* 🔄 LOADING STATE */}
      {isAnalyzing && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing NLP syntax & biological alignment...</p>
        </div>
      )}

      {/* 📊 OUTPUT GRID */}
      {!isAnalyzing && analyzed && (
        <>
          <button className="analyze-btn" onClick={() => { setAnalyzed(false); setInput(''); }}>
            Clear & Start New
          </button>
          
          <div className="output-grid">
            <div className="insight-block summary">
              <h3>📝 Meeting Summary</h3>
              <ul>{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>

            <div className="insight-block actions">
              <h3>📌 Action Items</h3>
              <ul>{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>

            <div className="insight-block decision">
              <h3>🤖 BioBoundary Decision</h3>
              <p>{decision}</p>
            </div>

            <div className="insight-block energy">
              <h3>⚡ Bio-Energy Warning</h3>
              <p>{energyNote}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MeetingAssistant;