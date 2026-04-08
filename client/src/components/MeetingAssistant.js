import React, { useState, useRef, useEffect } from 'react';
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
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);
  const chunksRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // 🎤 START RECORDING
  const startListening = async () => {
    // 1. Reset old states
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl(null);
    chunksRef.current = [];
    setInput('');
    setAnalyzed(false);

    // 2. Request Screen Sharing
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // Sometimes audio is restricted depending on the browser, but we request it
        audio: true
      });
      videoStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Listen for user terminating screen share directly from browser OS UI
      stream.getVideoTracks()[0].onended = () => {
        stopListening();
      };

    } catch (err) {
      console.error("Screen recording access denied or not supported.", err);
      // We can still fallback to only transcript if screen share fails or is canceled.
      alert("Screen sharing canceled or failed. You can still use the transcript AI.");
    }

    // 3. Start Speech recognition for AI transcription parallel
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
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
    } else {
      setIsListening(true); // Indicate recording if Speech API missing
    }
  };

  // 🛑 STOP RECORDING
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }

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
            🎙️ Share Screen & Record
          </button>
        ) : (
          <button className="voice-btn listening" onClick={stopListening}>
            🔴 Recording... Click to Stop
          </button>
        )}
      </div>

      {/* 🔴 RECORDED VIDEO PREVIEW */}
      {recordedVideoUrl && !isListening && (
        <div className="video-playback-container" style={{ margin: '15px 0', padding: '15px', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1rem', color: '#1e293b' }}>📹 Meeting Recording</h3>
          <video src={recordedVideoUrl} controls style={{ width: '100%', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
        </div>
      )}

      {/* TEXT INPUT */}
      <textarea
        placeholder="Transcript will appear here, or you can paste notes natively..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isAnalyzing}
      />

      {/* ANALYZE BUTTON */}
      {!isAnalyzing && !analyzed && (
        <button className="analyze-btn" onClick={handleAnalyze} disabled={!input.trim() && !recordedVideoUrl}>
          Generate AI Breakdown
        </button>
      )}

      {/* 🔄 LOADING STATE */}
      {isAnalyzing && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing context & biological alignment...</p>
        </div>
      )}

      {/* 📊 OUTPUT GRID */}
      {!isAnalyzing && analyzed && (
        <>
          <button className="analyze-btn" onClick={() => { setAnalyzed(false); setInput(''); setRecordedVideoUrl(null); }}>
            Clear Transcription
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