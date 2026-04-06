import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Calendar from './components/Calendar';
import LoggingForm from './components/LoggingForm';
import InsightsPanel from './components/InsightsPanel';
import CycleSetup from './components/CycleSetup';
import NotificationsPanel from './components/NotificationsPanel';
import Navbar from './components/Navbar';
import CopilotPanel from './components/CopilotPanel';
import BottomNav from './components/BottomNav';
import TaskPlanner from './components/TaskPlanner';
import MeetingAssistant from './components/MeetingAssistant';
import SafetyPanel from './components/SafetyPanel';
import ResumeEvaluator from './components/ResumeEvaluator';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [loggedDates, setLoggedDates] = useState([]);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [predictedPeriodDays, setPredictedPeriodDays] = useState([]);
  const [cyclePhase, setCyclePhase] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [streamlitOpened, setStreamlitOpened] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ---------------- STREAMLIT ----------------
  useEffect(() => {
    if (currentPage === 'streamlit' && !streamlitOpened) {
      window.open('https://ecetpgml2gtkkxarnyfuvp.streamlit.app/', '_blank');
      setStreamlitOpened(true);
      setCurrentPage('home');
    }
  }, [currentPage, streamlitOpened]);

  // ---------------- FETCH ----------------
  useEffect(() => {
    fetchAllLogs();
    fetchCycleInfo();
  }, []);

  const fetchAllLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
      setLoggedDates(res.data.map(l => new Date(l.date).toDateString()));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCycleInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/cycle`);
      setCycleInfo(res.data);
      if (!res.data.isConfigured) setShowCycleSetup(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCycleSetupSubmit = async (data) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/cycle`, data);
      await fetchCycleInfo();
      setShowCycleSetup(false);
    } catch (error) {
      console.error('Error saving cycle info:', error);
      if (error.code === 'ERR_NETWORK') {
        alert('Server connection failed. Ensure your backend server is running on port 5000!');
      } else {
        alert('Failed to save cycle setup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictedDays = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/cycle/predict/${selectedDate.getFullYear()}/${selectedDate.getMonth()+1}`
      );
      setPredictedPeriodDays(res.data.predictedDays || []);
    } catch (e) {}
  }, [selectedDate]);

  const fetchCyclePhase = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/cycle/phase/${selectedDate.toISOString().split('T')[0]}`
      );
      setCyclePhase(res.data);
    } catch (e) {}
  }, [selectedDate]);

  useEffect(() => {
    if (cycleInfo?.isConfigured) {
      fetchPredictedDays();
      fetchCyclePhase();
    }
  }, [cycleInfo, fetchPredictedDays, fetchCyclePhase]);
  

  // ---------------- LOGGING ----------------
  const handleLogSubmit = async (data) => {
    try {
      setLoading(true);
      const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const res = await axios.post(`${API_URL}/logs`, { date: dateStr, ...data });

      const updated = logs.filter(l => l.date !== dateStr);
      updated.push(res.data);
      setLogs(updated);

      if (!loggedDates.includes(selectedDate.toDateString())) {
        setLoggedDates([...loggedDates, selectedDate.toDateString()]);
      }
      alert('Day logged successfully!');
    } catch (e) {
      console.error('Failed to log day:', e);
      alert('Failed to save log. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TASK ----------------
  const addTask = (task) => setTasks([...tasks, task]);

  const suggestBestTime = (task) => {
    if (!cyclePhase) return "No data yet";

    if (task.effort === "deep" && cyclePhase.typicalEnergy >= 4)
      return "🚀 Do now";

    if (task.effort === "light")
      return "👍 Good time";

    return "⏳ Later";
  };

  // ---------------- INSIGHTS ----------------
  const handleGetInsights = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/insights`);
      setInsights(res.data);
      setShowInsights(true);
    } catch (e) {
      if (e.response && e.response.status === 400) {
        alert(e.response.data.error || "Need more data for insights.");
      } else {
        console.error(e);
        alert('Failed to load AI Insights.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- NOTIFICATIONS ----------------
  useEffect(() => {
    let notes = [];

    if (cyclePhase?.typicalEnergy >= 4)
      notes.push("⚡ High energy — do important work");

    if (cyclePhase?.typicalEnergy <= 2)
      notes.push("💤 Low energy — rest");

    setNotifications(notes);
  }, [logs, cyclePhase]);

  // ---------------- ROUTES ----------------
  if (showCycleSetup) {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="app-container">
          <header className="app-header">
            <h1>🔄 Menstrual Cycle Setup</h1>
            <p>Let's train your AI with your cycle information</p>
          </header>
          <main className="app-main">
            <CycleSetup onSubmit={handleCycleSetup} loading={loading} />
          </main>
        </div>
      </div>
    );
  }

  if (currentPage === 'meeting') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <MeetingAssistant cyclePhase={cyclePhase} logs={logs} />
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="streamlit-container">
          <iframe
            src="https://ecetpgml2gtkkxarnyfuvp.streamlit.app/"
            style={{
              width: '100%',
              height: 'calc(100vh - 70px)',
              border: 'none',
              display: 'block'
            }}
            title="AI Analysis"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          />
        </div>
      </div>
    );
  }
 if (currentPage === 'safety') {
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <SafetyPanel logs={logs} />
    </div>
  );
}
  if (currentPage === 'copilot') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <CopilotPanel cyclePhase={cyclePhase} />
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="app-container">
          <main className="app-main" style={{ display: 'block' }}>
            <CopilotPanel cyclePhase={cyclePhase} />
          </main>
        </div>
      </div>
    );
  }

  if (showCycleSetup) {
    return <CycleSetup onSubmit={handleCycleSetupSubmit} loading={loading} />;
  }

  // ---------------- MAIN UI ----------------
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
  // Resume Evaluation page
  if (currentPage === 'resume') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="app-container">
          <main className="app-main" style={{ display: 'block' }}>
            <ResumeEvaluator />
          </main>
        </div>
      </div>
    );
  }

  // Dashboard page (original)
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="app-container">
        <NotificationsPanel />
        
        <header className="app-header">
          <div className="hero-card">
            <div className="hero-card-top">
              <div>
                <p className="hero-title">Keep Track of your Periods</p>
                <h1>Hey, {cycleInfo?.userName || 'User'}</h1>
                <p className="hero-subtitle">Your personal cycle+workflow dashboard</p>
              </div>
              <div className="ring-widget">
                <div className="ring-outer" style={{ background: `conic-gradient(#f43f5e 0 ${getCycleProgress()}%, #fca5a5 ${getCycleProgress()}% 100%)` }}>
                  <div className="ring-inner">
                    <span className="ring-day">{cyclePhase ? `Day ${cyclePhase.dayInPhase + 1}` : 'Day 1'}</span>
                    <span className="ring-phase">{cyclePhase ? `${cyclePhase.phase.charAt(0).toUpperCase() + cyclePhase.phase.slice(1)}` : 'Menstrual'}</span>
                  </div>
                </div>
                <p className="ring-note">Ovulation window in {cyclePhase ? `${Math.max(0, 14 - cyclePhase.dayInPhase)} days` : '9 days'}</p>
                <p className="ring-progress">Cycle progress: {getCycleProgress().toFixed(0)}%</p>
              </div>
            </div>

            <div className="hero-secondary">
              <button className="hero-btn phase-pill">Period</button>
              <button className="hero-btn phase-pill">Pre-ovulation</button>
              <button className="hero-btn phase-pill">Ovulation</button>
              <button className="hero-btn phase-pill">Luteal</button>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <h4>Next period</h4>
              <p>{getNextPeriodDate() ? new Date(getNextPeriodDate()).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <div className="stat-card">
              <h4>Days left</h4>
              <p>{getDaysLeftToPeriod() ?? '--'}</p>
            </div>
            <div className="stat-card">
              <h4>Mood streak</h4>
              <p>{getMoodStreak()} days</p>
            </div>
          </div>

      <NotificationsPanel notifications={notifications} />

      <div className="app-container">
        <main className="app-main">

          <div className="left-panel">
            <Calendar
              selectedDate={selectedDate}
              onDateClick={setSelectedDate}
              isDateLogged={(d)=>loggedDates.includes(d.toDateString())}
              cycleInfo={cycleInfo}
            />

            <button className="insights-btn" onClick={handleGetInsights}>
              🧠 Insights
            </button>
            <button className="insights-btn" style={{ marginTop: '15px', background: '#fdf2f8', border: '2px solid #fbcfe8' }} onClick={() => setShowCycleSetup(true)}>
              ⚙️ Edit Cycle Setup
            </button>
          </div>

          <div className="center-panel">
            {!showInsights ? (
              <LoggingForm onSubmit={handleLogSubmit} />
            ) : (
              <InsightsPanel 
                insights={insights} 
                cycleInfo={cycleInfo} 
                onBack={() => setShowInsights(false)} 
              />
            )}
          </div>

          {/* ✅ TASK PLANNER FIXED POSITION */}
          <div className="right-panel">
            <TaskPlanner
              tasks={tasks}
              addTask={addTask}
              suggestBestTime={suggestBestTime}
            />
          </div>

        </main>

        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default App;