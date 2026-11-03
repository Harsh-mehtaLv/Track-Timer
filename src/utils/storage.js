import { getInitialSessions, INITIAL_USER } from './mockData'

const STORAGE_KEYS = {
  SESSIONS: 'timearena_sessions_v1',
  USER: 'timearena_user_v1',
  TIMER_STATE: 'timearena_active_timer_v1',
  PREFERENCES: 'timearena_preferences_v1',
  TASKS: 'timearena_tasks_v1'
}

export const INITIAL_TASKS = []

const DUMMY_TASK_IDS = new Set(['task-1', 'task-2', 'task-3', 'task-4', 'task-5'])

export const MOCK_TITLES = new Set([
  'react components & hooks setup',
  'supabase database schema design',
  'leetcode: dynamic programming practice',
  'microservices & redis caching architecture',
  'cohort peer code review & prs',
  'timearena weekly dashboard implementation',
  'deep work: tailwind v3 design system',
  'postgresql row-level security rules',
  'frontend ui implementation',
  'backend api & database schema',
  'leetcode dsa practice',
  'system design & architecture',
  'deep work: react components',
  'postgresql database & rls',
  'algorithms & problem solving',
  'cohort assignment & review'
])

export function isMockTitle(title) {
  if (!title || typeof title !== 'string') return false
  return MOCK_TITLES.has(title.trim().toLowerCase())
}

export function getTasksStorageKey(username) {
  if (!username || username === 'Guest_User') {
    return 'timearena_tasks_guest_v1'
  }
  return `timearena_tasks_${username.toLowerCase()}_v1`
}

export function loadSavedTasks(username) {
  try {
    const key = getTasksStorageKey(username)
    let raw = localStorage.getItem(key)

    // Check and migrate from legacy key if key doesn't exist yet
    if (!raw) {
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw)
          if (Array.isArray(parsedLegacy)) {
            const cleanLegacy = parsedLegacy.filter(t => t && t.id && !DUMMY_TASK_IDS.has(t.id) && !isMockTitle(t.title))
            if (cleanLegacy.length > 0) {
              saveTasks(cleanLegacy, username)
              localStorage.removeItem(STORAGE_KEYS.TASKS)
              return cleanLegacy
            }
          }
        } catch {}
        localStorage.removeItem(STORAGE_KEYS.TASKS)
      }
    }

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Filter out any legacy dummy task seeds
    const cleanTasks = parsed.filter(t => t && t.id && !DUMMY_TASK_IDS.has(t.id) && !isMockTitle(t.title))
    if (cleanTasks.length !== parsed.length) {
      saveTasks(cleanTasks, username)
    }

    return cleanTasks
  } catch (e) {
    console.error('Error loading tasks from localStorage', e)
    return []
  }
}

export function saveTasks(tasks, username) {
  try {
    const key = getTasksStorageKey(username)
    const toSave = Array.isArray(tasks) 
      ? tasks.filter(t => t && t.id && !DUMMY_TASK_IDS.has(t.id) && !isMockTitle(t.title)) 
      : []
    localStorage.setItem(key, JSON.stringify(toSave))
    if (localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.removeItem(STORAGE_KEYS.TASKS)
    }
  } catch (e) {
    console.error('Error saving tasks to localStorage', e)
  }
}

export function getSessionsStorageKey(username) {
  if (!username || username === 'Guest_User') {
    return 'timearena_sessions_guest_v1'
  }
  return `timearena_sessions_${username.toLowerCase()}_v1`
}

export function loadSavedSessions(username) {
  try {
    const key = getSessionsStorageKey(username)
    let raw = localStorage.getItem(key)

    // Legacy migration check: if user key has no sessions yet, check STORAGE_KEYS.SESSIONS
    if (!raw && key !== 'timearena_sessions_guest_v1') {
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS)
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw)
          if (Array.isArray(parsedLegacy)) {
            const clean = parsedLegacy.filter(s => s && s.id && !String(s.id).startsWith('seed-'))
            if (clean.length > 0) {
              saveSessions(clean, username)
              localStorage.removeItem(STORAGE_KEYS.SESSIONS)
              return clean
            }
          }
        } catch {}
      }
    }

    // Also purge any seed-* from legacy storage key if present
    const legacyRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    if (legacyRaw) {
      try {
        const parsedLegacy = JSON.parse(legacyRaw)
        if (Array.isArray(parsedLegacy) && parsedLegacy.some(s => s && s.id && String(s.id).startsWith('seed-'))) {
          localStorage.removeItem(STORAGE_KEYS.SESSIONS)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.SESSIONS)
      }
    }

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Automatically purge any legacy seeded dummy sessions (id starting with 'seed-' or mock titles)
    const clean = parsed.filter(s => s && s.id && !String(s.id).startsWith('seed-') && !isMockTitle(s.title))
    if (clean.length !== parsed.length) {
      saveSessions(clean, username)
    }

    return clean
  } catch (e) {
    console.error('Error loading sessions from localStorage', e)
    return []
  }
}

export function saveSessions(sessions, username) {
  try {
    const key = getSessionsStorageKey(username)
    const toSave = Array.isArray(sessions)
      ? sessions.filter(s => s && s.id && !String(s.id).startsWith('seed-') && !isMockTitle(s.title))
      : []
    localStorage.setItem(key, JSON.stringify(toSave))
  } catch (e) {
    console.error('Error saving sessions to localStorage', e)
  }
}

export function loadSavedUser() {
  try {
    const authUser = localStorage.getItem('timearena_active_auth_user_v1')
    if (authUser) {
      const parsed = JSON.parse(authUser)
      if (parsed?.username && parsed.username !== 'Guest_User') return parsed
    }
    const raw = localStorage.getItem(STORAGE_KEYS.USER)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!parsed?.username || parsed.username === 'Guest_User') {
        return { ...INITIAL_USER, ...parsed, streakDays: 0 }
      }
      return parsed
    }
    return INITIAL_USER
  } catch {
    return INITIAL_USER
  }
}

export function saveUser(user) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    if (user?.username && user.username !== 'Guest_User') {
      localStorage.setItem('timearena_active_auth_user_v1', JSON.stringify(user))
    }
  } catch (e) {
    console.error('Error saving user to localStorage', e)
  }
}

export function loadSavedActiveTimer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_STATE)
    if (!raw) return null
    const timer = JSON.parse(raw)
    if (!timer || typeof timer !== 'object') return null

    // Purge any lingering mock title from previous demo versions
    if (timer.title && isMockTitle(timer.title)) {
      timer.title = ''
      saveActiveTimer(timer)
    }

    // If timer was running when page was refreshed / navigated away:
    if (timer.isRunning && timer.lastTickTimestamp) {
      const now = Date.now()
      const elapsedSeconds = Math.max(0, Math.floor((now - timer.lastTickTimestamp) / 1000))
      let newSeconds = (timer.seconds || 0) + elapsedSeconds

      // Clamp for Pomodoro mode if target reached
      if (timer.mode === 'pomodoro' && timer.targetSeconds && newSeconds >= timer.targetSeconds) {
        return {
          ...timer,
          seconds: timer.targetSeconds,
          isRunning: false,
          lastTickTimestamp: now
        }
      }

      return {
        ...timer,
        seconds: newSeconds,
        isRunning: true,
        lastTickTimestamp: now
      }
    }

    return timer
  } catch (e) {
    console.error('Error loading active timer from localStorage', e)
    return null
  }
}

export function saveActiveTimer(timer) {
  try {
    if (!timer) {
      localStorage.removeItem(STORAGE_KEYS.TIMER_STATE)
      return
    }
    const toSave = {
      ...timer,
      lastTickTimestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(toSave))
  } catch (e) {
    console.error('Error saving active timer to localStorage', e)
  }
}
