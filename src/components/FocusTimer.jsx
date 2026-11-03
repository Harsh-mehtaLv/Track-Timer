import React, { useState, useEffect, useMemo } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Coffee, 
  Sparkles, 
  Tag, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  X,
  History,
  TrendingUp,
  Bookmark,
  Check,
  Plus
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { formatTimerDisplay } from '../utils/formatters'
import { DEFAULT_CATEGORIES, getCategoryById, PRESET_CATEGORY_COLORS } from '../utils/categories'

export default function FocusTimer({
  sessions = [],
  tasks = [],
  activeTimer,
  categories = DEFAULT_CATEGORIES,
  onAddCategory,
  onRemoveCategory,
  onSaveTaskToBacklog,
  onStart,
  onPause,
  onResume,
  onReset,
  onSaveSession,
  onUpdateTimerMeta,
  onClose
}) {
  const [taskTitle, setTaskTitle] = useState(activeTimer?.title || '')
  const [selectedCategory, setSelectedCategory] = useState(activeTimer?.category || 'frontend')
  const [mode, setMode] = useState(activeTimer?.mode || 'stopwatch') // 'stopwatch' | 'pomodoro'
  const [pomoPreset, setPomoPreset] = useState(25) // minutes
  const [quickTaskTab, setQuickTaskTab] = useState('recent') // 'recent' | 'most_used'
  const [taskSavedFeedback, setTaskSavedFeedback] = useState(false)

  // Optional Task Details State (Priority, Status, Notes)
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskStatus, setTaskStatus] = useState('todo')
  const [taskNotes, setTaskNotes] = useState('')
  const [showTaskDetails, setShowTaskDetails] = useState(false)

  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#f97316')
  const [catError, setCatError] = useState('')
  const [catFeedback, setCatFeedback] = useState('')

  const handleCreateCategorySubmit = (e) => {
    e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed) {
      setCatError('Please enter a category name.')
      return
    }

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCatError('A category with this name already exists.')
      return
    }

    if (onAddCategory) {
      const created = onAddCategory({ name: trimmed, color: newCatColor })
      if (created) {
        handleCategoryChange(created.id)
        setCatFeedback(`Category "${created.name}" created!`)
        setTimeout(() => setCatFeedback(''), 2500)
      }
    }

    setNewCatName('')
    setCatError('')
    setIsAddingCategory(false)
  }

  const handleDeleteCategory = (cat) => {
    if (!cat.isCustom) return
    const confirmed = window.confirm(`Delete custom category "${cat.name}"? Existing logged sessions will keep their history.`)
    if (!confirmed) return

    if (onRemoveCategory) {
      onRemoveCategory(cat.id)
      if (selectedCategory === cat.id) {
        handleCategoryChange('frontend')
      }
      setCatFeedback(`Category "${cat.name}" removed.`)
      setTimeout(() => setCatFeedback(''), 2500)
    }
  }

  // Sync taskTitle with activeTimer.title if changed
  useEffect(() => {
    if (activeTimer?.title && !taskTitle) {
      setTaskTitle(activeTimer.title)
    }
  }, [activeTimer?.title])

  const handleSaveTaskName = (e) => {
    if (e) e.preventDefault()
    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle) return

    onUpdateTimerMeta({ title: trimmedTitle, category: selectedCategory })

    // Live sync task to Tasks page backlog with priority, status, and notes
    if (onSaveTaskToBacklog) {
      onSaveTaskToBacklog({
        title: trimmedTitle,
        category: selectedCategory,
        priority: taskPriority,
        status: activeTimer.isRunning ? 'in_progress' : taskStatus,
        notes: taskNotes.trim()
      })
    }

    setTaskSavedFeedback(true)
    setTimeout(() => setTaskSavedFeedback(false), 2500)
  }

  // Extract up to 4 most recent unique tasks from user backlog & logged sessions
  const recentTasks = useMemo(() => {
    const seen = new Set()
    const list = []

    // 1. Prioritize user's active backlog tasks
    for (const t of tasks) {
      if (t && t.title && t.title.trim()) {
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

    // 2. Previously logged sessions
    if (list.length < 4) {
      const sorted = [...sessions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      for (const s of sorted) {
        if (s.title && s.title.trim()) {
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

    // Single clean sample task when a new user visits with no history yet
    if (list.length === 0) {
      return [
        { title: 'Sample Task: Focus Session', category: 'frontend' }
      ]
    }
    return list
  }, [tasks, sessions])

  // Extract up to 4 most frequently logged tasks
  const mostUsedTasks = useMemo(() => {
    const countMap = new Map()

    for (const s of sessions) {
      if (!s.title || !s.title.trim()) continue
      const key = s.title.toLowerCase().trim()
      const existing = countMap.get(key)
      if (existing) {
        existing.count += 1
        existing.totalSeconds += (s.durationSeconds || 0)
      } else {
        countMap.set(key, {
          title: s.title.trim(),
          category: s.category || 'frontend',
          count: 1,
          totalSeconds: s.durationSeconds || 0
        })
      }
    }

    const sorted = Array.from(countMap.values())
      .sort((a, b) => b.count - a.count || b.totalSeconds - a.totalSeconds)
      .slice(0, 4)

    if (sorted.length === 0) {
      return [
        { title: 'Sample Task: Focus Session', category: 'frontend', count: 1 }
      ]
    }
    return sorted
  }, [sessions])

  const quickTasksToDisplay = quickTaskTab === 'recent' ? recentTasks : mostUsedTasks

  const handleSelectQuickTask = (task) => {
    setTaskTitle(task.title)
    setSelectedCategory(task.category || 'frontend')
    if (task.priority) setTaskPriority(task.priority)
    if (task.status) setTaskStatus(task.status)
    if (task.notes) setTaskNotes(task.notes)
    onUpdateTimerMeta({ title: task.title, category: task.category || 'frontend' })
    if (onSaveTaskToBacklog) {
      onSaveTaskToBacklog({
        title: task.title,
        category: task.category || 'frontend',
        priority: task.priority || taskPriority,
        status: activeTimer.isRunning ? 'in_progress' : (task.status || 'todo'),
        notes: task.notes || ''
      })
    }
    setTaskSavedFeedback(true)
    setTimeout(() => setTaskSavedFeedback(false), 2500)
  }

  // Sync inputs with parent state
  const handleTitleChange = (val) => {
    setTaskTitle(val)
    onUpdateTimerMeta({ title: val, category: selectedCategory })
  }

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId)
    onUpdateTimerMeta({ title: taskTitle, category: catId })
  }

  const handleSave = () => {
    // Confetti burst for rewarding consistency!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch {
      // ignore
    }

    onSaveSession({
      title: taskTitle.trim() || 'Focus Session',
      category: selectedCategory,
      durationSeconds: activeTimer.seconds,
      mode: mode
    })

    setTaskTitle('')
  }

  // Calculate SVG circular stroke offset for Pomodoro countdown
  const targetTotalSeconds = (mode === 'pomodoro' ? pomoPreset * 60 : 3600)
  const progressRatio = Math.min(1, activeTimer.seconds / targetTotalSeconds)
  const strokeDashoffset = 565 - (565 * progressRatio)

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
      
      {/* Navigation Top Bar: Back to Dashboard & Status Badge */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center sm:justify-start space-x-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111622] hover:bg-zinc-50 dark:hover:bg-[#161d2d] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white text-xs sm:text-sm font-medium transition-all group shadow-sm active:scale-95 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500 dark:text-orange-400 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
          <span>Back to Weekly Dashboard</span>
        </button>

        {activeTimer.isRunning && (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 sm:py-1.5 rounded-xl flex-shrink-0 font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span>Focus timer actively running</span>
          </div>
        )}
      </div>

      {/* Timer Card */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          activeTimer.isRunning 
            ? 'bg-orange-500/15' 
            : 'bg-zinc-400/5 dark:bg-slate-500/5'
        }`}></div>

        {/* Top bar: Mode switcher & sound toggle & Close button */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-zinc-100 dark:border-white/5 relative z-10">
          <div className="flex items-center bg-zinc-100 dark:bg-[#0b0e15] p-0.5 sm:p-1 rounded-xl border border-zinc-200 dark:border-white/10">
            <button
              onClick={() => {
                setMode('stopwatch')
                onUpdateTimerMeta({ mode: 'stopwatch' })
              }}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                mode === 'stopwatch'
                  ? 'bg-orange-600 dark:bg-orange-500 text-white shadow-md'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Stopwatch</span>
            </button>

            <button
              onClick={() => {
                setMode('pomodoro')
                onUpdateTimerMeta({ mode: 'pomodoro', targetSeconds: pomoPreset * 60 })
              }}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                mode === 'pomodoro'
                  ? 'bg-orange-600 dark:bg-orange-500 text-white shadow-md'
                  : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Pomodoro</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Direct Close (X) button */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white text-xs font-medium transition-colors"
              title="Close Focus Mode"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Pomodoro Presets (visible only in pomodoro mode) */}
        {mode === 'pomodoro' && (
          <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 my-3 sm:my-4 relative z-10">
            {[25, 45, 50, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setPomoPreset(mins)
                  onUpdateTimerMeta({ targetSeconds: mins * 60 })
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  pomoPreset === mins 
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40' 
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-transparent'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Center: Big Digital Clock with Circular Progress */}
        <div className="py-4 sm:py-8 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center">
            
            {/* SVG Progress Circle */}
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
              <circle
                cx="100"
                cy="100"
                r="90"
                className="text-zinc-200 dark:text-slate-800/80"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                className="text-orange-600 dark:text-orange-500 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="565"
                strokeDashoffset={mode === 'pomodoro' ? strokeDashoffset : 0}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Inner Content: Timer & Status */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
              <span className={`text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase mb-0.5 sm:mb-1 ${
                activeTimer.isRunning ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-zinc-500 dark:text-slate-400'
              }`}>
                {activeTimer.isRunning ? 'Focus In Progress' : activeTimer.seconds > 0 ? 'Paused' : 'Ready'}
              </span>

              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-md">
                {formatTimerDisplay(activeTimer.seconds)}
              </span>

              <div className="mt-1 sm:mt-2 max-w-[135px] sm:max-w-[175px] px-1 text-center">
                <p 
                  className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-slate-300 leading-snug line-clamp-2 break-words"
                  title={taskTitle}
                >
                  {taskTitle || 'No task entered'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Task Input Field */}
        <div className="space-y-4 max-w-lg mx-auto relative z-10">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400">
                What are you focusing on?
              </label>
              {taskSavedFeedback && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  <span>Task Active & Synced ✓</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveTaskName} className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Building React components, Solving DSA question #42..."
                className="w-full flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm"
              />
              <button
                type="submit"
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-sm flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0"
                title="Save task name (keeps the timer running!)"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Task</span>
              </button>
            </form>

            {/* Optional details toggle (Priority, Status, Notes) */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={() => setShowTaskDetails(prev => !prev)}
                className="text-zinc-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors flex items-center space-x-1 text-[11px] font-medium"
              >
                <span>{showTaskDetails ? '– Hide Details' : '+ Add Details (Priority & Status)'}</span>
              </button>
            </div>

            {/* Expandable Task Details Panel */}
            {showTaskDetails && (
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 space-y-2.5 animate-fadeIn mt-1 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-2.5 pr-8 py-1.5 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                    >
                      <option value="high">🔴 High Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="low">🟢 Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 mb-1">
                      Initial Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-2.5 pr-8 py-1.5 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                    >
                      <option value="todo">📋 To Do</option>
                      <option value="urgent">🔥 Urgent Basis</option>
                      <option value="in_progress">⚡ In Progress</option>
                      <option value="later">⏳ Will Do Later</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Add brief milestones or notes for this task..."
                    rows={2}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Quick-Select Tasks (Compact Tabbed Format: Recent & Most Used) */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-slate-400">
                  Quick Select Task:
                </span>

                {/* Compact Tabs */}
                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-[#0b0e15] p-0.5 rounded-lg border border-zinc-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setQuickTaskTab('recent')}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      quickTaskTab === 'recent'
                        ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <History className="w-2.5 h-2.5" />
                    <span>Recent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickTaskTab('most_used')}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      quickTaskTab === 'most_used'
                        ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>Most Used</span>
                  </button>
                </div>
              </div>

              {/* Compact Quick Task Chips (Grid 2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {quickTasksToDisplay.map((task, idx) => {
                  const cat = getCategoryById(task.category)
                  const isSelected = taskTitle === task.title
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickTask(task)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30'
                          : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-[#0d1017] dark:hover:bg-[#141824] border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-slate-300 hover:border-zinc-300 dark:hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 mr-1.5">
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: cat.color }}
                        ></span>
                        <span className="text-xs truncate font-medium">{task.title}</span>
                      </div>

                      {quickTaskTab === 'most_used' && task.count ? (
                        <span className="text-[9px] font-mono font-semibold text-zinc-600 dark:text-slate-400 bg-zinc-200/60 dark:bg-white/5 px-1.5 py-0.2 rounded flex-shrink-0">
                          {task.count}x
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400 flex-shrink-0">
                          {cat.name.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Category Picker & Custom Category Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400">
                  Select Category
                </label>
                {catFeedback && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                    ✓ {catFeedback}
                  </span>
                )}
              </div>
            </div>

            {/* Inline Custom Category Creator */}
            {isAddingCategory && (
              <form 
                onSubmit={handleCreateCategorySubmit}
                className="mb-3 p-3 sm:p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#0b0e15] border border-orange-500/30 dark:border-orange-500/20 space-y-3 animate-fadeIn shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-slate-200">
                    Create Custom Category
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-slate-400">
                    Saved to your categories
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value)
                      if (catError) setCatError('')
                    }}
                    placeholder="Category name (e.g. Mobile Dev, UI/UX, Client Work...)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 focus:border-orange-500 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm"
                    maxLength={30}
                    autoFocus
                  />
                  {catError && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{catError}</p>
                  )}
                </div>

                {/* Color Swatch Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-slate-400 mb-1.5">
                    Select Color Badge:
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {PRESET_CATEGORY_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewCatColor(c.hex)}
                        title={c.name}
                        className={`w-6 h-6 rounded-full transition-all relative flex items-center justify-center ${
                          newCatColor === c.hex 
                            ? 'scale-110 ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-[#0b0e15]' 
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {newCatColor === c.hex && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCatName('')
                      setCatError('')
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-slate-400 hover:bg-zinc-200 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>
              </form>
            )}

            {/* Category Pills List */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id
                const isCustom = cat.isCustom

                return (
                  <div
                    key={cat.id}
                    className="relative group inline-flex"
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? `${cat.bgClass || ''} shadow-sm ring-1 ring-orange-500/30`
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border-zinc-200 dark:border-white/5 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                      style={isSelected ? {
                        backgroundColor: `${cat.color}18`,
                        borderColor: `${cat.color}60`,
                        color: cat.color
                      } : undefined}
                    >
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="truncate max-w-[150px]">{cat.name}</span>

                      {/* Remove Button for Custom Categories */}
                      {isCustom && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(cat)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                              handleDeleteCategory(cat)
                            }
                          }}
                          className="ml-1 -mr-1 p-0.5 rounded-md hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Delete "${cat.name}" category`}
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}

              {/* Add Custom Category Quick Pill */}
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed border-zinc-300 dark:border-white/20 text-zinc-500 dark:text-slate-400 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/5 transition-all"
                  title="Add custom category"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Category</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-zinc-100 dark:border-white/5 relative z-10">
          
          {/* Reset button */}
          <button
            onClick={() => {
              onReset()
            }}
            disabled={activeTimer.seconds === 0}
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-700 dark:text-slate-300 border border-zinc-200 dark:border-white/10 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Main Play / Pause Button */}
          {!activeTimer.isRunning ? (
            <button
              onClick={() => {
                if (activeTimer.seconds > 0) {
                  onResume()
                } else {
                  onStart()
                }
              }}
              className="flex items-center space-x-2 px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>{activeTimer.seconds > 0 ? 'Resume' : 'Start Focus'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onPause()
              }}
              className="flex items-center space-x-2 px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
              <span>Pause</span>
            </button>
          )}

          {/* Save & Finish session */}
          <button
            onClick={handleSave}
            disabled={activeTimer.seconds < 10}
            className="flex items-center space-x-1.5 px-3.5 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 disabled:opacity-30 disabled:pointer-events-none font-semibold text-xs sm:text-sm transition-all"
            title="Save session to weekly dashboard"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Finish & Save Session</span>
            <span className="xs:hidden">Finish Session</span>
          </button>

        </div>

      </div>

      {/* Productivity Tips Card */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 flex items-start space-x-4 shadow-sm">
        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex-shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Daily Focus Protocol</h4>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 leading-relaxed">
            Logging just 2 hours of focused deep work every day beats an erratic 12-hour sprint. Build your streak, stay consistent, and protect your momentum!
          </p>
        </div>
      </div>

    </div>
  )
}
