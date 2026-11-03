/**
 * Audio manager - Sound completely disabled per user preference.
 */
class SoundEffects {
  init() {}
  playCompletionChime() {}
  playClick() {}
}

export const soundManager = new SoundEffects()
