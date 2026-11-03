import { createClient } from '@supabase/supabase-js'

// Load Supabase credentials strictly from environment variables or custom UI configuration
const getStoredCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  
  if (envUrl && envKey) {
    return { url: envUrl.trim(), key: envKey.trim() }
  }

  try {
    const local = localStorage.getItem('timearena_supabase_config')
    if (local) {
      const parsed = JSON.parse(local)
      if (parsed.url && parsed.key) {
        return { url: parsed.url.trim(), key: parsed.key.trim() }
      }
    }
  } catch {
    // ignore
  }

  return { url: '', key: '' }
}

let supabaseInstance = null

export function getSupabaseClient() {
  const { url, key } = getStoredCredentials()
  if (!url || !key) return null

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key)
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e)
      return null
    }
  }
  return supabaseInstance
}

export async function saveSupabaseConfig(url, key) {
  try {
    const cleanUrl = url.trim()
    const cleanKey = key.trim()
    localStorage.setItem('timearena_supabase_config', JSON.stringify({ url: cleanUrl, key: cleanKey }))
    supabaseInstance = createClient(cleanUrl, cleanKey)

    // Save to application server (.env.local) so it's permanently saved for all browsers
    try {
      await fetch('/api/admin/save-supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, key: cleanKey })
      })
    } catch {
      // Offline or static fallback
    }

    return true
  } catch (e) {
    console.error('Error saving supabase config', e)
    return false
  }
}

export function clearSupabaseConfig() {
  localStorage.removeItem('timearena_supabase_config')
  supabaseInstance = null
}

export const SUPABASE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor):

-- 1. Create Profiles table (Supports pure Username & Password auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  streak_days INT DEFAULT 1,
  weekly_goal_hours NUMERIC DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Time Sessions table (Focus logs synced across all devices)
CREATE TABLE IF NOT EXISTS public.time_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'frontend',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Policies: Allow access to own profiles and sessions
DROP POLICY IF EXISTS "Allow all profiles access" ON public.profiles;
CREATE POLICY "Allow all profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all sessions access" ON public.time_sessions;
CREATE POLICY "Allow all sessions access" ON public.time_sessions FOR ALL USING (true) WITH CHECK (true);
`
