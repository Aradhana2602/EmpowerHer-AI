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
    const sentences = text.split('.').filter(s => s.trim() !== '');
    return sentences.slice(0, 5).map(s => s.trim());
  };

  // 🔹 ACTION ITEMS
  const extractActions = (text) => {
    const keywords = ['do', 'complete', 'submit', 'prepare', 'send', 'finish'];
    const sentences = text.split('.');

    return sentences
      .filter(s => keywords.some(k => s.toLowerCase().includes(k)))
      .map(s => s.trim());
  };

  // 🔹 DECISION
  const evaluateMeeting = (text) => {
    text = text.toLowerCase();

    if (text.includes('decision') || text.includes('important')) {
      return "✅ Attend — critical meeting";
    }
    if (text.includes('update') || text.includes('status')) {
      return "❌ Skip — ask for summary";
    }
    return "🤔 Optional — depends on priority";
  };

  // 🔹 ENERGY
  const energyAdvice = () => {
    if (!cyclePhase) return "No energy data";

    if (cyclePhase.typicalEnergy >= 4) {
      return "⚡ High energy — lead meetings";
    }
    if (cyclePhase.typicalEnergy <= 2) {
      return "💤 Low energy — avoid meetings";
    }
    return "👍 Normal energy";
  };

  // 🔹 FATIGUE
  const detectFatigue = () => {
    if (!logs || logs.length < 3) return "";

    const last3 = logs.slice(-3);
    const low = last3.every(l => l.energy <= 2);

    return low
      ? "⚠️ Meeting overload — reduce calls"
      : "✅ Energy stable";
  };

  // 🔥 ANALYZE
  const handleAnalyze = () => {
    if (!input.trim()) return;

    setSummary(generateSummary(input));
    setActions(extractActions(input));
    setDecision(evaluateMeeting(input));
    setEnergyNote(energyAdvice());
    setFatigue(detectFatigue());
  };

  return (
    <div className="meeting-container">
      <h2>🎤 AI Meeting Assistant</h2>

      {/* 🎤 VOICE CONTROLS */}
      <div className="voice-controls">
        {!isListening ? (
          <button onClick={startListening}>🎙️ Start Recording</button>
        ) : (
          <button onClick={stopListening}>🛑 Stop Recording</button>
        )}
      </div>

      {/* TEXT INPUT */}
      <textarea
        placeholder="Speak or paste meeting notes..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={handleAnalyze}>Analyze Meeting</button>

      {/* OUTPUT */}
      {summary.length > 0 && (
        <>
          <div className="card">
            <h3>🧠 Summary</h3>
            <ul>{summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>

          <div className="card">
            <h3>📌 Actions</h3>
            <ul>{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>

          <div className="card">
            <h3>🤖 Decision</h3>
            <p>{decision}</p>
          </div>

          <div className="card">
            <h3>⚡ Energy</h3>
            <p>{energyNote}</p>
          </div>

          <div className="card">
            <h3>🧠 Burnout</h3>
            <p>{fatigue}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default MeetingAssistant;