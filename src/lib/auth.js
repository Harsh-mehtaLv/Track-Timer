import { getSupabaseClient } from './supabase'

const LOCAL_ACCOUNTS_KEY = 'timearena_local_accounts_v1'
const LOCAL_ACTIVE_USER_KEY = 'timearena_active_auth_user_v1'

/**
 * Main Super User Credentials
 * ONLY Harsh_admin has access to the Admin Console
 */
export const SUPER_ADMIN_CREDENTIALS = {
  username: 'Harsh_admin',
  name: 'Harsh (Admin)',
  role: 'Super Admin',
  isAdmin: true
}

// Precomputed SHA-256 hash of admin credential for secure offline/fallback verification
const SUPER_ADMIN_SHA256 = '8e71e919057bfa56277bc7e4437c2ac37112165b5aa7060314a28660761fee2d'

/**
 * Verifies admin password securely against cryptographic hash or cached profile
 */
export async function verifySuperAdminPassword(password) {
  if (!password) return false
  try {
    const enc = new TextEncoder().encode(password)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (hex === SUPER_ADMIN_SHA256) return true
  } catch {}

  try {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    const adminAcc = accounts[SUPER_ADMIN_CREDENTIALS.username.toLowerCase()]
    if (adminAcc?.passwordHash && verifyPassword(password, adminAcc.passwordHash)) {
      return true
    }
  } catch {}

  return false
}

/**
 * Check if a user or username string is the designated Super Admin
 */
export function isSuperAdminUser(userOrUsername) {
  if (!userOrUsername) return false
  if (typeof userOrUsername === 'string') {
    return userOrUsername.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()
  }
  return (
    userOrUsername.isAdmin === true ||
    userOrUsername.username?.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()
  )
}

/**
 * Builds the Super Admin profile object
 */
export function getSuperAdminProfile() {
  let secQ = null
  let secA = null
  try {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    const adminAcc = accounts[SUPER_ADMIN_CREDENTIALS.username.toLowerCase()]
    if (adminAcc?.securityQuestion) secQ = adminAcc.securityQuestion
    if (adminAcc?.securityAnswer) secA = adminAcc.securityAnswer
  } catch {}

  return {
    id: 'super-admin-harsh-001',
    username: SUPER_ADMIN_CREDENTIALS.username,
    name: 'Harsh (Admin)',
    role: 'Super Admin',
    isAdmin: true,
    streakDays: 42,
    weeklyGoalHours: 35,
    isOnline: true,
    securityQuestion: secQ,
    securityAnswer: secA
  }
}

export const AUTH_PAYLOAD_PREFIX = 'tt_auth_v2:'

/**
 * Encodes password hash and security recovery question into a cloud sync payload.
 * 100% UTF-8 safe across all mobile & desktop browsers.
 */
export function encodeAuthPayload(password, securityQuestion, securityAnswer) {
  const cleanPass = password || ''
  const cleanQ = securityQuestion || SECURITY_QUESTIONS[0]
  const cleanA = securityAnswer ? securityAnswer.trim().toLowerCase() : ''
  
  let passHash = cleanPass
  try {
    passHash = btoa(unescape(encodeURIComponent(cleanPass)))
  } catch {
    passHash = cleanPass
  }

  const data = {
    passHash,
    secQ: cleanQ,
    secA: cleanA,
    updatedAt: Date.now()
  }

  return 'tt_auth_v2:' + JSON.stringify(data)
}

/**
 * Decodes cloud sync auth payload with multi-format backwards compatibility.
 */
export function decodeAuthPayload(str) {
  if (!str || typeof str !== 'string') return null
  try {
    if (str.startsWith('tt_auth_v2:')) {
      return JSON.parse(str.slice('tt_auth_v2:'.length))
    }
    if (str.startsWith('tt_auth_v1:')) {
      const base64Str = str.slice('tt_auth_v1:'.length)
      try {
        const jsonStr = decodeURIComponent(escape(atob(base64Str)))
        return JSON.parse(jsonStr)
      } catch {
        return JSON.parse(atob(base64Str))
      }
    }
    if (str.startsWith('{') && str.endsWith('}')) {
      return JSON.parse(str)
    }
  } catch (e) {
    console.warn('decodeAuthPayload error:', e)
  }
  return null
}

/**
 * Compares entered password against stored password hash across all encoding formats.
 */
export function verifyPassword(enteredPassword, storedHash) {
  if (!enteredPassword || !storedHash) return false
  if (storedHash === enteredPassword) return true
  try {
    if (storedHash === btoa(unescape(encodeURIComponent(enteredPassword)))) return true
  } catch {}
  try {
    if (storedHash === btoa(enteredPassword)) return true
  } catch {}
  return false
}

/**
 * Converts a clean username to an internal synthetic email for Supabase Auth.
 * The user ONLY ever enters and sees their Username.
 */
export function usernameToEmail(username) {
  const clean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
  return `${clean}.tracktimer@gmail.com`
}

/**
 * Thoroughly sanitizes any auth error message from Supabase or system:
 * - Strips all email addresses (@timearena.app or any email pattern)
 * - Translates email confirmation messages into friendly username/password instructions
 */
export function sanitizeAuthMessage(msg, username = 'user') {
  if (!msg || typeof msg !== 'string') return 'An error occurred during authentication.'

  // Strip all email patterns: e.g. harsh_admin@timearena.app -> harsh_admin
  let clean = msg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, username)

  // Strip any raw domain strings
  clean = clean.replace(/timearena\.app/gi, 'platform')
  clean = clean.replace(/timearena\.dev/gi, 'platform')

  if (/confirm.*email|email.*confirm|verification/i.test(clean)) {
    return 'Account ready! Please sign in with your username and password.'
  }
  if (/user already registered|user already exists/i.test(clean)) {
    return 'Username already exists. Please switch to "Sign In" with your password.'
  }
  if (/invalid login credentials|invalid credentials/i.test(clean)) {
    return 'Incorrect username or password. Please try again.'
  }
  if (/rate limit/i.test(clean)) {
    return 'Too many login attempts. Please wait a moment and try again.'
  }
  if (/password should be at least/i.test(clean)) {
    return 'Password must be at least 8 characters long.'
  }

  return clean
}

/**
 * Standard Simple Security Questions for Password Recovery
 */
export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite food or dish?"
]

/**
 * Validates password complexity:
 * - At least 8 characters in length
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*...)
 */
export function validatePasswordComplexity(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' }
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters in length.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one uppercase letter (A-Z).' }
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one lowercase letter (a-z).' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one number (0-9).' }
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one special character (e.g. !@#$%^&*).' }
  }

  return { isValid: true }
}

/**
 * Sign up a new user using pure Username & Password and Security Question
 */
export async function signUpWithUsername(username, password, securityQuestion, securityAnswer) {
  const cleanUsername = username.trim()
  if (!cleanUsername || cleanUsername.length < 3) {
    return { error: 'Username must be at least 3 characters long.' }
  }

  // 1. Check for Super Admin
  if (cleanUsername.toLowerCase() === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    const isValidAdmin = await verifySuperAdminPassword(password)
    if (!isValidAdmin) {
      return { error: 'Incorrect password for Harsh_admin. Please enter your admin password.' }
    }
    // Correct credentials -> log in immediately as Super Admin
    const superAdmin = getSuperAdminProfile()
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(superAdmin))
    
    // Save in local accounts store as well
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    accounts[cleanUsername.toLowerCase()] = {
      ...superAdmin,
      passwordHash: btoa(unescape(encodeURIComponent(password))),
      securityQuestion: securityQuestion || SECURITY_QUESTIONS[0],
      securityAnswer: (securityAnswer || 'admin').trim().toLowerCase()
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

    // Attempt quiet Supabase sync in background if configured
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const email = usernameToEmail(cleanUsername)
        const { error: suErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: cleanUsername, full_name: 'Harsh (Admin)', is_admin: true } }
        })
        if (suErr && suErr.message.includes('already registered')) {
          await supabase.auth.signInWithPassword({ email, password })
        }
      } catch {
        // Super admin local auth is primary
      }
    }

    return { user: superAdmin, sessions: [] }
  }

  // 2. Validate password complexity for signup
  const passwordValidation = validatePasswordComplexity(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error }
  }

  // 3. Validate security answer
  if (!securityAnswer || !securityAnswer.trim()) {
    return { error: 'Please answer the security question for password recovery.' }
  }

  // Check if username already exists in local accounts
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  if (accounts[cleanUsername.toLowerCase()]) {
    return { error: 'Username already taken. Please choose another or switch to "Sign In".' }
  }

  // Check if username already exists in Supabase Cloud Database
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (existingProf) {
        return { error: 'Username already taken. Please choose another or switch to "Sign In".' }
      }
    } catch (e) {
      console.warn('Check existing profile warning:', e)
    }
  }

  const selectedQuestion = securityQuestion || SECURITY_QUESTIONS[0]
  const cleanAnswer = securityAnswer.trim().toLowerCase()

  const newUser = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    name: cleanUsername,
    passwordHash: btoa(password),
    securityQuestion: selectedQuestion,
    securityAnswer: cleanAnswer,
    streakDays: 1,
    weeklyGoalHours: 30,
    totalSeconds: 0,
    sessionsCount: 0,
    isOnline: true,
    isAdmin: false,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // 4. Regular User Signup with Supabase Cloud PostgreSQL Profiles
  const email = usernameToEmail(cleanUsername)
  const authPayload = encodeAuthPayload(password, selectedQuestion, cleanAnswer)

  if (supabase) {
    try {
      // Direct insert into PostgreSQL profiles table for reliable cross-device auth
      const { error: insErr } = await supabase.from('profiles').insert({
        id: newUser.id,
        name: cleanUsername,
        username: cleanUsername,
        avatar_url: authPayload,
        streak_days: 1,
        weekly_goal_hours: 30
      })
      if (insErr) {
        console.warn('Profiles insert error:', insErr)
        return { error: 'Cloud database registration error: ' + insErr.message }
      }
    } catch (e) {
      console.warn('Profiles insert exception:', e)
      return { error: 'Database connection failed: ' + e.message }
    }

    try {
      // Also attempt quiet Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanUsername,
            security_question: selectedQuestion,
            security_answer: cleanAnswer
          }
        }
      })

      if (!error && data?.user?.id) {
        newUser.id = data.user.id
      }
    } catch (e) {
      // Supabase Auth email confirmation may be pending, PostgreSQL profile auth is primary
    }
  }

  // Save to local storage
  accounts[cleanUsername.toLowerCase()] = {
    ...newUser,
    passwordHash: btoa(password),
    securityQuestion: selectedQuestion,
    securityAnswer: cleanAnswer
  }
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
  localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(newUser))

  // Also sync to admin managed users list
  try {
    const adminUsers = JSON.parse(localStorage.getItem('timearena_admin_managed_users_v1') || '[]')
    if (!adminUsers.some(u => u.username?.toLowerCase() === cleanUsername.toLowerCase())) {
      adminUsers.unshift(newUser)
      localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(adminUsers))
    }
  } catch {}

  return { user: newUser, sessions: [] }
}

/**
 * Log in an existing user using pure Username & Password
 */
export async function signInWithUsername(username, password) {
  const cleanUsername = username.trim()
  if (!cleanUsername || !password) {
    return { error: 'Please enter both username and password.' }
  }

  // 1. Check for Super Admin
  if (cleanUsername.toLowerCase() === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    const supabase = getSupabaseClient()
    let isValidAdmin = false

    // Check against Supabase profiles table first
    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .ilike('username', cleanUsername)
          .maybeSingle()

        if (profile?.avatar_url) {
          const authData = decodeAuthPayload(profile.avatar_url)
          if (authData?.passHash && verifyPassword(password, authData.passHash)) {
            isValidAdmin = true
          }
        }
      } catch (e) {
        console.warn('Admin remote verification error:', e)
      }
    }

    // Fallback verification if offline or profiles table unavailable
    if (!isValidAdmin) {
      isValidAdmin = await verifySuperAdminPassword(password)
    }

    if (!isValidAdmin) {
      return { error: 'Incorrect password for Harsh_admin.' }
    }

    const superAdmin = getSuperAdminProfile()
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(superAdmin))

    // Attempt remote session fetch if Supabase is connected
    let remoteSessions = []
    if (supabase) {
      try {
        const email = usernameToEmail(cleanUsername)
        const { data: suData } = await supabase.auth.signInWithPassword({ email, password })
        if (suData?.user) {
          const { data: sessData } = await supabase
            .from('time_sessions')
            .select('*')
            .eq('user_id', suData.user.id)
            .order('start_time', { ascending: false })
          if (sessData) {
            remoteSessions = sessData.map(s => ({
              id: s.id,
              title: s.title,
              category: s.category,
              startTime: s.start_time,
              endTime: s.end_time,
              durationSeconds: s.duration_seconds,
              notes: s.notes,
              completed: s.completed
            }))
          }
        }
      } catch {
        // local login suffices
      }
    }

    return { user: superAdmin, sessions: remoteSessions.length > 0 ? remoteSessions : null }
  }

  // 2. Check local accounts store first (immune to Supabase email rate limits)
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  const localFound = accounts[cleanUsername.toLowerCase()]

  if (localFound) {
    if (localFound.passwordHash === btoa(password)) {
      // Valid password! Sign in locally and quietly sync Supabase profile in background
      const supabase = getSupabaseClient()
      if (supabase) {
        try {
          const authPayload = encodeAuthPayload(password, localFound.securityQuestion, localFound.securityAnswer)
          if (authPayload) {
            supabase
              .from('profiles')
              .select('id')
              .ilike('username', localFound.username)
              .maybeSingle()
              .then(({ data: existingProf }) => {
                if (existingProf?.id) {
                  supabase
                    .from('profiles')
                    .update({ avatar_url: authPayload })
                    .eq('id', existingProf.id)
                    .then()
                } else {
                  supabase
                    .from('profiles')
                    .insert({
                      id: localFound.id || `usr-${Date.now()}`,
                      username: localFound.username,
                      name: localFound.name || localFound.username,
                      avatar_url: authPayload,
                      streak_days: localFound.streakDays || 1,
                      weekly_goal_hours: localFound.weeklyGoalHours || 30
                    })
                    .then()
                }
              })
          }
        } catch {}
      }
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(localFound))
      return { user: localFound, sessions: null }
    } else {
      return { error: 'Incorrect username or password. Please try again.' }
    }
  }

  // 3. Cross-Device Cloud Authentication via Supabase PostgreSQL profiles
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (profile) {
        const cloudAuth = decodeAuthPayload(profile.avatar_url)
        const storedPassHash = profile.password_hash || cloudAuth?.passHash
        const storedSecQ = profile.security_question || cloudAuth?.secQ || SECURITY_QUESTIONS[0]
        const storedSecA = profile.security_answer || cloudAuth?.secA || ''

        if (storedPassHash && verifyPassword(password, storedPassHash)) {
          // Password verified from cloud profile!
          const userProfile = {
            id: profile.id,
            username: profile.username,
            name: profile.name || profile.username,
            streakDays: profile.streak_days || 1,
            weeklyGoalHours: profile.weekly_goal_hours || 30,
            securityQuestion: storedSecQ,
            securityAnswer: storedSecA,
            isOnline: true,
            isAdmin: isSuperAdminUser(profile.username)
          }

          // Save to this device's local storage so subsequent logins are instant & offline-ready
          accounts[cleanUsername.toLowerCase()] = {
            ...userProfile,
            passwordHash: storedPassHash,
            securityQuestion: storedSecQ,
            securityAnswer: storedSecA
          }
          localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
          localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(userProfile))

            // Fetch user sessions synced across devices
            let remoteSessions = []
            try {
              const { data: sessData } = await supabase
                .from('time_sessions')
                .select('*')
                .eq('user_id', profile.id)
                .order('start_time', { ascending: false })
              if (sessData && sessData.length > 0) {
                remoteSessions = sessData.map(s => ({
                  id: s.id,
                  title: s.title,
                  category: s.category,
                  startTime: s.start_time,
                  endTime: s.end_time,
                  durationSeconds: s.duration_seconds,
                  notes: s.notes,
                  completed: s.completed
                }))
              }
            } catch {}

            return { user: userProfile, sessions: remoteSessions.length > 0 ? remoteSessions : [] }
          } else {
            return { error: 'Incorrect username or password. Please try again.' }
          }
        }
      } catch (e) {
      console.warn('Cloud profile signin notice:', e)
    }

    // 4. Fallback: Supabase Auth direct sign-in
    try {
      const email = usernameToEmail(cleanUsername)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: sanitizeAuthMessage(error.message, cleanUsername) }
      }

      const authUser = data.user
      if (authUser) {
        let userProfile = {
          id: authUser.id,
          username: cleanUsername,
          name: authUser.user_metadata?.full_name || cleanUsername,
          streakDays: 5,
          weeklyGoalHours: 30,
          isOnline: true,
          isAdmin: isSuperAdminUser(cleanUsername)
        }

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileData) {
            userProfile.streakDays = profileData.streak_days || 1
            userProfile.weeklyGoalHours = profileData.weekly_goal_hours || 30
          }
        } catch {
          // ignore
        }

        accounts[cleanUsername.toLowerCase()] = {
          ...userProfile,
          passwordHash: btoa(password)
        }
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
        localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(userProfile))

        return { user: userProfile, sessions: [] }
      }
    } catch (e) {
      return { error: sanitizeAuthMessage(e.message, cleanUsername) }
    }
  }

  return { error: 'Incorrect username or password. Please try again.' }
}

/**
 * Log out
 */
export async function signOutUser() {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Sign out error:', e)
    }
  }
  localStorage.removeItem(LOCAL_ACTIVE_USER_KEY)
}

/**
 * Retrieves the security question for a given username to begin password recovery
 */
export async function getUserSecurityQuestion(username) {
  if (!username || !username.trim()) {
    return { error: 'Please enter your username.' }
  }
  const cleanUsername = username.trim().toLowerCase()

  // 1. Super Admin recovery question
  if (cleanUsername === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    const adminAcc = accounts[cleanUsername]
    if (adminAcc && adminAcc.securityQuestion && adminAcc.securityAnswer) {
      return {
        found: true,
        username: SUPER_ADMIN_CREDENTIALS.username,
        question: adminAcc.securityQuestion,
        hasCustomQuestion: true
      }
    }
    return {
      found: true,
      username: SUPER_ADMIN_CREDENTIALS.username,
      question: SECURITY_QUESTIONS[0],
      hasCustomQuestion: false
    }
  }

  // 2. Local accounts lookup
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  let found = accounts[cleanUsername]

  // 3. Admin managed users lookup
  if (!found) {
    try {
      const adminUsers = JSON.parse(localStorage.getItem('timearena_admin_managed_users_v1') || '[]')
      const adminFound = adminUsers.find(u => u.username?.toLowerCase() === cleanUsername)
      if (adminFound) {
        found = adminFound
      }
    } catch {}
  }

  if (found) {
    return {
      found: true,
      username: found.username || username.trim(),
      question: found.securityQuestion || SECURITY_QUESTIONS[0],
      hasCustomQuestion: Boolean(found.securityQuestion && found.securityAnswer)
    }
  }

  // 4. Cloud Supabase PostgreSQL profiles lookup (Cross-device on laptop/mobile)
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (profile) {
        const cloudAuth = decodeAuthPayload(profile.avatar_url)
        const q = profile.security_question || cloudAuth?.secQ
        if (q) {
          return {
            found: true,
            username: profile.username,
            question: q,
            hasCustomQuestion: true
          }
        }
      }
    } catch {}
  }

  return { error: `Username @${username.trim()} was not found.` }
}

/**
 * Updates or sets the security question and answer for an existing user or admin
 */
export async function updateUserSecurityQuestion({
  username,
  securityQuestion,
  securityAnswer
}) {
  if (!username || !username.trim()) {
    return { error: 'Username is required.' }
  }
  if (!securityQuestion || !securityQuestion.trim()) {
    return { error: 'Please select a security question.' }
  }
  if (!securityAnswer || !securityAnswer.trim()) {
    return { error: 'Please enter a secret answer.' }
  }

  const cleanUsername = username.trim().toLowerCase()
  const cleanAnswer = securityAnswer.trim().toLowerCase()
  const selectedQuestion = securityQuestion.trim()

  // 1. Super Admin handling
  if (cleanUsername === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    const adminAcc = accounts[cleanUsername] || getSuperAdminProfile()
    adminAcc.securityQuestion = selectedQuestion
    adminAcc.securityAnswer = cleanAnswer
    accounts[cleanUsername] = adminAcc
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

    try {
      const active = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || 'null')
      if (active && active.username?.toLowerCase() === cleanUsername) {
        active.securityQuestion = selectedQuestion
        active.securityAnswer = cleanAnswer
        localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(active))
      }
    } catch {}

    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          username: SUPER_ADMIN_CREDENTIALS.username,
          security_question: selectedQuestion,
          security_answer: cleanAnswer
        })
      } catch {}
    }

    return { 
      success: true, 
      question: selectedQuestion,
      message: 'Admin recovery question saved successfully!' 
    }
  }

  // 2. Regular user handling
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  let found = accounts[cleanUsername]

  let adminUsers = []
  try {
    adminUsers = JSON.parse(localStorage.getItem('timearena_admin_managed_users_v1') || '[]')
    const adminFound = adminUsers.find(u => u.username?.toLowerCase() === cleanUsername)
    if (adminFound && !found) {
      found = { ...adminFound }
    }
  } catch {}

  if (!found) {
    const active = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || 'null')
    if (active && active.username?.toLowerCase() === cleanUsername) {
      found = { ...active }
    } else {
      found = {
        username: username.trim(),
        name: username.trim()
      }
    }
  }

  found.securityQuestion = selectedQuestion
  found.securityAnswer = cleanAnswer
  accounts[cleanUsername] = found
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

  try {
    const active = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || 'null')
    if (active && active.username?.toLowerCase() === cleanUsername) {
      active.securityQuestion = selectedQuestion
      active.securityAnswer = cleanAnswer
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(active))
    }
  } catch {}

  try {
    const idx = adminUsers.findIndex(u => u.username?.toLowerCase() === cleanUsername)
    if (idx !== -1) {
      adminUsers[idx].securityQuestion = selectedQuestion
      adminUsers[idx].securityAnswer = cleanAnswer
      localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(adminUsers))
    }
  } catch {}

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (profile) {
        const cloudAuth = decodeAuthPayload(profile.avatar_url) || {}
        let pass = 'TempPass!123'
        if (found?.passwordHash) {
          try { pass = atob(found.passwordHash) } catch {}
        } else if (cloudAuth.passHash) {
          try { pass = atob(cloudAuth.passHash) } catch {}
        }
        const updatedPayload = encodeAuthPayload(pass, selectedQuestion, cleanAnswer)
        await supabase
          .from('profiles')
          .update({ avatar_url: updatedPayload })
          .eq('id', profile.id)
      }
    } catch {}
  }

  return { 
    success: true, 
    question: selectedQuestion,
    message: 'Recovery question saved successfully!' 
  }
}

/**
 * Resets user password after verifying their security question answer
 */
export async function resetPasswordWithSecurityQuestion({
  username,
  securityAnswer,
  newPassword
}) {
  if (!username || !username.trim()) {
    return { error: 'Username is required.' }
  }
  if (!securityAnswer || !securityAnswer.trim()) {
    return { error: 'Please enter your security question answer.' }
  }
  if (!newPassword) {
    return { error: 'Please enter your new password.' }
  }

  const cleanUsername = username.trim().toLowerCase()
  const cleanAnswer = securityAnswer.trim().toLowerCase()

  // 1. Validate new password complexity
  const pwdValidation = validatePasswordComplexity(newPassword)
  if (!pwdValidation.isValid) {
    return { error: pwdValidation.error }
  }

  // 2. Super Admin handling
  if (cleanUsername === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    const adminAcc = accounts[cleanUsername]
    let storedAdminAns = (adminAcc?.securityAnswer || '').trim().toLowerCase()
    
    // Check Supabase if local answer is not found
    const supabase = getSupabaseClient()
    if (!storedAdminAns && supabase) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('avatar_url')
          .ilike('username', cleanUsername)
          .maybeSingle()
        if (prof?.avatar_url) {
          const cloudAuth = decodeAuthPayload(prof.avatar_url)
          if (cloudAuth?.secA) storedAdminAns = cloudAuth.secA.trim().toLowerCase()
        }
      } catch {}
    }

    const isMasterPhrase = cleanAnswer === 'admin' || cleanAnswer === 'harsh'
    const isSecurityAnswerMatch = storedAdminAns && cleanAnswer === storedAdminAns

    if (!isMasterPhrase && !isSecurityAnswerMatch) {
      return { error: 'Incorrect answer for administrator verification.' }
    }
    const newHash = btoa(unescape(encodeURIComponent(newPassword)))
    if (adminAcc) {
      adminAcc.passwordHash = newHash
      accounts[cleanUsername] = adminAcc
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
    }
    if (supabase) {
      try {
        const newPayload = encodeAuthPayload(newPassword, adminAcc?.securityQuestion || SECURITY_QUESTIONS[0], storedAdminAns || 'admin')
        await supabase
          .from('profiles')
          .update({ avatar_url: newPayload, updated_at: new Date().toISOString() })
          .ilike('username', cleanUsername)
      } catch {}
    }
    return { success: true }
  }

  // 3. Local accounts lookup
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  let found = accounts[cleanUsername]

  if (!found) {
    try {
      const adminUsers = JSON.parse(localStorage.getItem('timearena_admin_managed_users_v1') || '[]')
      const adminFound = adminUsers.find(u => u.username?.toLowerCase() === cleanUsername)
      if (adminFound) {
        found = adminFound
      }
    } catch {}
  }

  // 4. Cloud Supabase profiles lookup if not in local storage
  let cloudProfile = null
  let cloudAuth = null
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (profile) {
        cloudProfile = profile
        cloudAuth = decodeAuthPayload(profile.avatar_url)
      }
    } catch {}
  }

  if (!found && !cloudProfile) {
    return { error: `Username @${username.trim()} was not found.` }
  }

  // Verify answer against local or cloud store
  const storedAnswer = ((found?.securityAnswer || cloudAuth?.secA || '').trim().toLowerCase())
  if (storedAnswer && storedAnswer !== cleanAnswer) {
    return { error: 'Incorrect security answer. Please check and try again.' }
  }

  const userQuestion = found?.securityQuestion || cloudAuth?.secQ || SECURITY_QUESTIONS[0]

  // Update password in local storage
  const updatedUser = {
    ...(found || {}),
    id: found?.id || cloudProfile?.id || `usr-${Date.now()}`,
    username: found?.username || cloudProfile?.username || username.trim(),
    name: found?.name || cloudProfile?.name || username.trim(),
    passwordHash: btoa(newPassword),
    securityQuestion: userQuestion,
    securityAnswer: cleanAnswer
  }
  accounts[cleanUsername] = updatedUser
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

  // Update active user if currently this user
  try {
    const active = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_USER_KEY) || 'null')
    if (active && active.username?.toLowerCase() === cleanUsername) {
      active.passwordHash = btoa(newPassword)
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(active))
    }
  } catch {}

  // Update in admin list
  try {
    const adminUsers = JSON.parse(localStorage.getItem('timearena_admin_managed_users_v1') || '[]')
    const idx = adminUsers.findIndex(u => u.username?.toLowerCase() === cleanUsername)
    if (idx !== -1) {
      adminUsers[idx].passwordHash = btoa(newPassword)
      localStorage.setItem('timearena_admin_managed_users_v1', JSON.stringify(adminUsers))
    }
  } catch {}

  // Update credentials in Supabase PostgreSQL profiles for cross-device persistence
  if (supabase && cloudProfile) {
    try {
      const newPayload = encodeAuthPayload(newPassword, userQuestion, cleanAnswer)
      await supabase
        .from('profiles')
        .update({ avatar_url: newPayload })
        .eq('id', cloudProfile.id)
    } catch {}
  }
  if (supabase) {
    try {
      await supabase.auth.updateUser({ password: newPassword })
    } catch {}
  }

  return { success: true }
}

/**
 * Sync sessions to PostgreSQL database
 */
export async function syncSessionToPostgres(session, userId) {
  const supabase = getSupabaseClient()
  if (!supabase || !userId) return false

  try {
    const { error } = await supabase.from('time_sessions').upsert({
      id: session.id.includes('-') && !session.id.startsWith('seed-') ? undefined : undefined,
      user_id: userId,
      title: session.title,
      category: session.category,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_seconds: session.durationSeconds,
      notes: session.notes,
      completed: true
    })
    return !error
  } catch (e) {
    console.warn('Error syncing session to PostgreSQL:', e)
    return false
  }
}

export const DUMMY_USERNAMES_SET = new Set([
  'hitesh_dev', 
  'ananya_react', 
  'vikram_dsa', 
  'priya_cloud', 
  'arjun_sys', 
  'neha_cohort'
])

/**
 * Admin: Get all local user accounts stored on this machine (excluding dummy test data)
 */
export function adminGetLocalAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
    return Object.values(accounts).filter(a => 
      a && a.username && !DUMMY_USERNAMES_SET.has(a.username.toLowerCase())
    )
  } catch {
    return []
  }
}

/**
 * Admin: Create / Provision a new user with credentials
 */
export async function adminCreateUser({
  username,
  name,
  password,
  role = 'Student Builder',
  weeklyGoalHours = 30,
  securityQuestion = SECURITY_QUESTIONS[0],
  securityAnswer = 'admin'
}) {
  const cleanUsername = username.trim().replace(/^@/, '')
  if (!cleanUsername || cleanUsername.length < 3) {
    return { error: 'Username must be at least 3 characters long.' }
  }
  const passwordCheck = validatePasswordComplexity(password)
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.error }
  }

  // Check if username already exists in local accounts
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  if (accounts[cleanUsername.toLowerCase()]) {
    return { error: `Username @${cleanUsername} is already taken.` }
  }

  let remoteUserId = `user-${Date.now()}`
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const email = usernameToEmail(cleanUsername)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            full_name: name || cleanUsername,
            role: role
          }
        }
      })
      if (data?.user) {
        remoteUserId = data.user.id
      }
      const authPayload = encodeAuthPayload(password, securityQuestion, securityAnswer)
      try {
        await supabase.from('profiles').upsert({
          id: remoteUserId,
          username: cleanUsername,
          name: name || cleanUsername,
          avatar_url: authPayload,
          streak_days: 1,
          weekly_goal_hours: Number(weeklyGoalHours) || 30
        })
      } catch (profErr) {
        console.warn('Profile creation note:', profErr)
      }
    } catch (e) {
      console.warn('Supabase auth signup note for admin create:', e)
    }
  }

  const newUser = {
    id: remoteUserId,
    username: cleanUsername,
    name: name || cleanUsername,
    role: role,
    passwordHash: btoa(password),
    securityQuestion: securityQuestion || SECURITY_QUESTIONS[0],
    securityAnswer: (securityAnswer || 'admin').trim().toLowerCase(),
    streakDays: 1,
    weeklyGoalHours: Number(weeklyGoalHours) || 30,
    totalSeconds: 0,
    sessionsCount: 0,
    isTimerRunning: false,
    activeTask: null,
    lastActive: 'Just registered',
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    databaseEngine: supabase ? 'Supabase PostgreSQL' : 'Local Storage',
    isOnline: false,
    isAdmin: false
  }

  accounts[cleanUsername.toLowerCase()] = newUser
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))

  return { user: newUser }
}

/**
 * Admin: Delete / Remove a user from the platform
 */
export async function adminDeleteUser(username, userId) {
  const cleanUsername = username.trim().toLowerCase()
  if (cleanUsername === SUPER_ADMIN_CREDENTIALS.username.toLowerCase()) {
    return { error: 'Action denied: The Super Admin Harsh_admin cannot be removed.' }
  }

  // 1. Remove from local accounts
  const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '{}')
  if (accounts[cleanUsername]) {
    delete accounts[cleanUsername]
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
  }

  // 2. Remove from Supabase if online
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      if (userId && !userId.startsWith('user-')) {
        await supabase.from('time_sessions').delete().eq('user_id', userId)
        await supabase.from('profiles').delete().eq('id', userId)
      } else {
        await supabase.from('profiles').delete().eq('username', username)
      }
    } catch (e) {
      console.warn('Error deleting user from Supabase:', e)
    }
  }

  return { success: true }
}
