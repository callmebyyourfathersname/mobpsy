// Zustand store — mirrors ProfileProvider + AppLockProvider + ProgressProvider
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Profile Store (mirrors ProfileProvider) ───────────────────────────────
export const useProfileStore = create((set, get) => ({
  profiles: [],
  activeProfile: null,

  loadProfiles: async () => {
    try {
      const json = await AsyncStorage.getItem('student_profiles');
      if (json) set({ profiles: JSON.parse(json) });
    } catch (_) {}
  },

  _saveProfiles: async (profiles) => {
    await AsyncStorage.setItem('student_profiles', JSON.stringify(profiles));
  },

  createProfile: async ({ name, iconEmoji, iconColor }) => {
    const profile = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      iconEmoji,
      iconColor,
      createdAt: new Date().toISOString(),
    };
    const profiles = [...get().profiles, profile];
    set({ profiles });
    await get()._saveProfiles(profiles);
    return profile;
  },

  setActiveProfile: (profile) => set({ activeProfile: profile }),

  clearActiveProfile: () => set({ activeProfile: null }),

  deleteProfile: async (id) => {
    const profiles = get().profiles.filter((p) => p.id !== id);
    const activeProfile = get().activeProfile?.id === id ? null : get().activeProfile;
    set({ profiles, activeProfile });
    await get()._saveProfiles(profiles);
  },
}));

// ─── Progress Store (mirrors ProgressProvider) ─────────────────────────────
export const useProgressStore = create((set, get) => ({
  progress: null,

  wordsDiscovered: () => {
    const p = get().progress;
    if (!p) return 0;
    return Object.values(p.wordProgress).filter((wp) => wp.isDiscovered).length;
  },

  wordsMastered: () => {
    const p = get().progress;
    if (!p) return 0;
    return Object.values(p.wordProgress).filter((wp) => wp.isMastered).length;
  },

  currentStreak: () => get().progress?.currentStreak ?? 0,

  loadProgress: async (studentId) => {
    try {
      const json = await AsyncStorage.getItem(`progress_${studentId}`);
      if (json) {
        set({ progress: JSON.parse(json) });
      } else {
        set({
          progress: {
            studentId,
            wordProgress: {},
            currentStreak: 0,
            totalSessions: 0,
          },
        });
      }
    } catch (_) {}
  },

  _saveProgress: async () => {
    const p = get().progress;
    if (!p) return;
    await AsyncStorage.setItem(`progress_${p.studentId}`, JSON.stringify(p));
  },

  discoverWord: async (wordId) => {
    const progress = { ...get().progress };
    if (!progress) return;
    if (!progress.wordProgress[wordId]) {
      progress.wordProgress[wordId] = { wordId, isDiscovered: false, isMastered: false, totalAttempts: 0, correctAttempts: 0, bestStars: 0 };
    }
    progress.wordProgress[wordId].isDiscovered = true;
    set({ progress });
    await get()._saveProgress();
  },

  recordIdentification: async ({ wordId, correct }) => {
    const progress = JSON.parse(JSON.stringify(get().progress));
    if (!progress) return;
    if (!progress.wordProgress[wordId]) {
      progress.wordProgress[wordId] = { wordId, isDiscovered: false, isMastered: false, totalAttempts: 0, correctAttempts: 0, bestStars: 0 };
    }
    const wp = progress.wordProgress[wordId];
    wp.totalAttempts++;
    if (correct) {
      wp.correctAttempts++;
      progress.currentStreak++;
      if (wp.correctAttempts >= 3 && !wp.isMastered) wp.isMastered = true;
    } else {
      progress.currentStreak = 0;
    }
    set({ progress });
    await get()._saveProgress();
  },

  recordSpelling: async ({ wordId, correct, stars }) => {
    const progress = JSON.parse(JSON.stringify(get().progress));
    if (!progress) return;
    if (!progress.wordProgress[wordId]) {
      progress.wordProgress[wordId] = { wordId, isDiscovered: false, isMastered: false, totalAttempts: 0, correctAttempts: 0, bestStars: 0 };
    }
    const wp = progress.wordProgress[wordId];
    wp.totalAttempts++;
    if (correct) {
      wp.correctAttempts++;
      if (stars > wp.bestStars) wp.bestStars = stars;
      progress.currentStreak++;
      if (wp.correctAttempts >= 3 && !wp.isMastered) wp.isMastered = true;
    } else {
      progress.currentStreak = 0;
    }
    set({ progress });
    await get()._saveProgress();
  },

  startSession: async () => {
    const progress = { ...get().progress };
    if (!progress) return;
    progress.totalSessions++;
    set({ progress });
    await get()._saveProgress();
  },

  getWordProgress: (wordId) => get().progress?.wordProgress?.[wordId] || null,

  clearProgress: () => set({ progress: null }),
}));

// ─── App Lock Store (mirrors AppLockProvider) ──────────────────────────────
export const useAppLockStore = create((set, get) => ({
  isLocked: false,
  _pin: '123456',

  lock: () => set({ isLocked: true }),

  unlock: (enteredPin) => {
    if (enteredPin === get()._pin) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  verifyPin: (enteredPin) => enteredPin === get()._pin,

  changePin: (newPin) => set({ _pin: newPin }),
}));
