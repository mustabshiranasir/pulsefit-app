/**
 * storage.js — PulseFit Core Storage Utilities
 *
 * Low-level wrappers around AsyncStorage.
 * All other storage modules import from here — do NOT use AsyncStorage directly
 * in screens or components.
 *
 * Functions:
 *  saveData(key, value)  — serialize & persist
 *  loadData(key)         — load & deserialize; returns null if missing
 *  removeData(key)       — delete a key
 *  clearAllData()        — wipe every "@pulsefit/" key (full reset)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "./asyncKeys";

/**
 * Persist any JSON-serializable value under `key`.
 * @param {string} key   - one of KEYS.*
 * @param {*}      value - any serializable value
 */
export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[PulseFit] saveData failed:", key, e);
  }
}

/**
 * Load & deserialize the value stored under `key`.
 * Returns null if the key doesn't exist or parsing fails.
 * @param  {string} key
 * @returns {*|null}
 */
export async function loadData(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[PulseFit] loadData failed:", key, e);
    return null;
  }
}

/**
 * Remove a single key from AsyncStorage.
 * @param {string} key
 */
export async function removeData(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn("[PulseFit] removeData failed:", key, e);
  }
}

/**
 * Wipe ALL PulseFit data from AsyncStorage.
 * Used by the "Reset Progress" feature in Profile/Settings.
 * @returns {boolean} success flag
 */
export async function clearAllData() {
  try {
    // Get every key stored by this app and remove only ours
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter((k) => k.startsWith("@pulsefit/"));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
    return true;
  } catch (e) {
    console.warn("[PulseFit] clearAllData failed:", e);
    return false;
  }
}
