/**
 * workoutStorage.js — PulseFit
 *
 * BACKWARD-COMPATIBILITY SHIM ONLY.
 * All logic has moved to fitnessStorage.js.
 */

export {
  getWorkoutLogs,
  addWorkoutLog,
  deleteWorkoutLog,
  getWeightHistory as getWeightLogs,
  saveWeight as addWeightLog,
} from "./fitnessStorage";
