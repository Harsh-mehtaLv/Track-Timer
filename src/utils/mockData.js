import { getWeekDays } from './formatters'

/**
 * Initial sessions for new users: clean slate with 0 sessions.
 */
export function getInitialSessions() {
  return []
}

export const INITIAL_USER = {
  username: 'Guest_User',
  name: 'Guest User',
  avatarUrl: '',
  streakDays: 0,
  weeklyGoalHours: 30,
  trackName: 'Self-Paced Track',
  isOnline: false,
  isAdmin: false
}
