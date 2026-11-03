import { getSupabaseClient } from './supabase'

class TelemetryHub {
  constructor() {
    this.listeners = new Set()
    this.activeMap = new Map()
    this.channel = null
    this.channelReady = false
    this.localPollInterval = null
    this.lastPayload = null
    this.isInitialized = false
  }

  ensureInitialized() {
    if (this.isInitialized) return
    this.isInitialized = true

    // 1. Start local Vite dev server telemetry polling (every 3 seconds)
    if (!this.localPollInterval && typeof window !== 'undefined') {
      this.localPollInterval = setInterval(() => {
        this.pollLocalServer()
      }, 3000)
      // Initial immediate poll
      this.pollLocalServer()
    }

    // 2. Setup Supabase Realtime Channel
    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      const channel = supabase.channel('timearena-live-telemetry', {
        config: {
          presence: { key: 'global-telemetry' }
        }
      })

      this.channel = channel

      // IMPORTANT: Register all callbacks BEFORE calling subscribe()!
      channel
        .on('presence', { event: 'sync' }, () => {
          try {
            const presenceState = channel.presenceState()
            for (const key in presenceState) {
              const list = presenceState[key]
              if (Array.isArray(list)) {
                list.forEach(item => {
                  if (item && item.username) {
                    this.activeMap.set(item.username.toLowerCase(), item)
                  }
                })
              }
            }
            this.notifyListeners()
          } catch (e) {
            console.warn('Presence sync error:', e)
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          try {
            if (Array.isArray(leftPresences)) {
              leftPresences.forEach(item => {
                if (item && item.username) {
                  this.activeMap.delete(item.username.toLowerCase())
                }
              })
              this.notifyListeners()
            }
          } catch (e) {
            console.warn('Presence leave error:', e)
          }
        })
        .on('broadcast', { event: 'timer_heartbeat' }, ({ payload }) => {
          try {
            if (payload && payload.username) {
              if (payload.isTimerRunning) {
                this.activeMap.set(payload.username.toLowerCase(), payload)
              } else {
                this.activeMap.delete(payload.username.toLowerCase())
              }
              this.notifyListeners()
            }
          } catch (e) {
            console.warn('Broadcast heartbeat error:', e)
          }
        })

      // Subscribe only once after all listeners are registered
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.channelReady = true
          if (this.lastPayload) {
            await channel.track(this.lastPayload).catch(() => {})
          }
        }
      })
    } catch (e) {
      console.warn('Could not initialize telemetry realtime channel:', e)
    }
  }

  async pollLocalServer() {
    try {
      const res = await fetch('/api/telemetry/active')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.active)) {
          data.active.forEach(item => {
            if (item && item.username) {
              this.activeMap.set(item.username.toLowerCase(), item)
            }
          })
          this.notifyListeners()
        }
      }
    } catch {
      // offline or prod
    }
  }

  notifyListeners() {
    const result = {}
    for (const [key, val] of this.activeMap.entries()) {
      result[key] = val
    }
    this.listeners.forEach(cb => {
      try {
        cb(result)
      } catch (err) {
        console.warn('Telemetry callback error:', err)
      }
    })
  }

  subscribe(callback) {
    this.ensureInitialized()
    this.listeners.add(callback)

    // Send immediate snapshot of currently known active users
    const result = {}
    for (const [key, val] of this.activeMap.entries()) {
      result[key] = val
    }
    callback(result)

    return () => {
      this.listeners.delete(callback)
    }
  }

  async broadcast(user, activeTimer) {
    if (!user || !user.username) return
    this.ensureInitialized()

    const payload = {
      username: user.username,
      name: user.name || user.username,
      role: user.role || (user.isAdmin ? 'Super Admin' : 'Student Builder'),
      isTimerRunning: Boolean(activeTimer?.isRunning),
      activeTask: activeTimer?.title || 'Active Focus Session',
      activeCategory: activeTimer?.category || 'frontend',
      activeSeconds: activeTimer?.seconds || 0,
      updatedAt: Date.now()
    }

    this.lastPayload = payload

    // 1. Local Vite dev server heartbeat
    try {
      fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    } catch {
      // ignore
    }

    // 2. Supabase Realtime Track & Broadcast
    if (this.channel && this.channelReady) {
      try {
        await this.channel.track(payload).catch(() => {})
        await this.channel.send({
          type: 'broadcast',
          event: 'timer_heartbeat',
          payload
        }).catch(() => {})
      } catch (e) {
        console.warn('Realtime send error:', e)
      }
    }
  }
}

const telemetryHubInstance = new TelemetryHub()

export function broadcastUserTimerState(user, activeTimer) {
  return telemetryHubInstance.broadcast(user, activeTimer)
}

export function subscribeToTelemetry(callback) {
  return telemetryHubInstance.subscribe(callback)
}
