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

  // Handle Streamlit page redirect
  useEffect(() => {
    if (currentPage === 'streamlit' && !streamlitOpened) {
      window.open('https://ecetpgml2gtkkxarnyfuvp.streamlit.app/', '_blank');
      setStreamlitOpened(true);
      setCurrentPage('home');
    }
  }, [currentPage, streamlitOpened]);

  // Fetch all logs and cycle info on mount
  useEffect(() => {
    fetchAllLogs();
    fetchCycleInfo();
  }, []);

  const fetchAllLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/logs`);
      setLogs(response.data);
      const dates = response.data.map(log => new Date(log.date).toDateString());
      setLoggedDates(dates);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchCycleInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/cycle`);
      setCycleInfo(response.data);
      if (!response.data.isConfigured) {
        setShowCycleSetup(true);
      }
    } catch (error) {
      console.error('Error fetching cycle info:', error);
    }
  };

  const fetchPredictedDays = useCallback(async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const response = await axios.get(`${API_URL}/cycle/predict/${year}/${month}`);
      setPredictedPeriodDays(response.data.predictedDays || []);
    } catch (error) {
      console.error('Error fetching predicted days:', error);
    }
  }, [selectedDate]);

  const fetchCyclePhase = useCallback(async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${API_URL}/cycle/phase/${dateStr}`);
      setCyclePhase(response.data);
    } catch (error) {
      console.error('Error fetching cycle phase:', error);
    }
  }, [selectedDate]);

  // Fetch predicted period days and phase when cycle info changes or date changes
  useEffect(() => {
    if (cycleInfo?.isConfigured) {
      fetchPredictedDays();
      fetchCyclePhase();
    }
  }, [cycleInfo?.isConfigured, fetchPredictedDays, fetchCyclePhase]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowInsights(false);
  };

  const handleLogSubmit = async (logData) => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const response = await axios.post(`${API_URL}/logs`, {
        date: dateStr,
        ...logData
      });

      // Update logs
      const updatedLogs = logs.filter(log => log.date !== dateStr);
      updatedLogs.push(response.data);
      setLogs(updatedLogs);
      
      // Update logged dates
      const dateString = new Date(response.data.date).toDateString();
      if (!loggedDates.includes(dateString)) {
        setLoggedDates([...loggedDates, dateString]);
      }

      alert('Log saved successfully!');
    } catch (error) {
      console.error('Error saving log:', error);
      alert('Error saving log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetInsights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/insights`, {
        params: { limit: 100 }
      });
      setInsights(response.data);
      setShowInsights(true);
    } catch (error) {
      console.error('Error fetching insights:', error);
      alert('Error fetching insights. Make sure you have at least 3 days of logged data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCycleSetup = async (cycleData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/cycle`, cycleData);
      setCycleInfo(response.data);
      setShowCycleSetup(false);
      fetchPredictedDays();
      alert('Cycle information saved! Your period days will be automatically predicted.');
    } catch (error) {
      console.error('Error saving cycle info:', error);
      alert('Error saving cycle information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDateLogged = (date) => {
    return loggedDates.includes(date.toDateString());
  };

  const isDatePredictedPeriod = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return predictedPeriodDays.includes(dateStr);
  };

  const getTodayLog = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return logs.find(log => log.date === dateStr);
  };

  const getMoodStreak = () => {
    if (!logs.length) return 0;
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let prevDate = new Date(sorted[0].date);
    for (const log of sorted) {
      const current = new Date(log.date);
      if (streak === 0 || (prevDate - current) / (1000 * 60 * 60 * 24) === 1) {
        streak += 1;
        prevDate = current;
      } else {
        break;
      }
    }
    return streak;
  };

  const getNextPeriodDate = () => {
    if (!predictedPeriodDays.length) return null;
    const now = new Date();
    const future = predictedPeriodDays
      .map(d => new Date(d))
      .filter(d => d >= now)
      .sort((a, b) => a - b);
    return future.length ? future[0] : new Date(predictedPeriodDays[0]);
  };

  const getDaysLeftToPeriod = () => {
    const next = getNextPeriodDate();
    if (!next) return null;
    const today = new Date();
    const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const getCycleProgress = () => {
    if (!cycleInfo?.cycleLength) return 0;
    const start = new Date(cycleInfo.lastPeriodStartDate);
    const today = new Date();

    const daysSince = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const progress = ((daysSince % cycleInfo.cycleLength) / cycleInfo.cycleLength) * 100;
    return Math.max(0, Math.min(progress, 100));
  };

  if (showCycleSetup) {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
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

  // Streamlit page - with navbar
  if (currentPage === 'streamlit') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
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

  // Copilot page
  if (currentPage === 'copilot') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="app-container">
          <main className="app-main" style={{ display: 'block' }}>
            <CopilotPanel cyclePhase={cyclePhase} />
          </main>
        </div>
      </div>
    );
  }

  // Dashboard page (original)
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
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

          {cycleInfo?.isConfigured && (
            <div className="cycle-info-badge">
              🔄 Cycle Tracking Active • {cycleInfo.cycleLength}-day cycle
              <button className="edit-cycle-btn" onClick={() => setShowCycleSetup(true)}>Edit</button>
            </div>
          )}
        </header>

        <main className="app-main">
          <div className="left-panel">
            <Calendar 
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              isDateLogged={isDateLogged}
              isDatePredictedPeriod={isDatePredictedPeriod}
              loggedDates={loggedDates}
              predictedPeriodDays={predictedPeriodDays}
            />
            {cyclePhase && (
              <div className="cycle-phase-card">
                <h3>Current Phase</h3>
                <p className="phase-name">{cyclePhase.phase.charAt(0).toUpperCase() + cyclePhase.phase.slice(1)}</p>
                <p className="phase-energy">Expected Energy: {cyclePhase.typicalEnergy}/5</p>
              </div>
            )}
            <button 
              className="insights-btn"
              onClick={handleGetInsights}
              disabled={loading || logs.length < 3}
            >
              🧠 Get AI Insights ({logs.length} days logged)
            </button>
          </div>

          <div className="center-panel">
            <h2 className="date-header">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {isDateLogged(selectedDate) && <span className="logged-badge">✓ Logged</span>}
              {isDatePredictedPeriod(selectedDate) && <span className="period-badge">🩸 Predicted Period</span>}
            </h2>

            {!showInsights && (
              <LoggingForm 
                onSubmit={handleLogSubmit}
                loading={loading}
                initialData={getTodayLog()}
                cyclePhase={cyclePhase}
              />
            )}

            {showInsights && insights && (
              <InsightsPanel 
                insights={insights}
                cycleInfo={cycleInfo}
                onBack={() => setShowInsights(false)}
              />
            )}
          </div>
        </main>
        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default App;
