import React, { useState } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import './Calendar.css';

function Calendar({ selectedDate, onDateClick, isDateLogged, cycleInfo, tasks }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getPhase = (day) => {
    if (!cycleInfo || !cycleInfo.isConfigured || !cycleInfo.lastPeriodStartDate) return null;
    const lastPeriod = new Date(cycleInfo.lastPeriodStartDate);
    lastPeriod.setHours(0, 0, 0, 0);
    const target = new Date(day);
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="month-nav-btn">←</button>
        <h2>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={handleNextMonth} className="month-nav-btn">→</button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isLogged = isDateLogged(day);
              const phase = getPhase(day);
              const phaseClass = phase ? `phase-${phase}` : '';
              
              // Find tasks for this day
              const dayStr = new Date(day.getTime() - (day.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              const dayTasks = tasks?.filter(t => t.date === dayStr) || [];

              return (
                <button
                  key={dayIndex}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isLogged ? 'logged' : ''} ${phaseClass}`}
                  onClick={() => onDateClick(day)}
                >
                  <span className="day-number">{day.getDate()}</span>
                  {isLogged && <span className="logged-dot"></span>}
                  
                  {dayTasks.length > 0 && (
                    <div className="task-indicators">
                      {dayTasks.map((t, idx) => (
                        <span key={idx} className={`task-dot ${t.effort}`} title={t.title}></span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot logged"></span>
          <span>Logged</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot phase-menstrual-legend"></span>
          <span>Period</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot phase-follicular-legend"></span>
          <span>Follicular</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot phase-ovulation-legend"></span>
          <span>Ovulation</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot phase-luteal-legend"></span>
          <span>Luteal</span>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
