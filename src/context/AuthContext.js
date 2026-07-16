import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuthUser, saveAuthUser, logoutUser, getProfile, saveProfile, updateRegisteredUser } from "../storage/fitnessStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth state from storage on app start
    const loadAuth = async () => {
      try {
        const auth = await getAuthUser();
        if (auth.isLoggedIn) {
          setUser(auth.user);
        }
      } catch (e) {
        console.error("Failed to load auth state", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const signIn = async (userData) => {
    try {
      await saveAuthUser(userData);
      
      // Sync with profile storage
      const currentProfile = await getProfile();
      await saveProfile({
        ...currentProfile,
        name: userData.name,
        email: userData.email,
        height: userData.height || currentProfile.height,
        weight: userData.weight || currentProfile.weight,
      });

      setUser(userData);
    } catch (e) {
      console.error("Failed to sign in", e);
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      await saveAuthUser(updatedUser);
      
      // Sync with master registered users list
      if (user?.email) {
        await updateRegisteredUser(user.email, newUserData);
      }

      setUser(updatedUser);
    } catch (e) {
      console.error("Failed to update user", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
