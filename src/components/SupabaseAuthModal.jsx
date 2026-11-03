import React, { useState, useEffect } from 'react'
import { 
  X, 
  Database, 
  User, 
  Lock, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Code,
  Sparkles,
  Server,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  ArrowLeft
} from 'lucide-react'
import { 
  getSupabaseClient, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  SUPABASE_SCHEMA_SQL 
} from '../lib/supabase'
import { 
  signInWithUsername, 
  signUpWithUsername, 
  signOutUser,
  isSuperAdminUser,
  validatePasswordComplexity,
  SECURITY_QUESTIONS,
  getUserSecurityQuestion,
  resetPasswordWithSecurityQuestion,
  updateUserSecurityQuestion
} from '../lib/auth'

export default function SupabaseAuthModal({ 
  isOpen, 
  onClose, 
  user, 
  setUser,
  onAuthSuccess
}) {
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup' | 'forgot' | 'db_config'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // View password toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [showDbKey, setShowDbKey] = useState(false)

  // Security questions & forgot password recovery
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [forgotSecurityQuestion, setForgotSecurityQuestion] = useState('')
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // Recovery question management for logged-in users & admin
  const [userSecQuestion, setUserSecQuestion] = useState('')
  const [hasCustomSecQuestion, setHasCustomSecQuestion] = useState(false)
  const [editSecQuestion, setEditSecQuestion] = useState(SECURITY_QUESTIONS[0])
  const [editSecAnswer, setEditSecAnswer] = useState('')
  const [showEditSecAnswer, setShowEditSecAnswer] = useState(false)
  const [isEditingSecQuestion, setIsEditingSecQuestion] = useState(false)
  const [savingSecQuestion, setSavingSecQuestion] = useState(false)

  // Supabase config state
  const [supabaseUrl, setSupabaseUrl] = useState(
    import.meta.env.VITE_SUPABASE_URL || 
    JSON.parse(localStorage.getItem('timearena_supabase_config') || '{}').url || ''
  )
  const [supabaseKey, setSupabaseKey] = useState(
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    JSON.parse(localStorage.getItem('timearena_supabase_config') || '{}').key || ''
  )
  const [showSql, setShowSql] = useState(false)
  const [copied, setCopied] = useState(false)

  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
  const isLoggedIn = Boolean(user && user.username && user.username !== 'Guest_User')

  // Load configured security question when modal opens for logged-in user or admin
  useEffect(() => {
    let isMounted = true
    if (isOpen && isLoggedIn && user?.username) {
      Promise.resolve(getUserSecurityQuestion(user.username)).then((info) => {
        if (!isMounted) return
        if (info && info.found && info.hasCustomQuestion) {
          setUserSecQuestion(info.question)
          setHasCustomSecQuestion(true)
          setEditSecQuestion(info.question)
          setIsEditingSecQuestion(false)
        } else {
          setUserSecQuestion('')
          setHasCustomSecQuestion(false)
          setEditSecQuestion(SECURITY_QUESTIONS[0])
          setIsEditingSecQuestion(true)
        }
        setEditSecAnswer('')
      })
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, isLoggedIn, user?.username])

  if (!isOpen) return null

  const handleSaveUserSecurityQuestion = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!editSecAnswer.trim()) {
      setErrorMsg('Please enter a secret answer for password recovery.')
      return
    }

    setSavingSecQuestion(true)
    const res = await updateUserSecurityQuestion({
      username: user.username,
      securityQuestion: editSecQuestion,
      securityAnswer: editSecAnswer
    })
    setSavingSecQuestion(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setUserSecQuestion(res.question)
      setHasCustomSecQuestion(true)
      setIsEditingSecQuestion(false)
      setEditSecAnswer('')
      setSuccessMsg(res.message || 'Security question updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    }
  }

  const handleLookupSecurityQuestion = async (targetUsername) => {
    const u = (targetUsername || username).trim()
    if (!u) {
      setErrorMsg('Please enter your username first.')
      return
    }
    setErrorMsg('')
    const res = await getUserSecurityQuestion(u)
    if (res.error) {
      setErrorMsg(res.error)
      setForgotSecurityQuestion('')
    } else {
      setForgotSecurityQuestion(res.question)
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!username.trim()) {
      setErrorMsg('Please enter your username.')
      return
    }
    if (!forgotSecurityQuestion) {
      setErrorMsg('Please find your security question first.')
      return
    }
    if (!forgotSecurityAnswer.trim()) {
      setErrorMsg('Please enter the answer to your security question.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }
    const pwdValidation = validatePasswordComplexity(newPassword)
    if (!pwdValidation.isValid) {
      setErrorMsg(pwdValidation.error)
      return
    }

    setLoading(true)
    const res = await resetPasswordWithSecurityQuestion({
      username: username.trim(),
      securityAnswer: forgotSecurityAnswer,
      newPassword
    })
    setLoading(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setSuccessMsg('Password reset successfully! Redirecting to Sign In...')
      setTimeout(() => {
        setPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setForgotSecurityAnswer('')
        setForgotSecurityQuestion('')
        setAuthMode('login')
        setSuccessMsg('')
      }, 1400)
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!username.trim()) {
      setErrorMsg('Please enter a username.')
      return
    }
    if (!password) {
      setErrorMsg('Please enter a password.')
      return
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.')
        return
      }
      const pwdValidation = validatePasswordComplexity(password)
      if (!pwdValidation.isValid) {
        setErrorMsg(pwdValidation.error)
        return
      }
      if (!securityAnswer.trim()) {
        setErrorMsg('Please answer the security question for password recovery.')
        return
      }

      setLoading(true)
      const res = await signUpWithUsername(username, password, securityQuestion, securityAnswer)
      setLoading(false)

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setUser(res.user)
        setSuccessMsg(`Welcome, ${res.user.username}! Account created.`)
        if (onAuthSuccess && res.sessions) onAuthSuccess(res.sessions)
        setTimeout(() => onClose(), 1200)
      }
    } else {
      // Login
      setLoading(true)
      const res = await signInWithUsername(username, password)
      setLoading(false)

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setUser(res.user)
        setSuccessMsg(`Welcome back, ${res.user.username}!`)
        if (onAuthSuccess && res.sessions) onAuthSuccess(res.sessions)
        setTimeout(() => onClose(), 1200)
      }
    }
  }

  const handleLogout = async () => {
    await signOutUser()
    setUser({
      username: 'Guest_User',
      name: 'Guest User',
      avatarUrl: '',
      streakDays: 0,
      weeklyGoalHours: 30,
      isOnline: false,
      isAdmin: false
    })
    setSuccessMsg('Logged out successfully.')
    setTimeout(() => {
      setSuccessMsg('')
      onClose()
    }, 1000)
  }

  const handleSaveDbConfig = async (e) => {
    e.preventDefault()
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setErrorMsg('Please provide both Project URL and Anon Key')
      return
    }
    const ok = await saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim())
    if (ok) {
      setSuccessMsg('Supabase PostgreSQL connected & saved to application!')
      setErrorMsg('')
      setTimeout(() => setSuccessMsg(''), 3500)
    }
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          {isSuperAdminUser(user) ? (
            <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>Cloud Database & Account</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Your Account</span>
            </div>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {isLoggedIn 
              ? 'Your Account' 
              : authMode === 'forgot'
              ? 'Reset Password'
              : authMode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
            {isLoggedIn
              ? 'Manage your personal focus telemetry, streak, and preferences.'
              : authMode === 'forgot'
              ? 'Answer your chosen security question to set a new password.'
              : 'Access your personal focus sessions from any device with your username.'}
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If user is ALREADY LOGGED IN: show profile card */}
        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-start sm:items-center space-x-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold text-base sm:text-xl flex items-center justify-center shadow-md flex-shrink-0 mt-0.5 sm:mt-0">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base break-all">
                      @{user.username}
                    </span>
                    {isSuperAdminUser(user) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold whitespace-nowrap">
                        👑 Super Admin
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold whitespace-nowrap">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>🔥 {user.streakDays ?? 0} Days Streak</span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">•</span>
                    <span>Goal: {user.weeklyGoalHours || 30}h/wk</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Password Recovery Question Management (For All Users & Admin) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 items-start">
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                      Password Recovery Question
                    </h4>
                    <p className="text-[10.5px] text-zinc-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Used to verify your identity if you ever forget your password.
                    </p>
                  </div>
                </div>
                <div className="pl-8 sm:pl-0 mt-0.5 sm:mt-0">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center ${
                    hasCustomSecQuestion 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {hasCustomSecQuestion ? '✓ Configured' : '⚠ Action Needed'}
                  </span>
                </div>
              </div>

              {hasCustomSecQuestion && !isEditingSecQuestion ? (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-slate-500 tracking-wider">
                      Your Active Question:
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-slate-200">
                      "{userSecQuestion}"
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSecQuestion(true)
                        setEditSecQuestion(userSecQuestion || SECURITY_QUESTIONS[0])
                        setEditSecAnswer('')
                      }}
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Update Security Question / Answer
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveUserSecurityQuestion} className="space-y-3 pt-1 animate-fadeIn">
                  <div>
                    <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Select Question
                    </label>
                    <div className="relative">
                      <select
                        value={editSecQuestion}
                        onChange={(e) => setEditSecQuestion(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-orange-500 appearance-none cursor-pointer shadow-sm"
                      >
                        {SECURITY_QUESTIONS.map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">▼</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Your Secret Answer
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showEditSecAnswer ? 'text' : 'password'}
                        required
                        value={editSecAnswer}
                        onChange={(e) => setEditSecAnswer(e.target.value)}
                        placeholder="Enter secret answer (e.g. Bruno)"
                        className="w-full pl-8 pr-9 py-2 rounded-xl bg-white dark:bg-[#111622] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-orange-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditSecAnswer(!showEditSecAnswer)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        title={showEditSecAnswer ? 'Hide answer' : 'Show answer'}
                      >
                        {showEditSecAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {hasCustomSecQuestion && (
                      <button
                        type="button"
                        onClick={() => setIsEditingSecQuestion(false)}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingSecQuestion}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingSecQuestion ? 'Saving...' : 'Save Recovery Question'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Cloud Sync Status - Strictly Admin Only */}
            {isSuperAdminUser(user) && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-zinc-700 dark:text-slate-300">
                  <Database className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Cloud PostgreSQL Storage:</span>
                </div>
                <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isSupabaseConfigured ? '🟢 Online & Synced' : '🟡 Offline Local Mode'}
                </span>
              </div>
            )}
          </div>
        ) : authMode === 'forgot' ? (
          /* FORGOT PASSWORD RECOVERY MODE */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className="flex items-center space-x-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Your Username
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setForgotSecurityQuestion('')
                      }}
                      placeholder="Enter your registered username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLookupSecurityQuestion(username)}
                    className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
                  >
                    Find Question
                  </button>
                </div>
              </div>

              {forgotSecurityQuestion && (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Security Question Card */}
                  <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                      <HelpCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Your Security Question:</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                      "{forgotSecurityQuestion}"
                    </p>
                  </div>

                  {/* Security Answer Input */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Your Answer
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={forgotSecurityAnswer}
                        onChange={(e) => setForgotSecurityAnswer(e.target.value)}
                        placeholder="Enter the secret answer you chose"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  {/* New Password Input with View Toggle */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="mt-2 p-3 rounded-xl bg-orange-500/5 dark:bg-white/[0.03] border border-orange-500/20 text-[11px] space-y-1.5">
                      <div className="flex items-center space-x-1.5 font-bold text-orange-600 dark:text-orange-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Password Requirements:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                        <div className={`flex items-center space-x-1 ${newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                          <span>{newPassword.length >= 8 ? '✓' : '○'}</span>
                          <span>Min 8 characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                          <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                          <span>1 Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                          <span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                          <span>1 Lowercase (a-z)</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                          <span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                          <span>1 Number (0-9)</span>
                        </div>
                        <div className={`col-span-2 flex items-center space-x-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                          <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? '✓' : '○'}</span>
                          <span>1 Special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm New Password with View Toggle */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save & Reset Password'}
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* USER NOT LOGGED IN: Show Login / Sign Up Tabs */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-[#0b0e15] rounded-xl border border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-orange-600 dark:bg-orange-500 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-orange-600 dark:bg-orange-500 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username (e.g. rahul_dev)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* In Login Mode: Forgot Password Button */}
                {authMode === 'login' && (
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[10px] text-zinc-400 dark:text-slate-500">Case-sensitive</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot')
                        setErrorMsg('')
                        setSuccessMsg('')
                        if (username.trim()) {
                          handleLookupSecurityQuestion(username.trim())
                        }
                      }}
                      className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Password Conditions & Disclaimer with Example (Signup Mode) */}
                {authMode === 'signup' && (
                  <div className="mt-2 p-3 rounded-xl bg-orange-500/5 dark:bg-white/[0.03] border border-orange-500/20 text-[11px] space-y-1.5 animate-fadeIn">
                    <div className="flex items-center space-x-1.5 font-bold text-orange-600 dark:text-orange-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Password Requirements:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <div className={`flex items-center space-x-1 transition-colors ${password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <span>{password.length >= 8 ? '✓' : '○'}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                        <span>1 Uppercase letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center space-x-1 transition-colors ${/[a-z]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                        <span>1 Lowercase letter (a-z)</span>
                      </div>
                      <div className={`flex items-center space-x-1 transition-colors ${/[0-9]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                        <span>1 Number (0-9)</span>
                      </div>
                      <div className={`col-span-2 flex items-center space-x-1 transition-colors ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500 dark:text-slate-400'}`}>
                        <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? '✓' : '○'}</span>
                        <span>1 Special character (e.g. !@#$%^&*)</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-200/70 dark:border-white/5 text-[10px] text-zinc-500 dark:text-slate-400 leading-relaxed">
                      <span className="font-bold text-zinc-700 dark:text-slate-300">Disclaimer:</span> Must satisfy all 5 requirements above. 
                      <span className="block mt-0.5">
                        <em>Example:</em> <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-black/50 text-orange-600 dark:text-orange-400 font-mono font-bold">TrackTimer@2026</code> or <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-black/50 text-orange-600 dark:text-orange-400 font-mono font-bold">Focus#1998</code>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Question Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Security Question (For Password Recovery)
                    </label>
                    <div className="relative">
                      <HelpCircle className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={securityQuestion}
                        onChange={(e) => setSecurityQuestion(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-colors shadow-sm cursor-pointer appearance-none"
                      >
                        {SECURITY_QUESTIONS.map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-slate-500 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Security Answer Input */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-400 mb-1">
                      Security Answer
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        placeholder="Enter your secret answer"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#0b0e15] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">
                      Keep this simple to remember. Used to verify and reset your password if forgotten.
                    </p>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading 
                  ? 'Connecting...' 
                  : authMode === 'signup' 
                  ? 'Create Free Account' 
                  : 'Log In'}
              </button>
            </form>
          </div>
        )}

        {/* Collapsible PostgreSQL Database Connection Configuration - STRICTLY RESTRICTED TO SUPER ADMIN (Harsh_admin) */}
        {isSuperAdminUser(user) && (
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'db_config' ? 'login' : 'db_config')}
              className="w-full flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold">Super Admin: Cloud Database Settings (Supabase)</span>
              </div>
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                {authMode === 'db_config' ? 'Hide' : 'Configure'}
              </span>
            </button>

            {authMode === 'db_config' && (
              <form onSubmit={handleSaveDbConfig} className="mt-4 space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-[#090c13] border border-zinc-200 dark:border-white/5 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 dark:text-slate-400">Sync across all your devices using free Supabase:</span>
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1"
                  >
                    <span>supabase.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-600 dark:text-slate-400 mb-1">
                    Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1017] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-600 dark:text-slate-400 mb-1">
                    Anon / Public API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showDbKey ? "text" : "password"}
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUz..."
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-[#0d1017] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-orange-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDbKey(!showDbKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      title={showDbKey ? "Hide key" : "Show key"}
                    >
                      {showDbKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSql(!showSql)}
                    className="text-[11px] text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white flex items-center space-x-1"
                  >
                    <Code className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>{showSql ? 'Hide SQL' : 'View SQL Schema'}</span>
                  </button>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    Save Connection
                  </button>
                </div>

                {showSql && (
                  <div className="mt-2 p-3 rounded-xl bg-zinc-100 dark:bg-[#06080d] border border-zinc-200 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-slate-300">
                      <span>Copy to Supabase SQL Editor:</span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-white text-[10px]"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-zinc-800 dark:text-slate-400 overflow-x-auto p-2 bg-white dark:bg-[#090c13] rounded border border-zinc-200 dark:border-transparent max-h-36">
                      {SUPABASE_SCHEMA_SQL}
                    </pre>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
