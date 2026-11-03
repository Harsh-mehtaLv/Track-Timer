import React, { useState, useMemo } from 'react'
import { 
  Play, 
  Pause, 
  Plus, 
  Clock, 
  Flame, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Calendar,
  History,
  TrendingUp,
  Zap,
  Bookmark,
  Check
} from 'lucide-react'
import { formatDuration, formatTimeStr, formatTimerDisplay, getLocalDateString } from '../utils/formatters'
import { DEFAULT_CATEGORIES, getCategoryById } from '../utils/categories'

export default function TodayView({
  sessions = [],
  tasks = [],
  activeTimer,
  categories = DEFAULT_CATEGORIES,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onSaveTimerSession,
  onUpdateTimerMeta,
  onOpenManualEntry,
  onDeleteSession,
  user,
  onNavigateToTimer,
  onNavigateToTasks,
  onOpenAuthModal
}) {
  const [taskInput, setTaskInput] = useState('')
  const [selectedCat, setSelectedCat] = useState('frontend')
  const [quickFeedback, setQuickFeedback] = useState('')

  // Filter sessions logged strictly TODAY
  const todayStr = useMemo(() => getLocalDateString(), [])
  
  const todaySessions = useMemo(() => {
    return sessions.filter(s => {
      if (!s.startTime) return false
      return getLocalDateString(s.startTime) === todayStr
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  }, [sessions, todayStr])

  // Today's total logged focus time
  const todaySeconds = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  }, [todaySessions])

  const todayHours = (todaySeconds / 3600).toFixed(1)

  // Daily target (default 4.0h)
  const dailyTargetHours = user?.dailyTargetHours || 4.0
  const targetPercent = Math.min(100, Math.round((todaySeconds / (dailyTargetHours * 3600)) * 100))

  // Recent unique tasks to offer as 1-click launch chips
  const quickPickTasks = useMemo(() => {
    const seen = new Set()
    const list = []

    // 1. First priority: real backlog tasks that are not yet completed
    for (const t of tasks) {
      if (t && t.title && t.title.trim() && t.status !== 'completed') {
        const key = t.title.toLowerCase().trim()
        if (!seen.has(key)) {
          seen.add(key)
          list.push({
            title: t.title.trim(),
            category: t.category || 'frontend'
          })
          if (list.length >= 4) break
        }
      }
    }

    // 2. Second priority: recently logged sessions
    if (list.length < 4) {
      const sorted = [...sessions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      for (const s of sorted) {
        if (s && s.title && s.title.trim()) {
          const key = s.title.toLowerCase().trim()
          if (!seen.has(key)) {
            seen.add(key)
            list.push({
              title: s.title.trim(),
              category: s.category || 'frontend'
            })
            if (list.length >= 4) break
          }
        }
      }
    }

    return list
  }, [tasks, sessions])

  // Category breakdown for Today
  const todayCategoryBreakdown = useMemo(() => {
    const map = new Map()
    for (const s of todaySessions) {
      const catId = s.category || 'frontend'
      map.set(catId, (map.get(catId) || 0) + (s.durationSeconds || 0))
    }
    return Array.from(map.entries()).map(([catId, secs]) => {
      const cat = getCategoryById(catId)
      return {
        ...cat,
        seconds: secs,
        percent: todaySeconds > 0 ? Math.round((secs / todaySeconds) * 100) : 0
      }
    }).sort((a, b) => b.seconds - a.seconds)
  }, [todaySessions, todaySeconds])

  // Handle launching a new task immediately
  const handleLaunchNewTask = (e) => {
    if (e) e.preventDefault()
    const cleanTitle = taskInput.trim() || 'Focus Session'
    
    if (onUpdateTimerMeta) {
      onUpdateTimerMeta({ title: cleanTitle, category: selectedCat })
    }
    if (!activeTimer?.isRunning && onStartTimer) {
      onStartTimer()
    }
    setQuickFeedback('Task launched! Focus timer running ⏱️')
    setTimeout(() => setQuickFeedback(''), 3000)
    setTaskInput('')
  }

  // Handle 1-click start on an existing task chip
  const handleLaunchExistingTask = (task) => {
    if (onUpdateTimerMeta) {
      onUpdateTimerMeta({ title: task.title, category: task.category })
    }
    if (!activeTimer?.isRunning && onStartTimer) {
      onStartTimer()
    }
    setQuickFeedback(`Started: "${task.title}" 🚀`)
    setTimeout(() => setQuickFeedback(''), 3000)
  }

  const hasActiveSession = Boolean(
    activeTimer && (activeTimer.isRunning || (activeTimer.seconds || 0) > 0 || (activeTimer.title && activeTimer.title.trim()))
  )
  const activeCategory = getCategoryById(activeTimer?.category || 'frontend')

  // Formatted date string for today
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full">
      
      {/* Top Banner: Greeting, Today's Date & Live Target */}
      <div className="bg-gradient-to-r from-orange-600/15 via-amber-500/10 to-transparent border border-orange-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{todayFormatted}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Today's Focus Cockpit
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-slate-300 mt-1 max-w-xl">
              Start a new task, resume recent work, and hit your daily focus targets one session at a time.
            </p>
          </div>

          {/* Quick Streak badge */}
          <div className="flex items-center space-x-3 bg-white dark:bg-[#10141f] border border-zinc-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex-shrink-0 shadow-sm">
            <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Flame className="w-6 h-6 fill-orange-500 dark:fill-orange-400" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">Daily Streak</span>
              <div className="text-xl font-black text-zinc-900 dark:text-white font-mono">
                {user?.streakDays ?? 0} <span className="text-xs font-normal text-zinc-500 dark:text-slate-400">Days</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {(user?.streakDays || 0) > 0 ? '🔥 Active Today' : 'Start your streak!'}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Today Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-orange-500/20">
          
          {/* Card 1: Today's Focus Hours */}
          <div className="bg-white/80 dark:bg-[#0e131d]/80 rounded-2xl p-4 border border-zinc-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400 mb-1">
              <span>Focus Time Today</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {formatDuration(todaySeconds)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-slate-400">
              <span>Target: {dailyTargetHours.toFixed(1)}h</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{targetPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden mt-1">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500"
                style={{ width: `${targetPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Today's Sessions Count */}
          <div className="bg-white/80 dark:bg-[#0e131d]/80 rounded-2xl p-4 border border-zinc-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400 mb-1">
              <span>Sessions Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {todaySessions.length} <span className="text-xs font-normal text-zinc-500 dark:text-slate-400">sessions</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-2 truncate">
              {todaySessions.length > 0 ? `Avg: ${(todaySeconds / (todaySessions.length * 60)).toFixed(0)}m per session` : 'No sessions logged yet'}
            </p>
          </div>

          {/* Card 3: Top Category for Today */}
          <div className="bg-white/80 dark:bg-[#0e131d]/80 rounded-2xl p-4 border border-zinc-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400 mb-1">
              <span>Top Focus Category</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white truncate">
              {todayCategoryBreakdown[0] ? todayCategoryBreakdown[0].name : 'None yet'}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-2 truncate">
              {todayCategoryBreakdown[0] ? `${formatDuration(todayCategoryBreakdown[0].seconds)} (${todayCategoryBreakdown[0].percent}%)` : 'Start a task to categorize'}
            </p>
          </div>

        </div>
      </div>

      {/* Task Launcher Card: Start a New Task Right Now */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Start or Add a Task for Today
            </h3>
          </div>
          {quickFeedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
              {quickFeedback}
            </span>
          )}
        </div>

        {/* Input & Launch Form */}
        <form onSubmit={handleLaunchNewTask} className="flex flex-col md:flex-row gap-2.5">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="What are you working on right now? (e.g. Next.js Routing, DSA Binary Search)..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full sm:w-auto px-3.5 pr-9 py-3 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500 font-medium shadow-sm cursor-pointer"
            >
              {(categories || DEFAULT_CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 active:scale-95 transition-all flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-white flex-shrink-0" />
              <span>Start Focus</span>
            </button>
          </div>
        </form>

        {/* 1-Click Launch from Recent / Existing Tasks */}
        {quickPickTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400">
                Or pick from your tasks to launch immediately:
              </span>
              {onNavigateToTasks && (
                <button
                  type="button"
                  onClick={onNavigateToTasks}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>View All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {quickPickTasks.map((task, idx) => {
                const cat = getCategoryById(task.category)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLaunchExistingTask(task)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#0d1017] dark:hover:bg-[#141824] border border-zinc-200 dark:border-white/5 text-left transition-all group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 mr-1.5">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="text-xs font-medium text-zinc-800 dark:text-slate-200 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {task.title}
                      </span>
                    </div>
                    <Play className="w-3 h-3 text-zinc-400 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Active Session Card (If Timer is Running or Active) */}
      {hasActiveSession && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-2 border-orange-500/40 dark:border-orange-500/50 rounded-2xl p-5 shadow-lg shadow-orange-500/10 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
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
                    <span>{activeTimer?.isRunning ? 'Live In-Progress' : 'Session Paused'}</span>
                  </span>

                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${activeCategory.bgClass}`}>
                    {activeCategory.name}
                  </span>
                </div>

                <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                  {activeTimer?.title?.trim() || 'Untitled Active Focus Session'}
                </h4>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 pl-7 sm:pl-0">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-slate-500 block">
                  Elapsed
                </span>
                <span className="font-mono text-lg font-black text-orange-600 dark:text-orange-400">
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
                  onClick={onNavigateToTimer}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-white border border-zinc-200 dark:border-white/10 text-xs font-medium transition-all"
                  title="Open Full Focus Mode"
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
                    title="Save session to history"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Logged Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Today's Logged Sessions
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 text-xs font-mono font-semibold border border-zinc-200 dark:border-transparent">
              {todaySessions.length}
            </span>
          </div>

          <button
            onClick={onOpenManualEntry}
            className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Past Time</span>
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-10 text-center shadow-sm">
            <Clock className="w-10 h-10 text-zinc-400 dark:text-slate-600 mx-auto mb-2.5" />
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-slate-300">No sessions recorded today yet</h4>
            <p className="text-xs text-zinc-500 dark:text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Enter a task name above and hit "Start Focus" to begin logging today's deep work.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {todaySessions.map(session => {
              const category = getCategoryById(session.category)
              return (
                <div
                  key={session.id}
                  className="bg-white hover:bg-zinc-50 dark:bg-[#111622] dark:hover:bg-[#151c2b] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group shadow-sm"
                >
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
        )}
      </div>

    </div>
  )
}
