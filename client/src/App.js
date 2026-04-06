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
      // Search the next 30 days for a phase that matches the exact energy requirement
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
    
    // Store assigned date as an ISO string component
    task.date = new Date(assignedDate.getTime() - (assignedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setTasks([...tasks, task]);
  };

  const suggestBestTime = (task) => {
    if (!task.date) return "No date assigned";
    const dateObj = new Date(task.date + 'T00:00:00');
    // adjust for local timezone visually
    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (task.effort === "deep")
      return `🚀 Scheduled: ${formatted} (High Energy)`;

    return `👍 Scheduled: ${formatted} (Pacing)`;
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

  if (currentPage === 'meeting') {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <MeetingAssistant cyclePhase={cyclePhase} logs={logs} />
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

      <NotificationsPanel notifications={notifications} />

      <div className="app-container">
        <main className="app-main">

          <div className="left-panel">
            <Calendar
              selectedDate={selectedDate}
              onDateClick={setSelectedDate}
              isDateLogged={(d)=>loggedDates.includes(d.toDateString())}
              cycleInfo={cycleInfo}
              tasks={tasks}
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