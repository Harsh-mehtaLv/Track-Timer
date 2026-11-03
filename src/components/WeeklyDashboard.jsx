import React, { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Play, 
  Pause,
  Flame, 
  Target, 
  Clock, 
  TrendingUp, 
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Check
} from 'lucide-react'
import { 
  formatDuration, 
  formatTimeStr, 
  formatTimerDisplay,
  getLocalDateString,
  getWeekDays, 
  getWeekRange 
} from '../utils/formatters'
import { DEFAULT_CATEGORIES, getCategoryById } from '../utils/categories'

export default function WeeklyDashboard({
  sessions = [],
  categories = DEFAULT_CATEGORIES,
  onDeleteSession,
  onOpenManualEntry,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onSaveTimerSession,
  onUpdateTimerMeta,
  user,
  activeTimer
}) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [selectedDayFilter, setSelectedDayFilter] = useState(null) // null = all days
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [quickTaskCategory, setQuickTaskCategory] = useState('frontend')
  const [quickTaskAddedFeedback, setQuickTaskAddedFeedback] = useState(false)

  const hasActiveSession = Boolean(
    activeTimer && (activeTimer.isRunning || (activeTimer.seconds || 0) > 0 || (activeTimer.title && activeTimer.title.trim()))
  )
  const activeCategory = getCategoryById(activeTimer?.category || 'frontend')

  const handleQuickAddTask = (e) => {
    if (e) e.preventDefault()
    if (!quickTaskTitle.trim()) return
    if (onUpdateTimerMeta) {
      onUpdateTimerMeta({ title: quickTaskTitle.trim(), category: quickTaskCategory })
    }
    setQuickTaskAddedFeedback(true)
    setTimeout(() => setQuickTaskAddedFeedback(false), 2500)
    setQuickTaskTitle('')
  }

  // Compute reference date for chosen week
  const referenceDate = new Date()
  referenceDate.setDate(referenceDate.getDate() + currentWeekOffset * 7)

  const { monday, sunday } = getWeekRange(referenceDate)
  const weekDays = getWeekDays(referenceDate)

  // Filter sessions that belong to this week
  const weekSessions = sessions.filter(session => {
    const sDate = new Date(session.startTime)
    return sDate >= monday && sDate <= sunday
  })

  // Calculate total seconds for the week
  const totalSeconds = weekSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)

  // Goal calculations
  const weeklyGoalHours = user?.weeklyGoalHours || 30
  const goalProgressPercent = Math.min(100, Math.round((totalSeconds / (weeklyGoalHours * 3600)) * 100))

  // Calculate daily data for the 7 bars
  const dailyStats = weekDays.map(day => {
    const daySessions = weekSessions.filter(s => {
      const sDateStr = getLocalDateString(s.startTime)
      return sDateStr === day.dateString
    })
    const daySeconds = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
    const dayHours = daySeconds / 3600

    return {
      ...day,
      sessions: daySessions,
      seconds: daySeconds,
      hours: dayHours,
      formattedDuration: formatDuration(daySeconds)
    }
  })

  // Find peak day
  const bestDay = [...dailyStats].sort((a, b) => b.seconds - a.seconds)[0]

  // Calculate daily average among active days (or all days up to today)
  const activeDaysCount = dailyStats.filter(d => d.seconds > 0).length
  const avgSeconds = activeDaysCount > 0 ? Math.round(totalSeconds / activeDaysCount) : 0

  // Category breakdown calculation
  const categoryTotals = {}
  weekSessions.forEach(s => {
    const cat = s.category || 'other'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (s.durationSeconds || 0)
  })

  const categoryBreakdown = Object.entries(categoryTotals).map(([catId, secs]) => {
    const catMeta = getCategoryById(catId)
    const percent = totalSeconds > 0 ? Math.round((secs / totalSeconds) * 100) : 0
    return {
      ...catMeta,
      seconds: secs,
      percent
    }
  }).sort((a, b) => b.seconds - a.seconds)

  // Sessions to display: if a day bar is clicked, filter to that day; otherwise show all
  const filteredSessions = selectedDayFilter
    ? weekSessions.filter(s => getLocalDateString(s.startTime) === selectedDayFilter)
    : weekSessions

  // Group displayed sessions by day (newest first)
  const groupedSessions = {}
  filteredSessions.forEach(s => {
    const dateKey = getLocalDateString(s.startTime)
    if (!groupedSessions[dateKey]) groupedSessions[dateKey] = []
    groupedSessions[dateKey].push(s)
  })
  
  // Sort sessions within each day descending
  Object.keys(groupedSessions).forEach(key => {
    groupedSessions[key].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  })

  // Sort day keys descending
  const sortedDayKeys = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a))

  // Find max daily hours to scale bar chart heights nicely
  const maxDayHours = Math.max(...dailyStats.map(d => d.hours), 6)

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Controls: Week Switcher & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-white/5 w-full">
        
        {/* Week navigation buttons */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-zinc-100 dark:bg-[#131826] border border-zinc-200 dark:border-white/10 rounded-xl p-0.5 sm:p-1 shadow-inner">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1 sm:p-1.5 rounded-lg text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold tracking-wide uppercase transition-colors ${
                currentWeekOffset === 0 
                  ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30' 
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/5'
              }`}
            >
              This Week
            </button>

            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1 sm:p-1.5 rounded-lg text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Date range title */}
          <div className="flex items-center space-x-1.5 text-zinc-800 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">
              {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right actions: Log Manual Time & Start Timer */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenManualEntry}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#141926] hover:bg-zinc-50 dark:hover:bg-[#1a2234] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-slate-200 hover:text-zinc-900 dark:hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Add Entry</span>
          </button>

          {/* Start / Running Timer Button */}
          {activeTimer?.isRunning ? (
            <button
              onClick={onStartTimer}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-orange-500/15 dark:bg-orange-500/20 hover:bg-orange-500/25 border border-orange-500/30 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all animate-pulse"
              title="Timer actively running! Click to view focus window"
            >
              <Clock className="w-3.5 h-3.5 animate-spin text-orange-600 dark:text-orange-400" style={{ animationDuration: '4s' }} />
              <span>Running: {formatTimerDisplay(activeTimer.seconds)}</span>
            </button>
          ) : activeTimer?.seconds > 0 ? (
            <button
              onClick={onStartTimer}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold transition-all"
              title="Timer is paused! Click to resume"
            >
              <Play className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
              <span>Resume ({formatTimerDisplay(activeTimer.seconds)})</span>
            </button>
          ) : (
            <button
              onClick={onStartTimer}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Timer</span>
            </button>
          )}
        </div>

      </div>

      {/* 4 Stats Cards (2 cols on mobile and tablet 1024px, 4 cols on desktop xl) */}
      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Total Hours */}
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 hover:border-orange-500/30 transition-all shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Weekly Time</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono tracking-tight truncate">
              {formatDuration(totalSeconds)}
            </span>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center text-[10px] sm:text-xs text-zinc-500 dark:text-slate-400 font-medium truncate">
            {totalSeconds > 0 ? (
              <>
                <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">+14.8%</span>
                <span className="ml-1 hidden xs:inline">vs last wk</span>
              </>
            ) : (
              <span>Ready for your first session</span>
            )}
          </div>
        </div>

        {/* Card 2: Daily Average */}
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 hover:border-cyan-500/30 transition-all shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Daily Avg</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono tracking-tight truncate">
              {formatDuration(avgSeconds)}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-slate-400">/day</span>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-zinc-500 dark:text-slate-400 truncate">
            {totalSeconds > 0 ? `${activeDaysCount} active days` : '0 active days this week'}
          </div>
        </div>

        {/* Card 3: Weekly Goal Progress */}
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 hover:border-amber-500/30 transition-all shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Goal</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1 font-mono">
              <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white">
                {totalHours}h
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-slate-400">/{weeklyGoalHours}h</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              {goalProgressPercent}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 sm:mt-3 w-full bg-zinc-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${goalProgressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Most Productive Day */}
        <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 hover:border-purple-500/30 transition-all shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Best Day</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white truncate">
              {bestDay?.seconds > 0 ? bestDay.dayName : '—'}
            </span>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold truncate">
              {bestDay?.seconds > 0 ? formatDuration(bestDay.seconds) : ''}
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-zinc-500 dark:text-slate-400 truncate">
            {bestDay?.seconds > 0 ? `${bestDay?.sessions?.length || 0} sessions done` : 'No sessions logged yet'}
          </div>
        </div>

      </div>

      {/* 7-Day Visual Activity Bar Chart */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <span>Weekly Activity</span>
              {selectedDayFilter && (
                <button
                  onClick={() => setSelectedDayFilter(null)}
                  className="text-xs font-normal text-orange-600 dark:text-orange-400 hover:underline ml-2"
                >
                  (Reset filter)
                </button>
              )}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
              Tap any column to inspect sessions for that day
            </p>
          </div>

          <div className="flex items-center space-x-3 text-[11px] sm:text-xs text-zinc-600 dark:text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
              <span>Focus</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-zinc-300 dark:bg-slate-700 border border-dashed border-zinc-400 dark:border-slate-500"></span>
              <span>Target (4h)</span>
            </div>
          </div>
        </div>

        {/* The 7 Bar Columns */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3 md:gap-4 pt-2 sm:pt-4 pb-2 border-b border-zinc-200 dark:border-white/5">
          {dailyStats.map((day) => {
            const heightPercent = maxDayHours > 0 
              ? Math.min(100, Math.round((day.hours / maxDayHours) * 100))
              : 0

            const isSelected = selectedDayFilter === day.dateString
            const hasHours = day.seconds > 0

            return (
              <div 
                key={day.dateString}
                onClick={() => setSelectedDayFilter(isSelected ? null : day.dateString)}
                className={`flex flex-col items-center cursor-pointer group p-1 sm:p-2 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-orange-500/10 ring-1 ring-orange-500/40' 
                    : 'hover:bg-zinc-100 dark:hover:bg-white/[0.03]'
                }`}
              >
                {/* Duration label above bar */}
                <span className={`text-[9px] sm:text-[11px] font-mono font-medium mb-1.5 transition-colors truncate ${
                  isSelected ? 'text-orange-600 dark:text-orange-400 font-bold' : hasHours ? 'text-zinc-700 dark:text-slate-300' : 'text-zinc-400 dark:text-slate-600'
                }`}>
                  {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '0h'}
                </span>

                {/* Vertical Bar Track */}
                <div className="w-full max-w-[34px] sm:max-w-[42px] h-32 sm:h-44 bg-zinc-100 dark:bg-[#0b0e15] rounded-xl p-0.5 sm:p-1 flex flex-col justify-end relative overflow-hidden border border-zinc-200 dark:border-white/5">
                  {/* Daily target reference line */}
                  <div 
                    className="absolute w-full left-0 border-b border-dashed border-zinc-400 dark:border-slate-600/60 pointer-events-none z-10"
                    style={{ bottom: `${Math.min(100, Math.round((4 / maxDayHours) * 100))}%` }}
                    title="4.0h Target"
                  ></div>

                  {/* Filled bar */}
                  <div
                    className={`w-full rounded-lg transition-all duration-500 relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-glow-orange'
                        : day.isToday
                        ? 'bg-gradient-to-t from-orange-500 to-amber-500'
                        : hasHours
                        ? 'bg-gradient-to-t from-zinc-400 to-zinc-500 dark:from-slate-700 dark:to-slate-500 group-hover:from-orange-500/70 group-hover:to-amber-500/70'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(heightPercent, hasHours ? 8 : 0)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>

                {/* Day name & date pill */}
                <div className="mt-2 flex flex-col items-center">
                  <span className={`text-[10px] sm:text-xs font-semibold ${
                    day.isToday ? 'text-orange-600 dark:text-orange-400 font-bold' : isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-slate-400'
                  }`}>
                    {day.dayName}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] mt-0.5 px-1 sm:px-1.5 py-0.2 rounded-full ${
                    day.isToday 
                      ? 'bg-orange-500 text-white font-bold' 
                      : 'text-zinc-400 dark:text-slate-500'
                  }`}>
                    {day.dayNumber}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Category Breakdown Progress Bar */}
        <div className="mt-6 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-zinc-700 dark:text-slate-300">Category Distribution</span>
            <span>{categoryBreakdown.length} active tags</span>
          </div>

          {/* Stacked multi-colored bar */}
          <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-slate-800/80 overflow-hidden flex">
            {categoryBreakdown.map((cat, i) => (
              <div
                key={cat.id}
                className="h-full transition-all"
                style={{ 
                  width: `${cat.percent}%`, 
                  backgroundColor: cat.color 
                }}
                title={`${cat.name}: ${cat.percent}% (${formatDuration(cat.seconds)})`}
              ></div>
            ))}
          </div>

          {/* Category badges list */}
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            {categoryBreakdown.map(cat => (
              <div 
                key={cat.id}
                className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-[#0e131d] border border-zinc-200 dark:border-white/5 text-xs text-zinc-700 dark:text-slate-300"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span className="font-medium">{cat.name}</span>
                <span className="font-mono text-zinc-500 dark:text-slate-400 font-bold">{cat.percent}%</span>
                <span className="text-zinc-400 dark:text-slate-500 text-[11px]">({formatDuration(cat.seconds)})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Session History & Logs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {selectedDayFilter 
                ? `Sessions for ${new Date(selectedDayFilter + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}` 
                : 'Week Logged Sessions'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 text-xs font-mono font-semibold border border-zinc-200 dark:border-transparent">
              {filteredSessions.length}
            </span>
          </div>

          {selectedDayFilter && (
            <button
              onClick={() => setSelectedDayFilter(null)}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold"
            >
              Show all days
            </button>
          )}
        </div>

        {/* Quick Add Task & Sync to Active Session */}
        <form 
          onSubmit={handleQuickAddTask}
          className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Add or set new task name (e.g. Next.js Routing, Leetcode 42)..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickTaskCategory}
              onChange={(e) => setQuickTaskCategory(e.target.value)}
              className="px-2.5 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
            >
              {(categories || DEFAULT_CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{quickTaskAddedFeedback ? 'Task Active ✓' : 'Add / Set Task'}</span>
            </button>
          </div>
        </form>

        {/* Live Active Focus Session Card (Shows immediately when task is added or timer is active!) */}
        {hasActiveSession && (
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-2 border-orange-500/40 dark:border-orange-500/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-orange-500/10 transition-all relative overflow-hidden group">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              {/* Left: Live pulsing dot & Task info */}
              <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                <div className="relative mt-1 sm:mt-0 flex-shrink-0">
                  <span 
                    className="w-3.5 h-3.5 rounded-full block shadow-sm"
                    style={{ backgroundColor: activeCategory.color }}
                  ></span>
                  {activeTimer?.isRunning && (
                    <span 
                      className="absolute -inset-1 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: activeCategory.color }}
                    ></span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTimer?.isRunning ? 'bg-orange-500 animate-pulse' : 'bg-zinc-400'}`}></span>
                      <span>{activeTimer?.isRunning ? 'Live In-Progress' : 'Session Active (Paused)'}</span>
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${activeCategory.bgClass}`}>
                      {activeCategory.name}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {activeTimer?.title?.trim() || 'Untitled Focus Session'}
                  </h4>
                </div>
              </div>

              {/* Right: Elapsed Duration & Action Controls */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 pl-7 sm:pl-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-slate-500 block">
                    Elapsed
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-orange-600 dark:text-orange-400">
                    {formatTimerDisplay(activeTimer?.seconds || 0)}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {activeTimer?.isRunning ? (
                    <button
                      onClick={onPauseTimer}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-white border border-zinc-200 dark:border-white/10 text-xs font-semibold transition-all shadow-sm"
                      title="Pause Timer"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={onResumeTimer}
                      className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                      title="Resume Timer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  )}

                  <button
                    onClick={onStartTimer}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-white border border-zinc-200 dark:border-white/10 text-xs font-medium transition-all"
                    title="Open Full Focus Timer"
                  >
                    <span>Focus Mode</span>
                    <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  </button>

                  {(activeTimer?.seconds || 0) >= 10 && onSaveTimerSession && (
                    <button
                      onClick={() => {
                        onSaveTimerSession({
                          title: activeTimer.title || 'Focus Session',
                          category: activeTimer.category || 'frontend',
                          durationSeconds: activeTimer.seconds,
                          mode: activeTimer.mode || 'stopwatch'
                        })
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                      title="Finish session and save to history"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Day-by-Day Sessions */}
        {sortedDayKeys.length === 0 && !hasActiveSession ? (
          <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
            <Clock className="w-12 h-12 text-zinc-400 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-zinc-800 dark:text-slate-300">No sessions recorded yet</h4>
            <p className="text-xs text-zinc-500 dark:text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Start the focus timer or manually add time to see your sessions appear here.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={onStartTimer}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                Start Timer Now
              </button>
              <button
                onClick={onOpenManualEntry}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-800 dark:text-slate-200 text-xs font-medium border border-zinc-200 dark:border-white/10 transition-all"
              >
                Log Past Session
              </button>
            </div>
          </div>
        ) : sortedDayKeys.length === 0 && hasActiveSession ? null : (
          <div className="space-y-6">
            {sortedDayKeys.map(dateKey => {
              const dayList = groupedSessions[dateKey]
              const dayTotalSecs = dayList.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
              const dateObj = new Date(dateKey + 'T00:00:00')
              const isToday = new Date().toDateString() === dateObj.toDateString()

              return (
                <div key={dateKey} className="space-y-3">
                  {/* Day Header banner */}
                  <div className="flex items-center justify-between px-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-slate-300'}`}>
                        {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-zinc-500 dark:text-slate-400 font-semibold">
                      Total: {formatDuration(dayTotalSecs)}
                    </span>
                  </div>

                  {/* Session cards for this day */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {dayList.map(session => {
                      const category = getCategoryById(session.category)
                      return (
                        <div
                          key={session.id}
                          className="bg-white hover:bg-zinc-50 dark:bg-[#111622] dark:hover:bg-[#151c2b] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group shadow-sm"
                        >
                          {/* Left: Category dot & Title */}
                          <div className="flex items-start sm:items-center space-x-3">
                            <span 
                              className="w-3 h-3 rounded-full mt-1 sm:mt-0 flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                              title={category.name}
                            ></span>

                            <div className="min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors leading-snug">
                                  {session.title || 'Untitled Session'}
                                </h4>
                                <div className="flex items-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${category.bgClass} w-fit`}>
                                    {category.name}
                                  </span>
                                </div>
                              </div>
                              {session.notes && (
                                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 line-clamp-1">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Time span, Duration badge & actions */}
                          <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 pl-6 sm:pl-0">
                            <div className="text-right text-xs">
                              <div className="text-zinc-700 dark:text-slate-300 font-medium font-mono">
                                {formatTimeStr(session.startTime)} – {formatTimeStr(session.endTime)}
                              </div>
                            </div>

                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex-shrink-0">
                              {formatDuration(session.durationSeconds)}
                            </span>

                            <button
                              onClick={() => onDeleteSession(session.id)}
                              className="p-1.5 rounded-lg text-zinc-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              title="Delete session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
