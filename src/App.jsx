import React, { useState, useEffect, useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import TodayView from './components/TodayView'
import WeeklyDashboard from './components/WeeklyDashboard'
import FocusTimer from './components/FocusTimer'
import SessionHistory from './components/SessionHistory'
import StreaksAndBadges from './components/StreaksAndBadges'
import TasksView from './components/TasksView'
import AdminDashboard from './components/AdminDashboard'
import LegalView from './components/LegalView'
import LandingView from './components/LandingView'
import ErrorBoundary from './components/ErrorBoundary'
import RandomQuote from './components/RandomQuote'
import ManualEntryModal from './components/ManualEntryModal'
import SupabaseAuthModal from './components/SupabaseAuthModal'
import { 
  loadSavedSessions, 
  saveSessions, 
  loadSavedUser, 
  saveUser,
  loadSavedActiveTimer,
  saveActiveTimer,
  loadSavedTasks,
  saveTasks
} from './utils/storage'
import { getCustomCategories, saveCustomCategories, getAllCategories } from './utils/categories'
import { getSupabaseClient } from './lib/supabase'
import { isSuperAdminUser, encodeAuthPayload, decodeAuthPayload } from './lib/auth'
import { broadcastUserTimerState } from './lib/telemetry'

const DEFAULT_TIMER_STATE = {
  seconds: 0,
  isRunning: false,
  title: '',
  category: 'frontend',
  mode: 'stopwatch',
  targetSeconds: 1500, // 25m
  startTime: null
}

const VALID_TABS = ['landing', 'today', 'tasks', 'week', 'timer', 'history', 'badges', 'admin', 'legal']

const getInitialTab = () => {
  try {
    // 1. Check URL hash first (e.g. #landing, #today, #tasks, #timer, #admin, #legal)
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim()
    if (hash && VALID_TABS.includes(hash)) {
      return hash
    }
    // 2. Check if user is logged in
    const savedUser = loadSavedUser()
    const isLoggedIn = Boolean(savedUser && savedUser.username && savedUser.username !== 'Guest_User')
    if (!isLoggedIn) {
      return 'landing'
    }
    // 3. For logged-in users, restore saved tab or default to 'today'
    const saved = localStorage.getItem('timearena_current_tab_v1')
    if (saved && VALID_TABS.includes(saved) && saved !== 'landing') {
      return saved
    }
  } catch {}
  return 'today'
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => getInitialTab())
  const [legalSection, setLegalSection] = useState('privacy')
  const [sessions, setSessions] = useState(() => loadSavedSessions(loadSavedUser()?.username))
  const [user, setUser] = useState(() => loadSavedUser())
  const [tasks, setTasks] = useState(() => loadSavedTasks(loadSavedUser()?.username))

  // Auto-redirect to today if a user logs in while on the landing page
  useEffect(() => {
    if (user && user.username && user.username !== 'Guest_User' && currentTab === 'landing') {
      setCurrentTab('today')
    }
  }, [user?.username, currentTab])

  // Ensure logged-in user credentials and recovery question are synced to Supabase profiles
  useEffect(() => {
    if (user && user.username && user.username !== 'Guest_User') {
      try {
        const accounts = JSON.parse(localStorage.getItem('timearena_local_accounts_v1') || '{}')
        const acc = accounts[user.username.toLowerCase()]
        if (acc && acc.passwordHash) {
          const supabase = getSupabaseClient()
          if (supabase) {
            supabase
              .from('profiles')
              .select('id, avatar_url')
              .ilike('username', user.username)
              .maybeSingle()
              .then(({ data: prof }) => {
                const cloudAuth = prof ? decodeAuthPayload(prof.avatar_url) : null
                if (!cloudAuth || !cloudAuth.passHash) {
                  let pass = ''
                  try { pass = atob(acc.passwordHash) } catch {}
                  if (pass) {
                    const payload = encodeAuthPayload(pass, acc.securityQuestion, acc.securityAnswer)
                    if (prof?.id) {
                      supabase
                        .from('profiles')
                        .update({ avatar_url: payload })
                        .eq('id', prof.id)
                        .then()
                    } else {
                      supabase
                        .from('profiles')
                        .insert({
                          id: acc.id || `usr-${Date.now()}`,
                          username: user.username,
                          name: acc.name || user.username,
                          avatar_url: payload,
                          streak_days: user.streakDays || 1,
                          weekly_goal_hours: user.weeklyGoalHours || 30
                        })
                        .then()
                    }
                  }
                }
              })
          }
        }
      } catch {}
    }
  }, [user?.username])

  // Persist active tab across page refreshes and keep URL hash in sync
  useEffect(() => {
    try {
      localStorage.setItem('timearena_current_tab_v1', currentTab)
      if (window.location.hash.replace(/^#\/?/, '') !== currentTab) {
        window.history.replaceState(null, '', `#${currentTab}`)
      }
    } catch {}
  }, [currentTab])

  // Browser Back/Forward navigation support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim()
      if (hash && VALID_TABS.includes(hash)) {
        setCurrentTab(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Save tasks to storage whenever they change
  useEffect(() => {
    saveTasks(tasks, user?.username)
  }, [tasks, user?.username])

  // Reload tasks and sessions when user account changes (login/logout/switch user)
  const previousUsernameRef = useRef(user?.username)
  useEffect(() => {
    if (previousUsernameRef.current !== user?.username) {
      previousUsernameRef.current = user?.username
      setTasks(loadSavedTasks(user?.username))
      setSessions(loadSavedSessions(user?.username))
    }
  }, [user?.username])

  // Theme State (Dark & Light Mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tracktime_theme') || 'dark'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#0a0d14'
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = '#fafafa'
      document.documentElement.style.colorScheme = 'light'
    }
    localStorage.setItem('tracktime_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Custom categories state & methods
  const [customCategories, setCustomCategories] = useState(() => getCustomCategories())

  const handleAddCategory = ({ name, color }) => {
    const trimmed = (name || '').trim()
    if (!trimmed) return null
    const baseId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom'
    let id = baseId
    let counter = 1
    const all = getAllCategories(customCategories)
    while (all.some(c => c.id === id)) {
      id = `${baseId}-${counter++}`
    }

    const newCat = {
      id,
      name: trimmed,
      color: color || '#f97316',
      bgClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
      isCustom: true
    }

    const updated = [...customCategories, newCat]
    setCustomCategories(updated)
    saveCustomCategories(updated)
    return newCat
  }

  const handleRemoveCategory = (idToRemove) => {
    const updated = customCategories.filter(c => c.id !== idToRemove)
    setCustomCategories(updated)
    saveCustomCategories(updated)
    if (activeTimer.category === idToRemove) {
      handleUpdateTimerMeta({ category: 'frontend' })
    }
  }

  const allCategories = getAllCategories(customCategories)

  // Guard: ONLY Harsh_admin can access the Admin Console
  useEffect(() => {
    if (currentTab === 'admin' && !isSuperAdminUser(user)) {
      setCurrentTab('today')
      window.history.replaceState(null, '', '#today')
    }
  }, [currentTab, user])

  // Modal states
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Active Timer state (Persisted in localStorage across page reloads/refreshes)
  const [activeTimer, setActiveTimer] = useState(() => {
    const saved = loadSavedActiveTimer()
    return saved || DEFAULT_TIMER_STATE
  })

  // Timer interval reference
  const timerRef = useRef(null)
  const lastTickRef = useRef(Date.now())

  // Auto-save timer state to localStorage whenever it changes
  useEffect(() => {
    saveActiveTimer(activeTimer)
  }, [activeTimer])

  // Save active timer before unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveActiveTimer(activeTimer)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [activeTimer])

  // Timer runner with accurate timestamp calculation
  useEffect(() => {
    if (activeTimer.isRunning) {
      lastTickRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const delta = Math.floor((now - lastTickRef.current) / 1000)
        if (delta >= 1) {
          lastTickRef.current = now
          setActiveTimer(prev => {
            const nextSecs = prev.seconds + delta
            // If in pomodoro mode and target reached
            if (prev.mode === 'pomodoro' && nextSecs >= prev.targetSeconds) {
              return { ...prev, seconds: prev.targetSeconds, isRunning: false }
            }
            return { ...prev, seconds: nextSecs }
          })
        }
      }, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeTimer.isRunning])

  // Save sessions to storage whenever they change
  useEffect(() => {
    saveSessions(sessions, user?.username)
  }, [sessions, user?.username])

  // Save user to storage whenever changed
  useEffect(() => {
    saveUser(user)
  }, [user])

  // Broadcast live timer telemetry across browsers & Supabase Realtime
  useEffect(() => {
    if (!user || !user.username) return
    broadcastUserTimerState(user, activeTimer)

    let interval = null
    if (activeTimer.isRunning) {
      interval = setInterval(() => {
        broadcastUserTimerState(user, activeTimer)
      }, 2500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user, activeTimer.isRunning, activeTimer.title, activeTimer.category, Math.floor(activeTimer.seconds / 3)])

  // Offline / Unload broadcast
  useEffect(() => {
    const handleUnload = () => {
      if (user?.username) {
        broadcastUserTimerState(user, { ...activeTimer, isRunning: false })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [user, activeTimer])

  // Supabase Auth listener (username-only mapping, no email leak)
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const rawUsername = session.user.user_metadata?.username || session.user.user_metadata?.full_name || 'User'
        const cleanUsername = rawUsername.replace(/@.*$/, '')
        const isAdmin = isSuperAdminUser(cleanUsername)
        setUser(prev => {
          if (prev?.id === session.user.id && prev?.username === cleanUsername && prev?.isAdmin === isAdmin) {
            return prev
          }
          return {
            ...prev,
            id: session.user.id,
            username: cleanUsername,
            name: cleanUsername,
            isAdmin: isAdmin,
            avatarUrl: session.user.user_metadata?.avatar_url || prev?.avatarUrl
          }
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const rawUsername = session.user.user_metadata?.username || session.user.user_metadata?.full_name || 'User'
        const cleanUsername = rawUsername.replace(/@.*$/, '')
        const isAdmin = isSuperAdminUser(cleanUsername)
        setUser(prev => {
          if (prev?.id === session.user.id && prev?.username === cleanUsername && prev?.isAdmin === isAdmin) {
            return prev
          }
          return {
            ...prev,
            id: session.user.id,
            username: cleanUsername,
            name: cleanUsername,
            isAdmin: isAdmin,
            avatarUrl: session.user.user_metadata?.avatar_url || prev?.avatarUrl
          }
        })
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Timer Control actions
  const handleStartTimer = () => {
    setActiveTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: prev.startTime || new Date().toISOString()
    }))
  }

  const handlePauseTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: false }))
  }

  const handleResumeTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: true }))
  }

  const handleResetTimer = () => {
    setActiveTimer(prev => ({
      ...prev,
      seconds: 0,
      isRunning: false,
      startTime: null
    }))
  }

  const handleUpdateTimerMeta = (meta) => {
    setActiveTimer(prev => ({ ...prev, ...meta }))
  }

  // Live sync task from Timer page to Tasks backlog
  const handleSaveTaskFromTimer = ({ title, category, status = 'todo' }) => {
    const trimmed = (title || '').trim()
    if (!trimmed) return
    setTasks(prev => {
      const idx = prev.findIndex(t => t.title?.toLowerCase() === trimmed.toLowerCase())
      if (idx >= 0) {
        return prev.map((t, i) => i === idx ? {
          ...t,
          category: category || t.category,
          status: status || t.status
        } : t)
      } else {
        const newTask = {
          id: `task-${Date.now()}`,
          title: trimmed,
          category: category || 'frontend',
          priority: 'medium',
          status: status || 'todo',
          notes: 'Added from Focus Timer',
          createdAt: new Date().toISOString(),
          completedAt: status === 'completed' ? new Date().toISOString() : null
        }
        return [newTask, ...prev]
      }
    })
  }

  // 1-Click Launch Timer for a specific Task
  const handleStartTaskTimer = ({ title, category }) => {
    setActiveTimer(prev => ({
      ...prev,
      title: title || 'Focus Session',
      category: category || 'frontend',
      isRunning: true,
      startTime: new Date().toISOString()
    }))
    setCurrentTab('timer')
  }

  // Save completed session from timer
  const handleSaveTimerSession = (sessionData) => {
    const now = new Date()
    const startTime = activeTimer.startTime 
      ? new Date(activeTimer.startTime) 
      : new Date(now.getTime() - sessionData.durationSeconds * 1000)

    const newSession = {
      id: `session-${Date.now()}`,
      title: sessionData.title || 'Focus Session',
      category: sessionData.category || 'frontend',
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      durationSeconds: sessionData.durationSeconds,
      notes: `Logged via Track Timer ${sessionData.mode === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}`,
      completed: true
    }

    setSessions(prev => [newSession, ...prev])
    handleResetTimer()

    // Sync task completion or record in tasks backlog
    if (sessionData.title && sessionData.title.trim()) {
      const taskTitle = sessionData.title.trim()
      setTasks(prev => {
        const idx = prev.findIndex(t => t.title?.toLowerCase() === taskTitle.toLowerCase())
        if (idx >= 0) {
          return prev.map((t, i) => i === idx ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t)
        } else {
          return [{
            id: `task-${Date.now()}`,
            title: taskTitle,
            category: sessionData.category || 'frontend',
            priority: 'medium',
            status: 'completed',
            notes: 'Completed via Focus Timer',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }, ...prev]
        }
      })
    }

    // Sync with Supabase if client is ready
    syncSessionToSupabase(newSession)

    // Return to weekly dashboard to view logged session
    setCurrentTab('week')
  }

  // Save manual entry session
  const handleSaveManualSession = (sessionData) => {
    const newSession = {
      id: `manual-${Date.now()}`,
      ...sessionData
    }
    setSessions(prev => [newSession, ...prev])
    syncSessionToSupabase(newSession)
  }

  // Sync to Supabase helper
  const syncSessionToSupabase = async (session) => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const effectiveUserId = authUser?.id || user?.id || user?.username
      if (effectiveUserId) {
        await supabase.from('time_sessions').insert([{
          user_id: effectiveUserId,
          title: session.title,
          category: session.category,
          start_time: session.startTime,
          end_time: session.endTime,
          duration_seconds: session.durationSeconds,
          notes: session.notes,
          completed: true
        }])
      }
    } catch (e) {
      console.warn('Could not sync session to Supabase', e)
    }
  }

  // Delete single session
  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  // Clear all sessions
  const handleClearSessions = () => {
    setSessions([])
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex font-sans overflow-x-hidden w-full transition-colors duration-200">
      
      {/* Desktop Left Sidebar (>= 1024px) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeTimer={activeTimer}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        sessionsCount={sessions.length}
        tasksCount={tasks.length}
      />

      {/* Main Content Area Column (Takes remaining width & scrolls independently on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen lg:overflow-y-auto">
        
        {/* Clean Top Navbar Header */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          activeTimer={activeTimer}
          user={user}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenTimer={() => setCurrentTab('timer')}
        />

        {/* Main View Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-0 flex flex-col items-center">
          <div className="w-full">
            {currentTab === 'today' && (
              <TodayView
                sessions={sessions}
                tasks={tasks}
                activeTimer={activeTimer}
                categories={allCategories}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResumeTimer={handleResumeTimer}
                onSaveTimerSession={handleSaveTimerSession}
                onUpdateTimerMeta={handleUpdateTimerMeta}
                onOpenManualEntry={() => setIsManualModalOpen(true)}
                onDeleteSession={handleDeleteSession}
                user={user}
                onNavigateToTimer={() => setCurrentTab('timer')}
                onNavigateToTasks={() => setCurrentTab('tasks')}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                setTasks={setTasks}
                sessions={sessions}
                categories={allCategories}
                onAddCategory={handleAddCategory}
                activeTimer={activeTimer}
                onStartTaskTimer={handleStartTaskTimer}
                onNavigateToTimer={() => setCurrentTab('timer')}
              />
            )}

            {currentTab === 'week' && (
              <WeeklyDashboard
                sessions={sessions}
                activeTimer={activeTimer}
                categories={allCategories}
                onDeleteSession={handleDeleteSession}
                onOpenManualEntry={() => setIsManualModalOpen(true)}
                onStartTimer={() => {
                  setCurrentTab('timer')
                  if (!activeTimer.isRunning && activeTimer.seconds === 0) {
                    handleStartTimer()
                  }
                }}
                onPauseTimer={handlePauseTimer}
                onResumeTimer={handleResumeTimer}
                onSaveTimerSession={handleSaveTimerSession}
                onUpdateTimerMeta={handleUpdateTimerMeta}
                user={user}
              />
            )}

            {currentTab === 'timer' && (
              <FocusTimer
                sessions={sessions}
                tasks={tasks}
                activeTimer={activeTimer}
                categories={allCategories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onSaveTaskToBacklog={handleSaveTaskFromTimer}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onResume={handleResumeTimer}
                onReset={handleResetTimer}
                onSaveSession={handleSaveTimerSession}
                onUpdateTimerMeta={handleUpdateTimerMeta}
                onClose={() => setCurrentTab('today')}
              />
            )}

            {currentTab === 'history' && (
              <SessionHistory
                sessions={sessions}
                categories={allCategories}
                onDeleteSession={handleDeleteSession}
                onClearAll={handleClearSessions}
              />
            )}

            {currentTab === 'badges' && (
              <StreaksAndBadges
                sessions={sessions}
                user={user}
              />
            )}

            {currentTab === 'admin' && isSuperAdminUser(user) && (
              <ErrorBoundary onResetTab={setCurrentTab}>
                <AdminDashboard
                  user={user}
                  activeTimer={activeTimer}
                  sessions={sessions}
                />
              </ErrorBoundary>
            )}
            {currentTab === 'landing' && (
              <LandingView
                user={user}
                categories={allCategories}
                onNavigateToToday={() => setCurrentTab('today')}
                onNavigateToTimer={() => setCurrentTab('timer')}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onStartQuickSession={(title, category) => {
                  handleUpdateTimerMeta({ title, category })
                  setCurrentTab('timer')
                  if (!activeTimer.isRunning) {
                    handleStartTimer()
                  }
                }}
              />
            )}

            {currentTab === 'legal' && (
              <LegalView
                initialTab={legalSection}
                onNavigateBack={() => setCurrentTab('today')}
              />
            )}
          </div>

          {/* Random Motivational Quote from FreeAPI */}
          <RandomQuote />
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-white/5 py-6 mb-20 lg:mb-0 bg-white dark:bg-[#0c101a] text-center text-xs text-zinc-500 dark:text-slate-400 transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (user && user.username && user.username !== 'Guest_User') {
                    setCurrentTab('today')
                  } else {
                    setCurrentTab('landing')
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="font-bold text-zinc-800 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Track Timer
              </button>
              <span>•</span>
              <span>Personal Focus & Productivity Engine</span>
            </div>
            
            {/* Landing, Privacy Policy & Terms of Use Links */}
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => {
                  setCurrentTab('landing')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-zinc-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium underline transition-colors"
              >
                Overview
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalSection('privacy')
                  setCurrentTab('legal')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-zinc-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium underline transition-colors"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setLegalSection('terms')
                  setCurrentTab('legal')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-zinc-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium underline transition-colors"
              >
                Terms of Use
              </button>
            </div>

            <div>
              Built with React, Vite, Tailwind CSS & Supabase
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 mt-2.5 text-[11px] text-zinc-400 dark:text-slate-500">
            Inspired by <a href="https://timearena.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 dark:hover:text-orange-400 underline transition-colors">TimeArena</a> • Built by a student at ChaiCode • Color palette inspired by <a href="https://ui.chaicode.com/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 dark:hover:text-orange-400 underline transition-colors">ChaiUI</a>
          </div>
        </footer>

      </div>

      {/* Floating Theme Switcher Button (Bottom Right) */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-30 p-3 rounded-2xl bg-white/90 dark:bg-[#15171e]/90 hover:bg-zinc-100 dark:hover:bg-[#1e2029] border border-zinc-200 dark:border-white/15 text-zinc-800 dark:text-amber-400 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group backdrop-blur-lg"
        title={`Switch to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-orange-600 group-hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* Mobile & Tablet Bottom Navigation Bar (< 1024px) */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeTimer={activeTimer}
        user={user}
      />

      {/* Modals */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        categories={allCategories}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveManualSession}
      />

      <SupabaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        setUser={setUser}
        onAuthSuccess={(remoteSessions) => {
          if (remoteSessions && remoteSessions.length > 0) {
            setSessions(remoteSessions)
          }
        }}
      />

    </div>
  )
}
