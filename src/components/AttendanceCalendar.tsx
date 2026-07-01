import { useState } from 'react';
import { AttendanceDetailed, AttendanceStatus } from '../types/db';
import { ChevronLeft, ChevronRight, Calendar, Info, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface AttendanceCalendarProps {
  attendance: AttendanceDetailed[];
}

export default function AttendanceCalendar({ attendance }: AttendanceCalendarProps) {
  // Current calendar month (2026 June & July)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed (6 = July, 5 = June)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  // Fill initial padding days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Fill actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Group attendance logs by date for easy lookup
  const getLogsForDay = (dayNum: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return attendance.filter(a => a.date === formattedDate);
  };

  // Status statistics for the selected month
  const monthLogs = attendance.filter(a => {
    const parts = a.date.split('-');
    if (parts.length < 2) return false;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed
    return year === currentYear && month === currentMonth;
  });

  const stats = {
    present: monthLogs.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.ONLINE_PRESENT).length,
    absent: monthLogs.filter(a => a.status === AttendanceStatus.ABSENT).length,
    tardy: monthLogs.filter(a => a.status === AttendanceStatus.LATE).length,
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-left" id="visual-attendance-calendar-dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Calendar size={15} className="text-indigo-600" />
            Visual Attendance History Calendar
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Click or hover over highlight days to inspect logged classroom periods.</p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-2 py-1 rounded-xl">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] font-bold text-slate-700 min-w-[100px] text-center font-mono uppercase">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* The 7-column calendar grid */}
        <div className="md:col-span-3 bg-white border border-slate-200/80 p-4 rounded-xl shadow-inner">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 font-mono uppercase mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
              <div key={w} className="py-1">{w}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 rounded" />;
              }

              const dayLogs = getLogsForDay(day);
              const hasPresent = dayLogs.some(l => l.status === AttendanceStatus.PRESENT || l.status === AttendanceStatus.ONLINE_PRESENT);
              const hasAbsent = dayLogs.some(l => l.status === AttendanceStatus.ABSENT);
              const hasTardy = dayLogs.some(l => l.status === AttendanceStatus.LATE);

              // Prioritize background styling for the cell
              let bgClass = 'bg-slate-50 hover:bg-slate-100 border-transparent';
              let textClass = 'text-slate-600';
              let badgeDot = null;

              if (hasAbsent) {
                bgClass = 'bg-rose-50 border-rose-200 hover:bg-rose-100/80';
                textClass = 'text-rose-800 font-bold';
                badgeDot = 'bg-rose-500';
              } else if (hasTardy) {
                bgClass = 'bg-amber-50 border-amber-200 hover:bg-amber-100/80';
                textClass = 'text-amber-800 font-bold';
                badgeDot = 'bg-amber-500';
              } else if (hasPresent) {
                bgClass = 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80';
                textClass = 'text-emerald-800 font-bold';
                badgeDot = 'bg-emerald-500';
              }

              return (
                <div 
                  key={`day-${day}`}
                  className={`aspect-square border p-1 rounded-lg flex flex-col justify-between relative group transition-all duration-150 ${bgClass}`}
                >
                  <span className={`text-[10px] font-mono ${textClass}`}>{day}</span>
                  
                  {badgeDot && (
                    <div className="flex justify-center mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                    </div>
                  )}

                  {/* Dynamic hover popover list */}
                  {dayLogs.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col bg-slate-900 text-white rounded-lg p-2.5 shadow-xl w-48 z-40 text-[10px] pointer-events-none line-clamp-3">
                      <p className="font-bold border-b border-slate-800 pb-1 mb-1 font-mono uppercase tracking-wider text-slate-400">
                        {currentMonth + 1}/{day}/{currentYear} Roll Call
                      </p>
                      {dayLogs.map((l, lIdx) => (
                        <div key={lIdx} className="flex justify-between items-center gap-1.5 mt-1">
                          <span className="truncate font-semibold text-slate-200">{l.course_name}</span>
                          <span className={`text-[9px] font-bold px-1 rounded uppercase ${
                            l.status === AttendanceStatus.PRESENT || l.status === AttendanceStatus.ONLINE_PRESENT
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : l.status === AttendanceStatus.ABSENT
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'text-amber-400 bg-amber-500/10'
                          }`}>
                            {l.status === AttendanceStatus.LATE ? 'TARDY' : l.status}
                          </span>
                        </div>
                      ))}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats breakdown side card */}
        <div className="flex flex-col gap-3 justify-center">
          <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-3.5">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Monthly Status Audit</h5>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] p-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Present Days
                </span>
                <span className="font-mono font-bold text-emerald-700">{stats.present}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] p-1.5 bg-rose-50/50 rounded-lg border border-rose-100/50">
                <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Absent Days
                </span>
                <span className="font-mono font-bold text-rose-700">{stats.absent}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] p-1.5 bg-amber-50/50 rounded-lg border border-amber-100/50">
                <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <Clock size={12} /> Tardy/Late
                </span>
                <span className="font-mono font-bold text-amber-700">{stats.tardy}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-[10px] leading-relaxed text-indigo-800">
            <div className="flex gap-1.5 items-start">
              <Info size={13} className="shrink-0 text-indigo-600" />
              <span>
                Daily presence indices automatically synchronize with course credits and report card eligibility thresholds.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
