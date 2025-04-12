import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  fetchUserProfile,
  loginUser,
  registerUser,
  logoutUser as apiLogout, // Renamed import
} from "../api";
import { FaSeedling } from "react-icons/fa";
import "../components/Preloader.css"; // Ensure path is correct

// --- Configuration ---
const MIN_PRELOADER_TIME_MS = 1500;

// Create the context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds the PROFILE object
  const [loading, setLoading] = useState(false); // Tracks *ongoing* specific operations (login, register, initial load)
  const [error, setError] = useState(null);

  // --- State for Preloader Control ---
  const [isInitialized, setIsInitialized] = useState(false); // Final initialization state
  const [authCheckComplete, setAuthCheckComplete] = useState(false); // Underlying auth check done?
  const [minTimeElapsed, setMinTimeElapsed] = useState(false); // Min preloader time passed?

  // --- Effect for Minimum Time ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_PRELOADER_TIME_MS);
    return () => clearTimeout(timer);
  }, []);

  // --- Effect to Finalize Initialization ---
  useEffect(() => {
    if (authCheckComplete && minTimeElapsed) {
      setIsInitialized(true);
    }
    // Reset initialized if auth check needs to happen again (e.g., after logout, handled there)
    // NO! Don't reset here. Let logout handle state clearing.
  }, [authCheckComplete, minTimeElapsed]);

  // --- Function to Load User Data (Profile) ---
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setAuthCheckComplete(true); // Mark check complete
      return; // Exit early if no token
    }

    // Only set loading true for the fetch itself if not already loading
    // This prevents interrupting login/register loading indicators
    // setLoading(true); // Let login/initial effect handle overall loading
    setError(null);

    try {
      const profileData = await fetchUserProfile();
      setUser(profileData);
    } catch (err) {
      console.error("Auth: Error loading user profile:", err);
      localStorage.removeItem("token"); // Clear invalid token
      setUser(null);
      // Don't necessarily set a global error here, let components handle display
    } finally {
      setAuthCheckComplete(true); // Mark check complete regardless of success/failure
      // setLoading(false); // Stop specific loading indicator if needed
    }
  }, []); // No dependencies, it fetches based on token presence

  // --- Initial Load Effect ---
  useEffect(() => {
    // Only run the initial check once
    if (!authCheckComplete && localStorage.getItem('token')) {
         console.log("Auth: Initial load effect triggered - fetching user.");
         setLoading(true); // Set loading true for initial fetch attempt
         loadUser().finally(() => setLoading(false)); // Ensure loading is false after attempt
    } else if (!localStorage.getItem('token')) {
        // If no token, mark check as complete immediately
        setAuthCheckComplete(true);
         setLoading(false); // Ensure loading is false if no token check needed
    }
  }, [loadUser, authCheckComplete]);

  // --- Login, Register, Logout Functions ---
  const login = async (credentials) => {
    setLoading(true); setError(null);
    try {
      const response = await loginUser(credentials);
      localStorage.setItem("token", response.access);
      setAuthCheckComplete(false); // Reset check flag to force profile reload via loadUser
      await loadUser(); // Reload profile data
      // Initialization will complete naturally via useEffects
      return response;
    } catch (err) {
      const errorMessage = err.message || "Login failed.";
      setError(errorMessage); setUser(null); localStorage.removeItem("token");
      throw err;
    } finally { setLoading(false); }
  };

  const register = async (userData) => {
    setLoading(true); setError(null);
    try {
      const response = await registerUser(userData);
      return response; // User needs to login separately
    } catch (err) {
       const errorMessage = err.message || "Registration failed.";
      setError(errorMessage);
      throw err;
    } finally { setLoading(false); }
  };

  // --- CORRECTED Logout Function ---
  const logout = async () => {
    console.log("Auth: Starting logout process...");
    try {
        await apiLogout(); // Calls the function from api.js (clears localStorage)
        // Optionally add backend call here if needed to invalidate token server-side
        localStorage.removeItem(`cart_${user?.user?.id}`); // Remove old user cart
        setUser(null);     // Clear user state
        setError(null);    // Clear any previous errors
        // DO NOT reset initialization flags here:
        // setAuthCheckComplete(false); // NO!
        // setIsInitialized(false);   // NO!
        // setMinTimeElapsed(false); // NO!
        console.log("Auth: User state cleared.");
        // Navigation will happen in the component calling logout
    } catch (error) {
        console.error("Auth: Error during logout:", error);
        setError("Logout failed. Please try again."); // Set error if needed
    }
    // No need to set loading state here unless apiLogout becomes a long async operation
  };
  // --- End Corrected Logout ---

  const hasRole = useCallback((role) => {
        if (!user || !user.user) return false;
        const actualUser = user.user;
        switch (role.toLowerCase()) {
          case "admin": return actualUser.is_staff || actualUser.is_superuser;
          case "farmer": return actualUser.is_farmer;
          case "buyer": return actualUser.is_buyer;
          default: return false;
        }
      }, [user]);

  // --- Context Value ---
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    initialized: isInitialized, // Controls the preloader
    error,
    login,
    register,
    logout, // Provide the corrected logout function
    hasRole,
    loadUser, // Provide loadUser for profile updates etc.
  };

  // --- Render Preloader or Children ---
  return (
    <AuthContext.Provider value={value}>
      {!isInitialized ? (
        <div className="preloader-container" aria-label="Loading application">
          <FaSeedling className="preloader-icon" />
          <p className="preloader-text">Cultivating your session...</p>
          <div className="preloader-dots"><span></span><span></span><span></span></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};