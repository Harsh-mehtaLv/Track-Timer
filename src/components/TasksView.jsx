import React, { useState, useMemo } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Flame, 
  Tag, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  AlertCircle, 
  Sparkles, 
  ListTodo, 
  Calendar,
  X,
  Check,
  ChevronDown,
  ArrowUpDown,
  TrendingUp,
  FolderKanban
} from 'lucide-react'
import { formatDuration, formatTimerDisplay } from '../utils/formatters'
import { DEFAULT_CATEGORIES, getCategoryById, PRESET_CATEGORY_COLORS } from '../utils/categories'

export default function TasksView({
  tasks = [],
  setTasks,
  sessions = [],
  categories = DEFAULT_CATEGORIES,
  onAddCategory,
  activeTimer,
  onStartTaskTimer,
  onNavigateToTimer
}) {
  // Filters & Search
  const [activeStatusTab, setActiveStatusTab] = useState('all') // 'all' | 'todo' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'time_spent' | 'priority' | 'alphabetical'

  // Inline Quick Add Form State
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('frontend')
  const [newPriority, setNewPriority] = useState('medium')
  const [newStatus, setNewStatus] = useState('todo')
  const [newNotes, setNewNotes] = useState('')
  const [showNotesInput, setShowNotesInput] = useState(false)

  // Custom Category State inside Tasks
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#f97316')
  const [catError, setCatError] = useState('')
  const [catFeedback, setCatFeedback] = useState('')

  const handleCreateCategorySubmit = (e) => {
    if (e) e.preventDefault()
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
        setNewCategory(created.id)
        setCatFeedback(`Category "${created.name}" created!`)
        setTimeout(() => setCatFeedback(''), 2500)
      }
    }

    setNewCatName('')
    setCatError('')
    setIsAddingCategory(false)
  }

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('frontend')
  const [editPriority, setEditPriority] = useState('medium')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('todo')

  // Notification Toast
  const [toastMsg, setToastMsg] = useState('')
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Calculate focus time logged for each task from completed sessions
  const taskFocusTimeMap = useMemo(() => {
    const map = new Map()
    for (const session of sessions) {
      if (session.title && session.durationSeconds) {
        const key = session.title.trim().toLowerCase()
        const current = map.get(key) || { seconds: 0, count: 0 }
        map.set(key, {
          seconds: current.seconds + session.durationSeconds,
          count: current.count + 1
        })
      }
    }
    return map
  }, [sessions])

  // Get focus time statistics for a specific task
  const getTaskStats = (task) => {
    if (!task || !task.title) return { seconds: 0, count: 0 }
    const key = task.title.trim().toLowerCase()
    return taskFocusTimeMap.get(key) || { seconds: 0, count: 0 }
  }

  // Summary Metrics
  const totalTasksCount = tasks.length
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length
  const urgentTasksCount = tasks.filter(t => t.status === 'urgent').length
  const laterTasksCount = tasks.filter(t => t.status === 'later').length
  const todoTasksCount = tasks.filter(t => (t.status === 'todo' || !t.status)).length
  const completionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0

  const totalTimeSpentOnAllTasks = useMemo(() => {
    return tasks.reduce((acc, t) => acc + getTaskStats(t).seconds, 0)
  }, [tasks, taskFocusTimeMap])

  // Priority Rank helper for sorting
  const priorityRank = {
    high: 3,
    medium: 2,
    low: 1
  }

  // Filtered & Sorted Tasks List
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      // Status filter
      if (activeStatusTab !== 'all' && t.status !== activeStatusTab) return false

      // Category filter
      if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false

      // Priority filter
      if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = (t.title || '').toLowerCase().includes(query)
        const matchNotes = (t.notes || '').toLowerCase().includes(query)
        if (!matchTitle && !matchNotes) return false
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'time_spent') {
        const aSecs = getTaskStats(a).seconds
        const bSecs = getTaskStats(b).seconds
        return bSecs - aSecs
      }
      if (sortBy === 'priority') {
        return (priorityRank[b.priority] || 1) - (priorityRank[a.priority] || 1)
      }
      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '')
      }
      // 'recent' default
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

    return result
  }, [tasks, activeStatusTab, selectedCategoryFilter, selectedPriorityFilter, searchQuery, sortBy, taskFocusTimeMap])

  // Toggle Task Completion status
  const handleToggleTaskStatus = (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : null
        }
      }
      return t
    })
    setTasks(updated)
    showToast(nextStatus === 'completed' ? `Completed: "${task.title}"` : `Marked as To Do`)
  }

  // Handle Quick Add Task
  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const isCompleted = newStatus === 'completed'
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: newStatus,
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : null
    }

    setTasks([newTask, ...tasks])
    setNewTitle('')
    setNewNotes('')
    setNewStatus('todo')
    setShowNotesInput(false)
    showToast(`Task added: "${newTask.title}"`)
  }

  // Launch Focus Timer for a Specific Task
  const handleLaunchTimerForTask = (task) => {
    // If task was not in_progress or completed, transition to in_progress
    if (task.status !== 'in_progress' && task.status !== 'completed') {
      const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'in_progress' } : t)
      setTasks(updated)
    }

    if (onStartTaskTimer) {
      onStartTaskTimer({
        title: task.title,
        category: task.category
      })
    }
    showToast(`Focus Timer started for "${task.title}"!`)
  }

  // Delete Task
  const handleDeleteTask = (taskId, title) => {
    setTasks(tasks.filter(t => t.id !== taskId))
    showToast(`Removed "${title}"`)
  }

  // Open Edit Task Modal
  const handleOpenEdit = (task) => {
    setEditingTask(task)
    setEditTitle(task.title || '')
    setEditCategory(task.category || 'frontend')
    setEditPriority(task.priority || 'medium')
    setEditNotes(task.notes || '')
    setEditStatus(task.status || 'todo')
  }

  // Save Task Edits
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingTask || !editTitle.trim()) return

    const updated = tasks.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          title: editTitle.trim(),
          category: editCategory,
          priority: editPriority,
          notes: editNotes.trim(),
          status: editStatus,
          completedAt: editStatus === 'completed' ? (t.completedAt || new Date().toISOString()) : null
        }
      }
      return t
    })

    setTasks(updated)
    setEditingTask(null)
    showToast('Task updated successfully!')
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full max-w-7xl mx-auto">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-3.5 rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-500/25 flex items-center space-x-2 text-xs font-semibold animate-slideDown">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
            <FolderKanban className="w-4 h-4" />
            <span>Task Backlog & Action Items</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            All Tasks & Focus Tracker
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 max-w-2xl">
            Organize your projects, track cumulative focus hours per task, and launch interval timers directly with a single click.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveStatusTab('todo')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Focus Goal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Task Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Total Tasks */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {totalTasksCount}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-1 block">
            {urgentTasksCount > 0 ? `${urgentTasksCount} urgent • ` : ''}{todoTasksCount} to do • {inProgressTasksCount} active
          </span>
        </div>

        {/* KPI 2: Completed Rate */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {completionRate}%
          </div>
          <div className="w-full bg-zinc-100 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 3: Total Task Focus Time */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Logged Focus Time</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {formatDuration(totalTimeSpentOnAllTasks)}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-1 block">
            Across logged intervals
          </span>
        </div>

        {/* KPI 4: Active Running Timer */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Timer</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className={`w-4 h-4 ${activeTimer?.isRunning ? 'animate-pulse text-orange-500 fill-orange-500' : ''}`} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-white truncate">
            {activeTimer?.isRunning ? formatTimerDisplay(activeTimer.seconds) : 'Idle'}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-1 block truncate">
            {activeTimer?.isRunning ? (activeTimer.title || 'Focus Session') : 'Ready to start'}
          </span>
        </div>

      </div>

      {/* Add Task Box */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleAddTask} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What task or project are you working on next?"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
              {/* Category Selector */}
              <select
                value={newCategory}
                onChange={(e) => {
                  if (e.target.value === '__custom_new__') {
                    setIsAddingCategory(true)
                  } else {
                    setNewCategory(e.target.value)
                  }
                }}
                className="flex-1 sm:flex-initial px-3 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                title="Select Category"
              >
                {(categories || DEFAULT_CATEGORIES).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__custom_new__">Custom Category...</option>
              </select>

              {/* Priority Selector */}
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="flex-1 sm:flex-initial px-3 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                title="Select Priority"
              >
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>

              {/* Status Selector */}
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 sm:flex-initial px-3 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                title="Initial Task Status"
              >
                <option value="todo">📋 To Do</option>
                <option value="urgent">🔥 Urgent Basis</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="later">⏳ Will Do Later</option>
                <option value="completed">✅ Completed</option>
              </select>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Optional notes expandable toggle & custom category link */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="text-zinc-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors flex items-center space-x-1"
            >
              <span>{showNotesInput ? '– Hide Notes' : '+ Add Notes / Description'}</span>
            </button>

            <div className="flex items-center space-x-2">
              {catFeedback && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                  ✓ {catFeedback}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors flex items-center space-x-1 text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Category</span>
              </button>
            </div>
          </div>

          {/* Inline Custom Category Creator */}
          {isAddingCategory && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#0b0e15] border border-orange-500/30 dark:border-orange-500/20 space-y-3 animate-fadeIn shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 dark:text-slate-200">
                  Create Custom Category
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-slate-400">
                  Will appear in all dropdowns
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
                  type="button"
                  onClick={handleCreateCategorySubmit}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </div>
          )}

          {showNotesInput && (
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Add key milestones, links, or notes for this task..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 animate-fadeIn"
            />
          )}
        </form>
      </div>

      {/* Task Filters & Tabs Toolbar */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-1">
            {[
              { id: 'all', label: 'All Tasks', count: totalTasksCount },
              { id: 'urgent', label: '🔥 Urgent Basis', count: urgentTasksCount },
              { id: 'in_progress', label: '⚡ In Progress', count: inProgressTasksCount },
              { id: 'todo', label: '📋 To Do', count: todoTasksCount },
              { id: 'later', label: '⏳ Will Do Later', count: laterTasksCount },
              { id: 'completed', label: '✅ Completed', count: completedTasksCount }
            ].map(tab => {
              const isActive = activeStatusTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 text-xs flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 pr-8 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
            >
              <option value="recent">Newest Created</option>
              <option value="time_spent">Most Focus Time Logged</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Search & Extra Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by name or notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 pr-8 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {(categories || DEFAULT_CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="w-full px-3 pr-8 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
          </div>
        </div>

      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              No tasks found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategoryFilter !== 'all' || selectedPriorityFilter !== 'all'
                ? 'No tasks match your current filter or search criteria.'
                : 'Start by adding a task above or pick one of the recommended goals.'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const cat = getCategoryById(task.category)
            const stats = getTaskStats(task)
            const isCompleted = task.status === 'completed'
            const isInProgress = task.status === 'in_progress'
            const isUrgent = task.status === 'urgent'
            const isLater = task.status === 'later'

            const priorityBadge = {
              high: { label: 'High', color: 'bg-red-500/15 text-red-500 border-red-500/30' },
              medium: { label: 'Medium', color: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
              low: { label: 'Low', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' }
            }[task.priority || 'medium']

            const statusBadge = {
              urgent: {
                label: 'Urgent Basis',
                icon: '🔥',
                color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              },
              in_progress: {
                label: 'In Progress',
                icon: '⚡',
                color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
              },
              later: {
                label: 'Will Do Later',
                icon: '⏳',
                color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
              },
              todo: {
                label: 'To Do',
                icon: '📋',
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              },
              completed: {
                label: 'Completed',
                icon: '✓',
                color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }
            }[task.status || 'todo']

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-orange-500/40 ${
                  isCompleted 
                    ? 'border-zinc-200/60 dark:border-white/5 opacity-75 bg-zinc-50/50 dark:bg-[#0c0f17]' 
                    : isUrgent
                    ? 'border-rose-500/40 ring-1 ring-rose-500/25 bg-rose-500/[0.03]'
                    : isInProgress
                    ? 'border-orange-500/40 ring-1 ring-orange-500/20'
                    : isLater
                    ? 'border-purple-500/30 bg-purple-500/[0.02]'
                    : 'border-zinc-200 dark:border-white/10'
                }`}
              >
                
                {/* Left: Checkbox + Title + Meta */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTaskStatus(task)}
                    className="mt-0.5 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                    title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${priorityBadge.color}`}>
                        {priorityBadge.label}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cat.bgClass}`}>
                        {cat.name}
                      </span>

                      <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge.color} ${isUrgent || isInProgress ? 'animate-pulse' : ''}`}>
                        <span>{statusBadge.icon}</span>
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>

                    <h4 className={`text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-snug break-words ${
                      isCompleted ? 'line-through text-zinc-400 dark:text-slate-500' : ''
                    }`}>
                      {task.title}
                    </h4>

                    {task.notes && (
                      <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">
                        {task.notes}
                      </p>
                    )}

                    {/* Stats pill: Focus time logged on this task */}
                    <div className="flex items-center space-x-3 text-xs pt-1">
                      <div className="flex items-center space-x-1 text-zinc-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-mono font-bold text-zinc-700 dark:text-slate-200">
                          {formatDuration(stats.seconds)}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          ({stats.count} session{stats.count !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between md:justify-end space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-white/5">
                  
                  {/* Start Focus Timer Button */}
                  <button
                    onClick={() => handleLaunchTimerForTask(task)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all"
                    title="Launch Focus Timer with this task"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Focus Timer</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    title="Edit Task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            )
          })
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pr-8">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Edit Task
              </h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                Update task title, category, priority, and progress status.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                  >
                    {(categories || DEFAULT_CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 pr-8 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Notes & Details
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                  placeholder="Task notes, links, or specifications..."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
