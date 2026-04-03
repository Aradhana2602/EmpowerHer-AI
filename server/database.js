const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'logs.db');

let db = null;

function getDB() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        initializeDB();
      }
    });
  }
  return db;
}

function initializeDB() {
  const db = getDB();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      energyLevel INTEGER CHECK(energyLevel >= 1 AND energyLevel <= 5),
      productivityRating INTEGER CHECK(productivityRating >= 1 AND productivityRating <= 5),
      mood TEXT CHECK(mood IN ('calm', 'happy', 'anxious', 'sad', 'angry', 'sleepy', 'distracted', 'confused')),
      symptoms TEXT,
      notes TEXT,
      isPeriodDay INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Logs table initialized');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS cycle_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cycleLength INTEGER,
      periodDuration INTEGER,
      lastPeriodStartDate TEXT,
      isConfigured INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating cycle_info table:', err);
    } else {
      console.log('Cycle info table initialized');
    }
  });
}

module.exports = { getDB, DB_PATH };
