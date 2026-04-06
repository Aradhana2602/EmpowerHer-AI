import React, { useState, useEffect } from 'react';
import './NotificationsPanel.css';

function NotificationsPanel({ notifications = [] }) {
  const [unread, setUnread] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  // Update unread count whenever notifications change
  useEffect(() => {
    setUnread(notifications.length);
    setReadNotifications(new Array(notifications.length).fill(false));
  }, [notifications]);

  const handleNotificationClick = (index) => {
    if (!readNotifications[index]) {
      const newRead = [...readNotifications];
      newRead[index] = true;
      setReadNotifications(newRead);
      setUnread(prev => Math.max(0, prev - 1));
    }
  };

  const handleClearAll = () => {
    setReadNotifications(new Array(notifications.length).fill(true));
    setUnread(0);
  };

  return (
    <div className="notifications-widget">
      <button 
        className="notification-bell"
        onClick={() => setShowPanel(!showPanel)}
      >
        🔔
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>

      {showPanel && (
        <div className="notifications-panel">
          <div className="panel-header">
            <h3>🎯 Smart Notifications</h3>
            {unread > 0 && (
              <button className="clear-btn" onClick={handleClearAll}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="no-notifications">
              No insights yet. Start logging your day!
            </p>
          )}

          <div className="notifications-list">
            {notifications.map((note, index) => (
              <div
                key={index}
                className={`notification-card ${
                  readNotifications[index] ? 'read' : 'unread'
                }`}
                onClick={() => handleNotificationClick(index)}
              >
                <div className="notification-emoji">✨</div>

                <div className="notification-content">
                  <h4 className="notification-title">AI Insight</h4>
                  <p className="notification-message">{note}</p>

                  {/* Optional suggestions based on message */}
                  {note.includes("High energy") && (
                    <div className="notification-suggestions">
                      <p className="suggestions-label">💡 Try this:</p>
                      <ul>
                        <li>Work on your hardest task</li>
                        <li>Do deep focus work</li>
                      </ul>
                    </div>
                  )}

                  {note.includes("Low energy") && (
                    <div className="notification-suggestions">
                      <p className="suggestions-label">💡 Try this:</p>
                      <ul>
                        <li>Take breaks</li>
                        <li>Do lighter tasks</li>
                      </ul>
                    </div>
                  )}
                </div>

                {!readNotifications[index] && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))}
          </div>

          <div className="panel-footer">
            <button 
              className="refresh-btn"
              onClick={() => setShowPanel(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPanel;