/**
 * asyncKeys.js — PulseFit
 *
 * Single source of truth for ALL AsyncStorage keys used across the app.
 * Every key is prefixed with "@pulsefit/" to avoid collisions with other apps
 * sharing the same device storage.
 *
 * IMPORTANT: Never hardcode storage keys elsewhere; always import from here.
 */

export const KEYS = {
  // ── User Profile ──────────────────────────────────────────────────────────
  profile: "@pulsefit/profile",

  // ── Workout Data ──────────────────────────────────────────────────────────
  workoutPlans: "@pulsefit/workout_plans",   // custom saved plans
  workoutLogs: "@pulsefit/workout_logs",     // completed workout sessions
  workoutStats: "@pulsefit/workout_stats",   // aggregate stats (count, kcal, mins)

  // ── Weight & Progress ─────────────────────────────────────────────────────
  weightLogs: "@pulsefit/weight_logs",       // [{id, date, weight}]
  weightHistory: "@pulsefit/weight_history", // legacy alias — mapped in storage

  // ── Nutrition ─────────────────────────────────────────────────────────────
  // Single key holds the ENTIRE nutrition state for the current day.
  // Shape: { date: "YYYY-MM-DD", calories: number, goal: number, meals: [] }
  nutritionLogs: "@pulsefit/nutrition_logs",

  // ── Hydration ─────────────────────────────────────────────────────────────
  waterLogs: "@pulsefit/water_logs",         // [{id, date, ml}]

  // ── Streak / Gamification ─────────────────────────────────────────────────
  streak: "@pulsefit/streak",               // { current, best, lastDate }

  // ── App Settings ──────────────────────────────────────────────────────────
  settings: "@pulsefit/settings",

  // ── AI Coach Chat ─────────────────────────────────────────────────────────
  chatHistory: "@pulsefit/chat_history",    // [{ id, text, isUser }]

  // ── Authentication ────────────────────────────────────────────────────────
  auth: "@pulsefit/auth",                   // { isLoggedIn, user }
  registeredUsers: "@pulsefit/registered_users", // [{ email, password, name, height, weight }]
};
