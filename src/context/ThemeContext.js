import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { THEMES } from "../theme/colors";
import { getSettings, saveSettings } from "../storage/fitnessStorage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState("rose");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await getSettings();
        if (settings.theme && THEMES[settings.theme]) {
          setThemeKey(settings.theme);
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (key) => {
    if (!THEMES[key]) return;
    setThemeKey(key);
    try {
      const settings = await getSettings();
      await saveSettings({ ...settings, theme: key });
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  }, []);

  const colors = THEMES[themeKey] || THEMES.rose;

  return (
    <ThemeContext.Provider value={{ colors, themeKey, setTheme, isLoading, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
