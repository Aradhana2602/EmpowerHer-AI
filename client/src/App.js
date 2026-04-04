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

  // ✅ NEW: Notifications state
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (currentPage === 'streamlit' && !streamlitOpened) {
      window.open('https://ecetpgml2gtkkxarnyfuvp.streamlit.app/', '_blank');
      setStreamlitOpened(true);
      setCurrentPage('home');
    }
  }, [currentPage, streamlitOpened]);

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

      const updatedLogs = logs.filter(log => log.date !== dateStr);
      updatedLogs.push(response.data);
      setLogs(updatedLogs);

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

  // ✅ UPDATED INSIGHTS (Frontend AI-style)
  const handleGetInsights = async () => {
    try {
      setLoading(true);

      const highEnergy = logs.filter(l => l.energy >= 4).length;
      const lowEnergy = logs.filter(l => l.energy <= 2).length;

      let insightsData = [];

      if (highEnergy > lowEnergy) {
        insightsData.push("⚡ You perform best on high-energy days.");
      }

      if (lowEnergy >= 3) {
        insightsData.push("⚠️ You may be overworking — take rest.");
      }

      if (logs.length < 3) {
        insightsData.push("📊 Log more data to get better insights.");
      }

      setInsights(insightsData);
      setShowInsights(true);

    } catch (error) {
      console.error('Error generating insights:', error);
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
    } catch (error) {
      console.error('Error saving cycle info:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Notification generator
  const generateNotifications = (logs, cyclePhase) => {
    let notes = [];

    if (cyclePhase?.typicalEnergy >= 4) {
      notes.push("⚡ High energy — do your most important work now!");
    }

    if (cyclePhase?.typicalEnergy <= 2) {
      notes.push("💤 Low energy — take lighter tasks today.");
    }

    if (logs.length >= 3) {
      const last3 = logs.slice(-3);
      const burnout = last3.every(l => l.energy <= 2);

      if (burnout) {
        notes.push("⚠️ लगातार low energy — burnout risk!");
      }
    }

    return notes;
  };

  // ✅ Auto-update notifications
  useEffect(() => {
    setNotifications(generateNotifications(logs, cyclePhase));
  }, [logs, cyclePhase]);

  const isDateLogged = (date) => loggedDates.includes(date.toDateString());

  const isDatePredictedPeriod = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return predictedPeriodDays.includes(dateStr);
  };

  const getTodayLog = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return logs.find(log => log.date === dateStr);
  };

  if (showCycleSetup) {
    return (
      <div className="app-wrapper">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <CycleSetup onSubmit={handleCycleSetup} loading={loading} />
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

  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* ✅ Notifications */}
      <NotificationsPanel notifications={notifications} />

      <div className="app-container">
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

            <button
              className="insights-btn"
              onClick={handleGetInsights}
              disabled={loading || logs.length < 1}
            >
              🧠 Get AI Insights
            </button>
          </div>

          <div className="center-panel">
            {!showInsights ? (
              <LoggingForm
                onSubmit={handleLogSubmit}
                loading={loading}
                initialData={getTodayLog()}
                cyclePhase={cyclePhase}
              />
            ) : (
              <InsightsPanel
                insights={insights}
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