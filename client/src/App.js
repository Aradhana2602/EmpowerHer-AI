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
  // const [predictedPeriodDays, setPredictedPeriodDays] = useState([]);
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

  const addTask = (task) => setTasks([...tasks, task]);

  const suggestBestTime = (task) => {
    if (!cyclePhase) return "No data";
    if (task.effort === "deep" && cyclePhase.typicalEnergy >= 4) return "Do now";
    return "Later";
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

  // ---------------- ROUTES ----------------

  if (showCycleSetup) {
    return <CycleSetup onSubmit={handleCycleSetupSubmit} loading={loading} />;
  }

  if (currentPage === 'meeting') {
    return (
      <div>
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MeetingAssistant />
      </div>
    );
  }

  if (currentPage === 'safety') {
    return (
      <div>
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <SafetyPanel logs={logs} />
      </div>
    );
  }

  if (currentPage === 'copilot') {
    return (
      <div>
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

  // ---------------- MAIN UI ----------------
  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <NotificationsPanel notifications={notifications} />

      <div className="app-container">
        <main className="app-main">

          <Calendar
            selectedDate={selectedDate}
            onDateClick={setSelectedDate}
            isDateLogged={(d)=>loggedDates.includes(d.toDateString())}
            cycleInfo={cycleInfo}
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

          <button onClick={handleGetInsights}>Get Insights</button>

        </main>

        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default App;