const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getDB } = require('./database');

// Import routes
const logsRouter = require('./routes/logs');
const insightsRouter = require('./routes/insights');
const cycleRouter = require('./routes/cycle');
const notificationsRouter = require('./routes/notifications');
const copilotRouter = require('./routes/copilot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
getDB();

// Routes
app.use('/api/logs', logsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/cycle', cycleRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/copilot', copilotRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Daily Logging System Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/logs - Get all logs`);
  console.log(`   POST http://localhost:${PORT}/api/logs - Create/update a log`);
  console.log(`   GET  http://localhost:${PORT}/api/insights - Get AI insights`);
});
