import React, { useState } from 'react';
import './TaskPlanner.css';

function TaskPlanner({ tasks, addTask, suggestBestTime }) {
  const [title, setTitle] = useState('');
  const [effort, setEffort] = useState('deep');

  const handleAddTask = () => {
    if (!title.trim()) return;

    const newTask = {
      title,
      effort
    };

    addTask(newTask);
    setTitle('');
  };

  return (
    <div className="task-planner">
      <h3>📅 Smart Task Planner</h3>

      {/* INPUT SECTION */}
      <div className="task-input">
        <input
          type="text"
          placeholder="Enter your task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={effort} onChange={(e) => setEffort(e.target.value)}>
          <option value="deep">Deep Work</option>
          <option value="light">Light Task</option>
        </select>

        <button onClick={handleAddTask}>Add</button>
      </div>

      {/* TASK LIST */}
      <div className="task-list">
        {tasks.length === 0 && <p>No tasks yet</p>}

        {tasks.map((task, index) => (
          <div key={index} className="task-card">
            <div className="task-header">
              <h4>{task.title}</h4>
              <span className="effort-tag">{task.effort}</span>
            </div>

            <p className="task-suggestion">
              {suggestBestTime(task)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskPlanner;