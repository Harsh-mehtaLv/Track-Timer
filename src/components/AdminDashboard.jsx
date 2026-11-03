import React, { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Database, 
  Search, 
  Download, 
  RefreshCw, 
  Zap, 
  Server,
  Layers,
  Sparkles,
  UserPlus,
  Trash2,
  Lock,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Key,
  ShieldAlert,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { formatDuration, formatTimerDisplay } from '../utils/formatters'
import { getCategoryById } from '../utils/categories'
import { getSupabaseClient, saveSupabaseConfig, SUPABASE_SCHEMA_SQL } from '../lib/supabase'
import { subscribeToTelemetry } from '../lib/telemetry'
import { 
  isSuperAdminUser, 
  adminCreateUser, 
  adminDeleteUser, 
  adminGetLocalAccounts,
  validatePasswordComplexity
} from '../lib/auth'

// Set of dummy test usernames to permanently purge
const DUMMY_USERNAMES = new Set([
  'hitesh_dev',
  'ananya_react',
  'vikram_dsa',
  'priya_cloud',
  'arjun_sys',
  'neha_cohort'
])

export default function AdminDashboard({ user, activeTimer, sessions = [] }) {
  // --- Managed Users State (Persisted in localStorage, zero dummy users) ---
  const [managedUsers, setManagedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('timearena_admin_managed_users_v1')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Purge all dummy seed users
          const clean = parsed.filter(u => 
            u && u.username && 
            !DUMMY_USERNAMES.has(u.username.toLowerCase()) && 
            u.username.toLowerCase() !== 'harsh_admin' &&
            !u.id?.startsWith('u-')
          )
          localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(clean))
          return clean
        }
      }
    } catch {
      // fallback
    }

    // Load any real local accounts created via signup or admin
    const localAccounts = adminGetLocalAccounts()
    const realAccounts = localAccounts
      .filter(a => a && a.username && a.username.toLowerCase() !== 'harsh_admin' && !DUMMY_USERNAMES.has(a.username.toLowerCase()))
      .map(a => ({
        id: a.id || `usr-${Date.now()}`,
        username: a.username,
        name: a.name || a.username,
        role: a.role || 'Student Builder',
        isTimerRunning: false,
        activeTask: null,
        activeCategory: 'frontend',
        activeSeconds: 0,
        totalSeconds: 0,
        sessionsCount: 0,
        streakDays: a.streakDays || 1,
        lastActive: 'Offline',
        joinedDate: a.joinedDate || 'Recent',
        databaseEngine: a.databaseEngine || 'Supabase PostgreSQL'
      }))

    localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(realAccounts))
    return realAccounts
  })

  // Persist managed users changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(managedUsers))
    } catch {
      // ignore
    }
  }, [managedUsers])

  // --- Live Multi-Browser Telemetry & Supabase Sync ---
  const [liveTelemetry, setLiveTelemetry] = useState({})
  const [dbSessionsCount, setDbSessionsCount] = useState(0)
  const [dbTotalSeconds, setDbTotalSeconds] = useState(0)

  // Fetch all registered users & session metrics from Supabase PostgreSQL
  const loadRemoteData = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      // 1. Fetch profiles registered in Supabase
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })

      // 2. Fetch completed sessions logged in Supabase
      const { data: dbSessions, error: sErr } = await supabase
        .from('time_sessions')
        .select('*')

      if (dbSessions && Array.isArray(dbSessions)) {
        const total = dbSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
        setDbTotalSeconds(total)
        setDbSessionsCount(dbSessions.length)
      }

      if (profiles && Array.isArray(profiles)) {
        // Calculate session statistics per user
        const sessionStatsByUser = {}
        if (dbSessions && Array.isArray(dbSessions)) {
          dbSessions.forEach(s => {
            const key = (s.user_id || '').toLowerCase()
            if (!sessionStatsByUser[key]) {
              sessionStatsByUser[key] = { totalSecs: 0, count: 0 }
            }
            sessionStatsByUser[key].totalSecs += (s.duration_seconds || 0)
            sessionStatsByUser[key].count += 1
          })
        }

        setManagedUsers(prev => {
          const prevMap = new Map(prev.map(u => [u.username.toLowerCase(), u]))

          const remoteUsers = profiles
            .filter(p => p.username && p.username.toLowerCase() !== 'harsh_admin' && !DUMMY_USERNAMES.has(p.username.toLowerCase()))
            .map(p => {
              const uKey = p.username.toLowerCase()
              const prevU = prevMap.get(uKey) || {}
              const stats = sessionStatsByUser[p.id?.toLowerCase()] || sessionStatsByUser[uKey] || { totalSecs: 0, count: 0 }
              const joined = p.updated_at 
                ? new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : (prevU.joinedDate || 'Recent')

              return {
                id: p.id || `usr-${p.username}`,
                username: p.username,
                name: p.name || p.username,
                role: prevU.role || 'Student Builder',
                streakDays: p.streak_days || prevU.streakDays || 1,
                weeklyGoalHours: p.weekly_goal_hours || prevU.weeklyGoalHours || 30,
                totalSeconds: Math.max(stats.totalSecs, prevU.totalSeconds || 0),
                sessionsCount: Math.max(stats.count, prevU.sessionsCount || 0),
                joinedDate: joined,
                databaseEngine: 'Supabase PostgreSQL',
                lastActive: prevU.lastActive || 'Offline'
              }
            })

          // Retain local-only users created offline if any
          const remoteSet = new Set(remoteUsers.map(u => u.username.toLowerCase()))
          const localOnly = prev.filter(u => 
            !remoteSet.has(u.username.toLowerCase()) && 
            u.username.toLowerCase() !== 'harsh_admin' && 
            !DUMMY_USERNAMES.has(u.username.toLowerCase())
          )

          const merged = [...remoteUsers, ...localOnly]
          try {
            localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(merged))
          } catch {}
          return merged
        })
      }
    } catch (err) {
      console.warn('Error fetching Supabase data in AdminDashboard:', err)
    }
  }

  // Subscribe to live multi-browser timer telemetry & Supabase changes
  useEffect(() => {
    // Initial fetch
    loadRemoteData()

    // 1. Live timer state updates from any browser / tab
    const unsubTelemetry = subscribeToTelemetry((latestMap) => {
      setLiveTelemetry(latestMap)
    })

    // 2. Periodic sync every 4 seconds to guarantee up-to-date user directory
    const pollInterval = setInterval(() => {
      loadRemoteData()
    }, 4000)

    // 3. Supabase Realtime Postgres Changes on profiles
    let realtimeChannel = null
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const chanName = `admin-profiles-sync-${Date.now()}`
        realtimeChannel = supabase.channel(chanName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            loadRemoteData()
          })
          .subscribe()
      } catch (e) {
        console.warn('Profiles realtime error:', e)
      }
    }

    return () => {
      unsubTelemetry()
      clearInterval(pollInterval)
      if (realtimeChannel && supabase) {
        try {
          supabase.removeChannel(realtimeChannel)
        } catch {}
      }
    }
  }, [])

  // --- Table Filters & Search ---
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'offline'
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notification, setNotification] = useState('')

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3500)
  }

  // --- Supabase Cloud Database Configuration State ---
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return import.meta.env.VITE_SUPABASE_URL || 
      JSON.parse(localStorage.getItem('timearena_supabase_config') || '{}').url || ''
  })
  const [supabaseKey, setSupabaseKey] = useState(() => {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || 
      JSON.parse(localStorage.getItem('timearena_supabase_config') || '{}').key || ''
  })

  const [isSavingDb, setIsSavingDb] = useState(false)
  const [dbSuccessMsg, setDbSuccessMsg] = useState('')
  const [dbErrorMsg, setDbErrorMsg] = useState('')
  const [isTestingDb, setIsTestingDb] = useState(false)
  const [dbTestResult, setDbTestResult] = useState(null) // { success: boolean, msg: string }
  const [showSqlSchema, setShowSqlSchema] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  // Save Supabase Configuration permanently
  const handleSaveDatabaseConfig = async (e) => {
    e.preventDefault()
    setDbErrorMsg('')
    setDbSuccessMsg('')
    setDbTestResult(null)

    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setDbErrorMsg('Please enter both Supabase Project URL and Public Anon Key.')
      return
    }

    setIsSavingDb(true)
    const ok = await saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim())
    setIsSavingDb(false)

    if (ok) {
      setDbSuccessMsg('Supabase connected! Credentials saved to application (.env.local & storage).')
      showNotification('Database configuration updated and active for application!')
      setTimeout(() => setDbSuccessMsg(''), 4000)
    } else {
      setDbErrorMsg('Failed to save Supabase configuration. Please check the values.')
    }
  }

  // Test live connection to Supabase
  const handleTestDatabaseConnection = async () => {
    setIsTestingDb(true)
    setDbTestResult(null)

    const supabase = getSupabaseClient()
    if (!supabase) {
      setIsTestingDb(false)
      setDbTestResult({ success: false, msg: 'Supabase client not initialized. Save URL and Key first.' })
      return
    }

    try {
      const startTime = Date.now()
      const { count, error } = await supabase
        .from('time_sessions')
        .select('*', { count: 'exact', head: true })

      const latency = Date.now() - startTime

      if (error) {
        setDbTestResult({ 
          success: false, 
          msg: `Connected, but received: ${error.message}. (Ensure tables are created with SQL Schema below).` 
        })
      } else {
        setDbTestResult({ 
          success: true, 
          msg: `Online & Healthy! PostgreSQL responded in ${latency}ms (${count ?? 0} sessions stored).` 
        })
      }
    } catch (err) {
      setDbTestResult({ success: false, msg: `Connection error: ${err.message}` })
    } finally {
      setIsTestingDb(false)
    }
  }

  const handleCopySchemaSql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2500)
  }

  // --- Add User Modal State ---
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showAdminDbKey, setShowAdminDbKey] = useState(false)
  const [newRole, setNewRole] = useState('Student Builder')
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('30')
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  // Handle Add User Form Submission
  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    setAddUserError('')

    if (!newUsername.trim()) {
      setAddUserError('Please provide a username.')
      return
    }
    const pwdCheck = validatePasswordComplexity(newPassword)
    if (!pwdCheck.isValid) {
      setAddUserError(pwdCheck.error)
      return
    }

    setAddUserLoading(true)
    const res = await adminCreateUser({
      username: newUsername,
      name: newName || newUsername,
      password: newPassword,
      role: newRole,
      weeklyGoalHours: Number(newWeeklyGoal) || 30
    })
    setAddUserLoading(false)

    if (res.error) {
      setAddUserError(res.error)
      return
    }

    // Add to managed users list
    setManagedUsers(prev => [res.user, ...prev])
    loadRemoteData()
    showNotification(`User @${res.user.username} created successfully!`)
    setIsAddUserModalOpen(false)
    setNewUsername('')
    setNewName('')
    setNewPassword('')
    setNewRole('Student Builder')
    setNewWeeklyGoal('30')
  }

  // --- Delete User Confirmation State ---
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Confirm and Execute User Deletion
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return

    setDeleteLoading(true)
    const res = await adminDeleteUser(userToDelete.username, userToDelete.id)
    setDeleteLoading(false)

    if (res.error) {
      alert(res.error)
      return
    }

    setManagedUsers(prev => prev.filter(u => u.username?.toLowerCase() !== userToDelete.username?.toLowerCase()))
    showNotification(`User @${userToDelete.username} removed from the platform.`)
    setUserToDelete(null)
    await loadRemoteData()
  }

  // --- Combine Harsh_admin + real registered users with live telemetry ---
  const platformUsers = useMemo(() => {
    const isCurrentHarshAdmin = user?.username?.toLowerCase() === 'harsh_admin'
    const isTimerRunning = Boolean(activeTimer?.isRunning)

    // Admin's live telemetry (if admin is running locally or in another tab)
    const adminTelemetry = liveTelemetry['harsh_admin'] || {}
    const adminTimerRunning = isCurrentHarshAdmin ? isTimerRunning : Boolean(adminTelemetry.isTimerRunning)

    const harshAdminEntry = {
      id: 'u-current-harsh-admin',
      username: 'Harsh_admin',
      name: 'Harsh (Admin)',
      role: 'Super Admin / Platform Owner',
      isCurrent: isCurrentHarshAdmin,
      isTimerRunning: adminTimerRunning,
      activeTask: adminTimerRunning 
        ? (isCurrentHarshAdmin ? (activeTimer?.title || 'Active Focus Session') : (adminTelemetry.activeTask || 'Active Focus Session'))
        : null,
      activeCategory: isCurrentHarshAdmin ? (activeTimer?.category || 'frontend') : (adminTelemetry.activeCategory || 'frontend'),
      activeSeconds: adminTimerRunning 
        ? (isCurrentHarshAdmin ? (activeTimer?.seconds || 0) : (adminTelemetry.activeSeconds || 0))
        : 0,
      totalSeconds: sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) + (adminTimerRunning ? (isCurrentHarshAdmin ? activeTimer.seconds : (adminTelemetry.activeSeconds || 0)) : 0),
      sessionsCount: sessions.length,
      streakDays: user?.streakDays || 42,
      lastActive: adminTimerRunning ? 'Active now' : 'Online',
      joinedDate: 'Oct 2026',
      databaseEngine: supabaseUrl ? 'Supabase PostgreSQL' : 'Local Storage'
    }

    // Map each registered builder with their live telemetry from ANY browser
    const realOthers = (Array.isArray(managedUsers) ? managedUsers : []).filter(u => 
      u && typeof u.username === 'string' &&
      u.username.toLowerCase() !== 'harsh_admin' && 
      !DUMMY_USERNAMES.has(u.username.toLowerCase())
    ).map(u => {
      const uKey = (u.username || '').toLowerCase()
      const live = (liveTelemetry && liveTelemetry[uKey]) || {}
      const isRunning = Boolean(live && live.isTimerRunning)

      return {
        ...u,
        username: u.username || 'User',
        name: u.name || u.username || 'Builder',
        isTimerRunning: isRunning,
        activeTask: isRunning ? (live.activeTask || 'Focus Session') : null,
        activeCategory: isRunning ? (live.activeCategory || 'frontend') : (u.activeCategory || 'frontend'),
        activeSeconds: isRunning ? (live.activeSeconds || 0) : 0,
        totalSeconds: (u.totalSeconds || 0) + (isRunning ? (live.activeSeconds || 0) : 0),
        lastActive: isRunning ? 'Active now' : (u.lastActive || 'Offline')
      }
    })

    return [harshAdminEntry, ...realOthers]
  }, [user, activeTimer, sessions, managedUsers, supabaseUrl, liveTelemetry])

  // Live active timers right now
  const liveActiveUsers = useMemo(() => {
    return platformUsers.filter(u => u && u.isTimerRunning)
  }, [platformUsers])

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return platformUsers.filter(u => {
      if (!u || !u.username) return false
      const uname = (u.username || '').toLowerCase()
      const name = (u.name || '').toLowerCase()
      const task = (u.activeTask || '').toLowerCase()
      const search = (searchTerm || '').toLowerCase()
      const matchSearch = uname.includes(search) || name.includes(search) || task.includes(search)
      const matchStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.isTimerRunning) || 
                          (statusFilter === 'offline' && !u.isTimerRunning)
      return matchSearch && matchStatus
    })
  }, [platformUsers, searchTerm, statusFilter])

  // Aggregate metrics
  const totalPlatformSeconds = useMemo(() => {
    const fromUsers = platformUsers.reduce((acc, u) => acc + (u?.totalSeconds || 0), 0)
    return Math.max(fromUsers, dbTotalSeconds)
  }, [platformUsers, dbTotalSeconds])

  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadRemoteData()
    setLastRefreshed(new Date())
    setIsRefreshing(false)
    showNotification('Telemetry refreshed!')
  }

  // STRICT GATE: Only Harsh_admin can view the Admin Console (Evaluated AFTER all hooks)
  if (!isSuperAdminUser(user)) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Admin Console Restricted
        </h2>
        <p className="text-sm text-zinc-500 dark:text-slate-400">
          This telemetry and user directory console is strictly reserved for the Super Admin (<strong>Harsh_admin</strong>).
        </p>
      </div>
    )
  }

  // Export User Directory to CSV
  const handleExportUsersCSV = () => {
    const headers = ['Username', 'Name', 'Role', 'Status', 'Active Task', 'Total Focus Time', 'Total Sessions', 'Streak (Days)', 'Database Engine', 'Joined Date']
    const rows = platformUsers.map(u => [
      `"${u.username}"`,
      `"${u.name}"`,
      `"${u.role}"`,
      `"${u.isTimerRunning ? 'Active Timer' : 'Offline'}"`,
      `"${(u.activeTask || '').replace(/"/g, '""')}"`,
      `"${formatDuration(u.totalSeconds)}"`,
      u.sessionsCount,
      u.streakDays,
      `"${u.databaseEngine}"`,
      `"${u.joinedDate}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `track-timer-admin-telemetry-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full max-w-7xl mx-auto">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-3.5 rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-500/25 flex items-center space-x-2 text-xs font-semibold animate-slideDown">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Console • Harsh_admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            User Management & Supabase Control
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 max-w-2xl">
            You have full administrator privileges to add users, remove users, monitor live active timers, and configure cloud database credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 shadow-sm transition-colors"
            title="Refresh active telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportUsersCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Live Active Timers */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Live Active Timers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {liveActiveUsers.length}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Running right now</span>
          </span>
        </div>

        {/* KPI 2: Total Registered Users */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {platformUsers.length}
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-1 block">
            {platformUsers.length === 1 ? 'Super Admin only (Harsh_admin)' : `${platformUsers.length - 1} registered builder(s)`}
          </span>
        </div>

        {/* KPI 3: Total Platform Focus */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Focus Time</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
            {(totalPlatformSeconds / 3600).toFixed(1)}h
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-slate-400 font-medium mt-1 block">
            Across all logged sessions
          </span>
        </div>

        {/* KPI 4: Cloud Database Status */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cloud Database</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate">
            {isSupabaseConfigured ? 'PostgreSQL' : 'Local Mode'}
          </div>
          <span className={`text-[11px] font-semibold mt-1 flex items-center space-x-1 ${
            isSupabaseConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            <span>{isSupabaseConfigured ? '🟢 Connected' : '🟡 Offline'}</span>
          </span>
        </div>

      </div>

      {/* Supabase Cloud Database Management Section (ONLY FOR SUPER ADMIN) */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-100 dark:border-white/5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <div className="flex items-center space-x-1.5">
                <Database className="w-4 h-4" />
                <span>Admin Cloud Database Controls</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold whitespace-nowrap">
                Admin Only
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Supabase PostgreSQL Connection & Sync
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
              Saved here into the application. Regular users and visitors cannot view or alter these database credentials.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleTestDatabaseConnection}
              disabled={isTestingDb || !isSupabaseConfigured}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 transition-colors disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : 'text-emerald-500'}`} />
              <span>{isTestingDb ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-slate-200 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-orange-500" />
              <span>{showSqlSchema ? 'Hide SQL' : 'SQL Schema'}</span>
            </button>
          </div>
        </div>

        {/* Database Alerts */}
        {dbSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{dbSuccessMsg}</span>
          </div>
        )}

        {dbErrorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{dbErrorMsg}</span>
          </div>
        )}

        {dbTestResult && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center space-x-2 ${
            dbTestResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}>
            {dbTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{dbTestResult.msg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveDatabaseConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                Supabase Public Anon API Key
              </label>
              <div className="relative">
                <input
                  type={showAdminDbKey ? "text" : "password"}
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminDbKey(!showAdminDbKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  title={showAdminDbKey ? "Hide key" : "Show key"}
                >
                  {showAdminDbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500 dark:text-slate-400">
              Credentials persist in application runtime and sync seamlessly for your account.
            </span>

            <button
              type="submit"
              disabled={isSavingDb}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSavingDb ? 'Saving...' : 'Save & Sync to App'}
            </button>
          </div>
        </form>

        {/* Collapsible Supabase SQL Schema */}
        {showSqlSchema && (
          <div className="mt-5 p-4 rounded-2xl bg-zinc-50 dark:bg-[#080b11] border border-zinc-200 dark:border-white/10 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-orange-500" />
                <span>Supabase PostgreSQL Schema Setup:</span>
              </span>
              <button
                type="button"
                onClick={handleCopySchemaSql}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-white/15 transition-colors"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-zinc-800 dark:text-slate-300 overflow-x-auto p-3 bg-white dark:bg-[#0c101a] rounded-xl border border-zinc-200 dark:border-white/5 max-h-48">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* Live Active Timers Watcher Card (Real-Time Live Feed) */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Live Active Focus Timers Right Now ({liveActiveUsers.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500 dark:text-slate-400">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {liveActiveUsers.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-zinc-50 dark:bg-[#0d1017] border border-dashed border-zinc-200 dark:border-white/10">
            <Activity className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-slate-300">
              No live active timers running right now
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-slate-500 mt-0.5">
              When you or registered builders start a focus timer, their real-time session will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveActiveUsers.map(u => {
              const cat = getCategoryById(u.activeCategory)
              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#0d1017] border border-zinc-200 dark:border-white/5 relative overflow-hidden transition-all group shadow-sm hover:border-orange-500/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white block">
                          @{u.username} {u.isCurrent && <span className="text-orange-500 font-semibold">(You)</span>}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400">{u.role}</span>
                      </div>
                    </div>

                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Live</span>
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${cat.bgClass}`}>
                        {cat.name}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {u.activeTask || 'Focus Session'}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500 dark:text-slate-400">Current Session:</span>
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                      {formatTimerDisplay(u.activeSeconds)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Registered Users Directory & Management Table */}
      <div className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>User Directory & Permission Management</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
              Add new user accounts or remove access with administrator controls
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search username or task..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 pr-8 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-slate-300 outline-none focus:border-orange-500"
            >
              <option value="all">All Users ({platformUsers.length})</option>
              <option value="active">Active Timers ({liveActiveUsers.length})</option>
              <option value="offline">Idle / Offline ({platformUsers.length - liveActiveUsers.length})</option>
            </select>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">User / Builder</th>
                <th className="pb-3 px-3">Live Status</th>
                <th className="pb-3 px-3">Active / Recent Task</th>
                <th className="pb-3 px-3">Total Focus</th>
                <th className="pb-3 px-3">Sessions</th>
                <th className="pb-3 px-3">Streak</th>
                <th className="pb-3 px-2">Engine</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filteredUsers.map(u => {
                const isSuperAdmin = u.username.toLowerCase() === 'harsh_admin' || u.isCurrent

                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* User Column */}
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-zinc-900 dark:text-white block truncate">
                              @{u.username}
                            </span>
                            {isSuperAdmin && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 dark:text-slate-400 truncate block">
                            {u.name} • {u.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Live Status */}
                    <td className="py-3.5 px-3">
                      {u.isTimerRunning ? (
                        <div className="flex flex-col space-y-0.5">
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider animate-pulse w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Timer Running</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold pl-1">
                            {formatTimerDisplay(u.activeSeconds)}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 text-[10px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          <span>{u.lastActive}</span>
                        </span>
                      )}
                    </td>

                    {/* Active Task */}
                    <td className="py-3.5 px-3 max-w-[200px]">
                      <span className="text-zinc-800 dark:text-slate-200 truncate block font-medium">
                        {u.activeTask || '—'}
                      </span>
                    </td>

                    {/* Total Focus */}
                    <td className="py-3.5 px-3 font-mono font-bold text-zinc-900 dark:text-white">
                      {formatDuration(u.totalSeconds)}
                    </td>

                    {/* Sessions Count */}
                    <td className="py-3.5 px-3 font-mono text-zinc-700 dark:text-slate-300">
                      {u.sessionsCount}
                    </td>

                    {/* Streak */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{u.streakDays}d</span>
                      </span>
                    </td>

                    {/* Engine */}
                    <td className="py-3.5 px-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-400 font-medium">
                        {u.databaseEngine?.includes('Supabase') ? 'PostgreSQL' : 'Local'}
                      </span>
                    </td>

                    {/* Actions Column (Remove User) */}
                    <td className="py-3.5 pr-2 text-right">
                      {isSuperAdmin ? (
                        <span 
                          className="inline-flex items-center space-x-1 text-[10px] text-zinc-400 dark:text-slate-500 font-medium px-2 py-1"
                          title="Super Admin cannot be deleted"
                        >
                          <Lock className="w-3 h-3 text-orange-500" />
                          <span>Protected</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={`Remove @${u.username}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal 1: Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pr-8">
              <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Admin Provisioning</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Add New User Account
              </h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                Create user login credentials with username and password.
              </p>
            </div>

            {addUserError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Username (Required)
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. arun_kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Password (Required)
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter login password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    title={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Conditions & Disclaimer with Example */}
                <div className="mt-2 p-2.5 rounded-xl bg-orange-500/5 dark:bg-white/[0.03] border border-orange-500/20 text-[10px] space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-orange-600 dark:text-orange-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Password Complexity Requirements:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <div className={`flex items-center space-x-1 ${newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                      <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
                      <span>Min 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                      <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                      <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                      <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`col-span-2 flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? '✓' : '○'}</span>
                      <span>1 Special character (e.g. !@#$%^&*)</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-zinc-200/60 dark:border-white/5 text-[9.5px] text-zinc-500 dark:text-slate-400 leading-normal">
                    <span className="font-bold text-zinc-700 dark:text-slate-300">Disclaimer:</span> Must include at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol. 
                    <span className="block mt-0.5">
                      <em>Example:</em> <code className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-black/50 text-orange-600 dark:text-orange-400 font-mono font-bold">TrackTimer@2026</code> or <code className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-black/50 text-orange-600 dark:text-orange-400 font-mono font-bold">Builder#1998</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    <option value="Student Builder">Student Builder</option>
                    <option value="Lead Developer">Lead Developer</option>
                    <option value="Frontend Developer">Frontend Dev</option>
                    <option value="Backend Developer">Backend Dev</option>
                    <option value="Fullstack Engineer">Fullstack Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                    Goal (Hours/Wk)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newWeeklyGoal}
                    onChange={(e) => setNewWeeklyGoal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {addUserLoading ? 'Creating User...' : 'Add User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Delete User Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-sm w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Remove User Account?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to remove <strong>@{userToDelete.username}</strong> ({userToDelete.name})? This user will no longer be able to log in.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
