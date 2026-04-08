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
  const [appLoading, setAppLoading] = useState(true);

  // ---------------- INITIAL LOADER ----------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
      console.error(error);
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

  const handleLogSubmit = async (data) => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await axios.post(`${API_URL}/logs`, { date: dateStr, ...data });
      setLogs([...logs, res.data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TASK ----------------
  const getPhaseForDate = (dateToTest) => {
    if (!cycleInfo || !cycleInfo.isConfigured || !cycleInfo.lastPeriodStartDate) return null;
    const lastPeriod = new Date(cycleInfo.lastPeriodStartDate);
    lastPeriod.setHours(0, 0, 0, 0);
    const target = new Date(dateToTest);
    target.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    let diffInDays = Math.round((target - lastPeriod) / msPerDay);

    if (diffInDays < 0) {
      const cycles = Math.ceil(Math.abs(diffInDays) / cycleInfo.cycleLength);
      diffInDays += cycles * cycleInfo.cycleLength;
    }

    const dayInCycle = diffInDays % cycleInfo.cycleLength;

    if (dayInCycle < cycleInfo.periodDuration) return 'menstrual';
    if (dayInCycle < cycleInfo.periodDuration + 7) return 'follicular';
    if (dayInCycle < cycleInfo.periodDuration + 14) return 'ovulation';
    return 'luteal';
  };

  const getEnergyForPhase = (phase) => {
    switch(phase) {
      case 'menstrual': return 2;
      case 'follicular': return 4;
      case 'ovulation': return 5;
      case 'luteal': return 3;
      default: return 3;
    }
  };

  const addTask = (task) => {
    let assignedDate = new Date(selectedDate);
    
    if (cycleInfo && cycleInfo.isConfigured) {
      const today = new Date();
      let bestDate = null;
      for (let i = 0; i < 30; i++) {
        const testDate = new Date(today);
        testDate.setDate(testDate.getDate() + i);
        const phase = getPhaseForDate(testDate);
        const energy = getEnergyForPhase(phase);

        if (task.effort === 'deep' && energy >= 4) {
          bestDate = testDate;
          break;
        } else if (task.effort === 'light' && energy <= 3) {
          bestDate = testDate;
          break;
        }
      }
      if (bestDate) {
        assignedDate = bestDate;
      }
    }
    
    task.date = new Date(assignedDate.getTime() - (assignedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setTasks([...tasks, task]);
  };

  const suggestBestTime = (task) => {
    if (!task.date) return "No date assigned";
    const dateObj = new Date(task.date + 'T00:00:00');
    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (task.effort === "deep")
      return `🚀 Scheduled: ${formatted} (High Energy)`;

    return `👍 Scheduled: ${formatted} (Pacing)`;
  };

  const handleGetInsights = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/insights`);
      setInsights(res.data);
      setShowInsights(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let notes = [];
    if (cyclePhase?.typicalEnergy >= 4) notes.push("High energy");
    if (cyclePhase?.typicalEnergy <= 2) notes.push("Low energy");
    setNotifications(notes);
  }, [cyclePhase]);

  // ---------------- HELPER METHODS ----------------
  const getCycleProgress = () => {
    if (!cyclePhase || !cycleInfo) return 0;
    return (cyclePhase.dayInPhase / cycleInfo.cycleLength) * 100;
  };

  const getNextPeriodDate = () => {
    if (predictedPeriodDays && predictedPeriodDays.length > 0) return predictedPeriodDays[0];
    return null;
  };

  const getDaysLeftToPeriod = () => {
    const next = getNextPeriodDate();
    if (!next) return null;
    const diff = new Date(next).getTime() - new Date().getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const getMoodStreak = () => {
    return logs.length;
  };

  // ---------------- ROUTES ----------------
  if (appLoading) {
    return (
      <div style={{
        height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #fdf2f8, #f0fdfa)'
      }}>
        <div className="loader-avatar-container" style={{
          width: '120px', height: '120px', borderRadius: '50%', background: '#ffffff',
          boxShadow: '0 10px 25px rgba(244, 63, 94, 0.15)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
          animation: 'floatBoi 2s ease-in-out infinite'
        }}>
          <img 
            src="https://api.dicebear.com/7.x/lorelei/svg?seed=Jessica&backgroundColor=ffffff" 
            alt="Loading Assistant" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <h2 style={{ color: '#1e293b', marginTop: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>Empower Her</h2>
        <p style={{ color: '#64748b', fontWeight: 600, marginTop: '8px', animation: 'pulseText 1.5s infinite' }}>Synchronizing Biological Framework...</p>
        <style>{`
          @keyframes floatBoi { 
            0% { transform: translateY(0px) scale(1); box-shadow: 0 10px 25px rgba(244, 63, 94, 0.15); } 
            50% { transform: translateY(-15px) scale(1.02); box-shadow: 0 20px 30px rgba(244, 63, 94, 0.08); } 
            100% { transform: translateY(0px) scale(1); box-shadow: 0 10px 25px rgba(244, 63, 94, 0.15); } 
          }
          @keyframes pulseText { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `}</style>
      </div>
    );
  }

  if (showCycleSetup) {
    return <CycleSetup onSubmit={handleCycleSetupSubmit} loading={loading} />;
  }

  if (currentPage === 'meeting') {
    return (
      <div>
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="app-container">
          <header className="app-header">
            <h1>🔄 Menstrual Cycle Setup</h1>
            <p>Let's train your AI with your cycle information</p>
          </header>
          <main className="app-main" style={{ display: 'block' }}>
            <<MeetingAssistant cyclePhase={cyclePhase} logs={logs} />
          </main>
        </div>
      </div>
    );
  }

  if (currentPage === 'safety') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MeetingAssistant cyclePhase={cyclePhase} logs={logs} />
        <div className="streamlit-container">
          <iframe
            src="https://ecetpgml2gtkkxarnyfuvp.streamlit.app/"
            style={{
              width: '100%',
              height: 'calc(100vh - 70px)',
              border: 'none',
              display: 'block',
              marginTop: '40px'
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
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <SafetyPanel logs={logs} />
      </div>
    );
  }

  if (currentPage === 'copilot') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <CopilotPanel />
      </div>
    );
  }

  if (currentPage === 'resume') {
    return (
      <div>
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <ResumeEvaluator />
      </div>
    );
  }

  // ---------------- MAIN UI (Dashboard) ----------------
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="app-container">
        <NotificationsPanel notifications={notifications} />
        
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
        </header>

        <main className="app-main">
          <div className="left-panel">
            <Calendar
              selectedDate={selectedDate}
              onDateClick={setSelectedDate}
              isDateLogged={(d)=>loggedDates.includes(d.toDateString())}
              cycleInfo={cycleInfo}
              tasks={tasks}
            />

          {!showInsights ? (
            <LoggingForm onSubmit={handleLogSubmit} />
          ) : (
            <InsightsPanel 
              insights={insights} 
              cycleInfo={cycleInfo} 
              onBack={() => setShowInsights(false)} 
            />
          )}

          <TaskPlanner
            tasks={tasks}
            addTask={addTask}
            suggestBestTime={suggestBestTime}
          />

          <div className="right-panel">
            <TaskPlanner
              tasks={tasks}
              addTask={addTask}
              suggestBestTime={suggestBestTime}
            />
          </div>
          <button onClick={handleGetInsights}>Get Insights</button>

        </main>

        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default App;