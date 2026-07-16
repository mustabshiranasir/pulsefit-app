/**
 * fitnessStorage.js — PulseFit Unified Backend
 *
 * This is the SINGLE import point for every screen.  All CRUD for every
 * feature is implemented here using AsyncStorage via the storage.js helpers.
 *
 * Sections:
 *  1. Profile
 *  2. Settings
 *  3. Workout Stats
 *  4. Weight History
 *  5. Nutrition / Meal Logs  ← Bug-fixed: deletion, port-consistency
 *  6. Water / Hydration
 *  7. Workout Logs
 *  8. Chat History
 *  9. Streak
 * 10. Full Reset
 */

import { KEYS } from "./asyncKeys";
import { saveData, loadData, clearAllData } from "./storage";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/** Default profile values shown before the user fills in their data */
const DEFAULT_PROFILE = {
  name: "Your Name",
  email: "your@email.com",
  gender: "Female",
  birthYear: "2000",
  height: "5ft 2in",   // stored as string
  weight: "55",     // kg as string
  goal: "50",       // target weight kg as string
  initials: "YN",
};

/**
 * Load the user's profile from AsyncStorage.
 * Returns DEFAULT_PROFILE if nothing is saved yet.
 */
export async function getProfile() {
  const data = await loadData(KEYS.profile);
  return data ?? DEFAULT_PROFILE;
}

/**
 * Save (overwrite) the entire profile object.
 * @param {object} profile - full profile object
 */
export async function saveProfile(profile) {
  await saveData(KEYS.profile, profile);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

/** Default settings used on first launch */
const DEFAULT_SETTINGS = {
  reminderTime: "20:00",
  restTime: "30",
  countdownTime: "10",
  soundEnabled: true,
  language: "English",
  units: "metric",
  darkMode: false,
  notificationsEnabled: true,
};

/**
 * Load app settings from AsyncStorage.
 * Returns DEFAULT_SETTINGS if nothing is saved yet.
 */
export async function getSettings() {
  const data = await loadData(KEYS.settings);
  // Merge with defaults so new keys are always present after app updates
  return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
}

/**
 * Save (overwrite) the entire settings object.
 * @param {object} settings - full settings object
 */
export async function saveSettings(settings) {
  await saveData(KEYS.settings, settings);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WORKOUT STATS (aggregate counters)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STATS = { workouts: 0, kcal: 0, minutes: 0 };

/**
 * Load aggregate workout stats { workouts, kcal, minutes }.
 */
export async function getWorkoutStats() {
  const data = await loadData(KEYS.workoutStats);
  return data ?? DEFAULT_STATS;
}

/**
 * Increment workout stats after a session completes.
 * @param {number} kcalBurned       - calories burned in this session
 * @param {number} durationMinutes  - duration in minutes
 * @returns {object} updated stats object
 */
export async function addWorkoutStat(kcalBurned, durationMinutes) {
  try {
    const current = await getWorkoutStats();
    const updated = {
      workouts: current.workouts + 1,
      kcal: current.kcal + (kcalBurned || 0),
      minutes: current.minutes + (durationMinutes || 0),
    };
    await saveData(KEYS.workoutStats, updated);

    // Also update the streak whenever a workout is completed
    await updateStreak();

    return updated;
  } catch (e) {
    console.warn("[PulseFit] addWorkoutStat failed:", e);
    return DEFAULT_STATS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. WEIGHT HISTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load full weight history array (newest last).
 * Each entry: { id, date (ISO), weight (number) }
 */
export async function getWeightHistory() {
  // Support both key names for backward compatibility
  const data = await loadData(KEYS.weightLogs);
  return Array.isArray(data) ? data : [];
}

/**
 * Append a new weight entry and keep the last 60 records.
 * @param {number|string} weight - weight in kg
 * @returns {object} the new entry
 */
export async function saveWeight(weight) {
  try {
    const history = await getWeightHistory();
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(weight),
    };
    // Keep most recent 60 entries
    const updated = [...history, entry].slice(-60);
    await saveData(KEYS.weightLogs, updated);
    return entry;
  } catch (e) {
    console.warn("[PulseFit] saveWeight failed:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NUTRITION / MEAL LOGS
//
// Root Bug Fix:
//   The old code stored meal data using nutritionStorage.js which used
//   KEYS.nutritionLogs, while fitnessStorage.js used a hardcoded key 'BMI_DATA'
//   and also called AsyncStorage directly via a separate 'PROFILE' key.
//   This caused different ports (Metro bundler instances) to read different
//   keys, making meal data inconsistent across reloads.
//
//   Fix: ALL nutrition reads/writes now go through a single key:
//   KEYS.nutritionLogs = "@pulsefit/nutrition_logs"
//   The daily data is date-stamped so each new day starts fresh automatically.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns today's date as "YYYY-MM-DD" string.
 * Used to detect when a new day starts and reset the log.
 */
function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Default meal structure — always restored if not present in saved data.
 * Keeping this here ensures the UI always gets 4 meal categories.
 */
const DEFAULT_MEALS = [
  { id: "1", title: "Breakfast", target: 500, consumed: 0, items: [], icon: "sunny", color: "#FFF9E6", iconColor: "#F6AD55", bg: "https://images.pexels.com/photos/103124/pexels-photo-103124.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "2", title: "Lunch", target: 700, consumed: 0, items: [], icon: "restaurant", color: "#EBFDF5", iconColor: "#48BB78", bg: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "3", title: "Dinner", target: 600, consumed: 0, items: [], icon: "moon", color: "#EBF4FF", iconColor: "#5A67D8", bg: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "4", title: "Snack", target: 200, consumed: 0, items: [], icon: "ice-cream", color: "#FFF5F7", iconColor: "#F687B3", bg: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

/**
 * Load today's nutrition data from AsyncStorage.
 * If stored date doesn't match today, returns a fresh daily snapshot
 * (preserving the user's calorie goal).
 *
 * @returns {{ date, calories, goal, meals }}
 */
export async function getNutritionData() {
  try {
    const stored = await loadData(KEYS.nutritionLogs);
    const today = todayDateString();

    if (!stored) {
      // First launch — no data at all
      return { date: today, calories: 0, goal: 2000, meals: DEFAULT_MEALS };
    }

    if (stored.date !== today) {
      // New day: reset calories & meals but keep the user's calorie goal
      return {
        date: today,
        calories: 0,
        goal: stored.goal || 2000,
        meals: DEFAULT_MEALS.map((m) => ({ ...m, consumed: 0, items: [] })),
      };
    }

    // Same day: restore saved state and merge with default meal structure
    // so newly added meal categories always appear
    const mergedMeals = DEFAULT_MEALS.map((defaultMeal) => {
      const saved = stored.meals?.find((m) => m.id === defaultMeal.id);
      // Spread default first so bg/icon/color are always present, then
      // overwrite with saved data (consumed, items)
      return saved ? { ...defaultMeal, ...saved } : defaultMeal;
    });

    return {
      date: stored.date,
      calories: stored.calories ?? 0,
      goal: stored.goal ?? 2000,
      meals: mergedMeals,
    };
  } catch (e) {
    console.warn("[PulseFit] getNutritionData failed:", e);
    return { date: todayDateString(), calories: 0, goal: 2000, meals: DEFAULT_MEALS };
  }
}

/**
 * Persist the entire nutrition state for today.
 * Called by NutritionScreen whenever state changes.
 *
 * @param {{ date, calories, goal, meals }} data
 */
export async function saveNutritionData(data) {
  try {
    // Always stamp with today so stale data is detected correctly
    await saveData(KEYS.nutritionLogs, {
      ...data,
      date: todayDateString(),
    });
  } catch (e) {
    console.warn("[PulseFit] saveNutritionData failed:", e);
  }
}

/**
 * Add a food item to a specific meal.
 * This is a full read-modify-write so it's atomic within a single call.
 *
 * @param {string} mealId   - "1"|"2"|"3"|"4"
 * @param {string} foodName - display name
 * @param {number} calories - kcal value
 * @returns {{ calories, meals }} updated nutrition state
 */
export async function addMealItem(mealId, foodName, calories) {
  try {
    const data = await getNutritionData();
    const newItem = {
      id: Date.now().toString(),
      name: foodName,
      cal: parseInt(calories, 10),
    };

    const updatedMeals = data.meals.map((meal) => {
      if (meal.id === mealId) {
        return {
          ...meal,
          consumed: meal.consumed + newItem.cal,
          items: [...meal.items, newItem],
        };
      }
      return meal;
    });

    const updated = {
      ...data,
      calories: data.calories + newItem.cal,
      meals: updatedMeals,
    };
    await saveNutritionData(updated);
    return updated;
  } catch (e) {
    console.warn("[PulseFit] addMealItem failed:", e);
    return null;
  }
}

/**
 * Edit an existing food item (name and/or calories).
 *
 * @param {string} mealId   - which meal
 * @param {string} itemId   - which item
 * @param {string} foodName - new name
 * @param {number} calories - new calorie value
 * @returns updated nutrition state
 */
export async function editMealItem(mealId, itemId, foodName, calories) {
  try {
    const data = await getNutritionData();
    const newCal = parseInt(calories, 10);
    let calDiff = 0;

    const updatedMeals = data.meals.map((meal) => {
      if (meal.id === mealId) {
        const updatedItems = meal.items.map((item) => {
          if (item.id === itemId) {
            calDiff = newCal - item.cal; // positive = more cals, negative = fewer
            return { ...item, name: foodName, cal: newCal };
          }
          return item;
        });
        return {
          ...meal,
          consumed: Math.max(0, meal.consumed + calDiff),
          items: updatedItems,
        };
      }
      return meal;
    });

    const updated = {
      ...data,
      calories: Math.max(0, data.calories + calDiff),
      meals: updatedMeals,
    };
    await saveNutritionData(updated);
    return updated;
  } catch (e) {
    console.warn("[PulseFit] editMealItem failed:", e);
    return null;
  }
}

/**
 * Delete a food item from a meal.
 *
 * Bug fix: the previous implementation only updated React state but did NOT
 * call saveNutritionData, so the item reappeared after navigation or reload.
 * This function performs the full read-modify-write and persists the result.
 *
 * @param {string} mealId - which meal
 * @param {string} itemId - which item to remove
 * @returns updated nutrition state
 */
export async function deleteMealItem(mealId, itemId) {
  try {
    const data = await getNutritionData();
    let calsRemoved = 0;

    const updatedMeals = data.meals.map((meal) => {
      if (meal.id !== mealId) return meal;
      const item = meal.items.find((i) => i.id === itemId);
      if (!item) {
        console.warn("[PulseFit] deleteMealItem: item not found", itemId);
        return meal;
      }
      calsRemoved = item.cal;
      console.log("[PulseFit] Deleting item:", item.name, item.cal, "kcal");
      return {
        ...meal,
        consumed: Math.max(0, meal.consumed - calsRemoved),
        items: meal.items.filter((i) => i.id !== itemId),
      };
    });

    const updated = {
      ...data,
      calories: Math.max(0, data.calories - calsRemoved),
      meals: updatedMeals,
    };

    await saveNutritionData(updated);
    console.log("[PulseFit] deleteMealItem saved. New calories:", updated.calories);
    return updated;
  } catch (e) {
    console.warn("[PulseFit] deleteMealItem failed:", e);
    return null;
  }
}

/**
 * Clear all items from a single meal category.
 *
 * @param {string} mealId
 * @returns updated nutrition state
 */
export async function clearMeal(mealId) {
  try {
    const data = await getNutritionData();
    let calsRemoved = 0;

    const updatedMeals = data.meals.map((meal) => {
      if (meal.id === mealId) {
        calsRemoved = meal.consumed;
        return { ...meal, consumed: 0, items: [] };
      }
      return meal;
    });

    const updated = {
      ...data,
      calories: Math.max(0, data.calories - calsRemoved),
      meals: updatedMeals,
    };
    await saveNutritionData(updated);
    return updated;
  } catch (e) {
    console.warn("[PulseFit] clearMeal failed:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. WATER / HYDRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load today's water intake in ml.
 * @returns {number} ml consumed today
 */
export async function getWaterToday() {
  try {
    const logs = await loadData(KEYS.waterLogs);
    if (!Array.isArray(logs)) return 0;
    const today = todayDateString();
    return logs
      .filter((l) => l.date && l.date.startsWith(today))
      .reduce((sum, l) => sum + (l.ml || 0), 0);
  } catch (e) {
    return 0;
  }
}

/**
 * Log a water intake entry.
 * @param {number} ml - millilitres consumed
 */
export async function logWater(ml) {
  try {
    const logs = (await loadData(KEYS.waterLogs)) ?? [];
    const entry = { id: Date.now().toString(), date: new Date().toISOString(), ml };
    const updated = [...logs, entry].slice(-200); // keep last 200 entries
    await saveData(KEYS.waterLogs, updated);
    return entry;
  } catch (e) {
    console.warn("[PulseFit] logWater failed:", e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. WORKOUT LOGS (session records)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all saved workout session logs.
 * Each log: { id, date, name, exercises, volume, durationMins, calories }
 */
export async function getWorkoutLogs() {
  const data = await loadData(KEYS.workoutLogs);
  return Array.isArray(data) ? data : [];
}

/**
 * Save a completed workout session.
 * @param {object} entry - partial log (name, exercises, etc.)
 * @returns {object} saved log entry with auto-generated id/date
 */
export async function addWorkoutLog(entry) {
  try {
    const logs = await getWorkoutLogs();
    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      volume: 0,
      durationMins: 0,
      calories: 0,
      exercises: [],
      ...entry,
    };
    await saveData(KEYS.workoutLogs, [...logs, newLog]);
    return newLog;
  } catch (e) {
    console.warn("[PulseFit] addWorkoutLog failed:", e);
    return null;
  }
}

/**
 * Delete a workout log by id.
 * @param {string} id
 */
export async function deleteWorkoutLog(id) {
  try {
    const logs = await getWorkoutLogs();
    await saveData(KEYS.workoutLogs, logs.filter((l) => l.id !== id));
  } catch (e) {
    console.warn("[PulseFit] deleteWorkoutLog failed:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CHAT HISTORY (AI Coach)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load the full coach chat history.
 * Each message: { id, text, isUser }
 */
export async function getChatHistory() {
  const data = await loadData(KEYS.chatHistory);
  return Array.isArray(data) ? data : [];
}

/**
 * Append a single message to the chat history.
 * @param {{ id, text, isUser }} message
 * @returns {Array} updated history
 */
export async function saveChatMessage(message) {
  try {
    const history = await getChatHistory();
    const updated = [...history, message].slice(-200); // keep last 200 msgs
    await saveData(KEYS.chatHistory, updated);
    return updated;
  } catch (e) {
    console.warn("[PulseFit] saveChatMessage failed:", e);
    return [];
  }
}

/**
 * Clear the entire chat history (start fresh).
 */
export async function clearChatHistory() {
  await saveData(KEYS.chatHistory, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. STREAK
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STREAK = { current: 0, best: 0, lastDate: null };

export async function getStreak() {
  const data = await loadData(KEYS.streak);
  return data ?? DEFAULT_STREAK;
}

/**
 * Bump the streak counter when a workout is completed.
 * Skips if a workout was already logged today.
 */
export async function updateStreak() {
  try {
    const streak = await getStreak();
    const today = todayDateString();

    if (streak.lastDate === today) return streak; // already counted today

    // Check if yesterday was logged (consecutive)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const newCurrent = streak.lastDate === yStr ? streak.current + 1 : 1;
    const updated = {
      current: newCurrent,
      best: Math.max(newCurrent, streak.best),
      lastDate: today,
    };
    await saveData(KEYS.streak, updated);
    return updated;
  } catch (e) {
    return DEFAULT_STREAK;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. FULL RESET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wipe ALL app data from AsyncStorage.
 * Screens should navigate back to Home after calling this.
 * @returns {boolean} success flag
 */
export async function resetAllData() {
  return await clearAllData();
}
// ─────────────────────────────────────────────────────────────────────────────
// 11. AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current authentication state.
 */
export async function getAuthUser() {
  const data = await loadData(KEYS.auth);
  return data ?? { isLoggedIn: false, user: null };
}

/**
 * Save the authentication state.
 */
export async function saveAuthUser(user) {
  await saveData(KEYS.auth, { isLoggedIn: true, user });
}

/**
 * Log out the user by clearing the auth key.
 */
export async function logoutUser() {
  await saveData(KEYS.auth, { isLoggedIn: false, user: null });
}

/**
 * Get all registered users.
 */
export async function getRegisteredUsers() {
  const users = await loadData(KEYS.registeredUsers);
  return users ?? [];
}

/**
 * Register a new user.
 */
export async function registerUser(user) {
  const users = await getRegisteredUsers();
  if (users.find(u => u.email === user.email)) {
    return { success: false, message: "User already exists" };
  }
  const updatedUsers = [...users, user];
  await saveData(KEYS.registeredUsers, updatedUsers);
  return { success: true };
}

/**
 * Validate login.
 */
export async function validateLogin(email, password) {
  const users = await getRegisteredUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    return { success: false, errorType: "NOT_REGISTERED", message: "You are not registered yet!" };
  }
  if (user.password !== password) {
    return { success: false, errorType: "WRONG_PASSWORD", message: "Incorrect password" };
  }
  return { success: true, user };
}

/**
 * Update a registered user's data in the master list.
 */
export async function updateRegisteredUser(email, updates) {
  try {
    const users = await getRegisteredUsers();
    const updatedUsers = users.map(u => {
      if (u.email === email) {
        return { ...u, ...updates };
      }
      return u;
    });
    await saveData(KEYS.registeredUsers, updatedUsers);
  } catch (e) {
    console.error("Failed to update registered user", e);
  }
}
