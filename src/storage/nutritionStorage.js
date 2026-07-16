/**
 * nutritionStorage.js — PulseFit
 *
 * BACKWARD-COMPATIBILITY SHIM ONLY.
 * All logic has moved to fitnessStorage.js.
 * This file simply re-exports the canonical functions so any import
 * of nutritionStorage still works without a search-and-replace.
 */

export {
  getNutritionData,
  saveNutritionData,
  addMealItem,
  editMealItem,
  deleteMealItem,
  clearMeal,
} from "./fitnessStorage";
