import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create the context
export const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Retrieve initial authentication state from localStorage safely
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    return storedToken && storedToken !== "undefined" ? storedToken : null;
  });
  // State for password reset
  const [resetStatus, setResetStatus] = useState(""); // Track reset status
  const [error, setError] = useState(""); // Track error messages
  const [loading, setLoading] = useState(false); // Track loading state

  // Login function
  const login = (userData, token , is2FAEnabled) => {
    setUser({ ...userData, is2FAEnabled }); // Include is2FAEnabled in user data
    console.log("User logged in:", userData);
    setToken(token);
    localStorage.setItem("user", JSON.stringify({ ...userData, is2FAEnabled }));
    localStorage.setItem("token", token);
    console.log("the token in local storge est from authicontext in fn login:", token)
    navigate("/profile"); // Redirect after login
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login"); // Redirect to login page
  };

  // Check if the user is authenticated
  const isAuthenticated = () => !!token;


    // Clear the welcome message
    const clearWelcomeMessage = () => {
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        const updatedUser = { ...prevUser, welcomeMessage: "" };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      });
    };

  // Send password reset code
  const sendResetCode = async (email) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/send-reset-code", { email });
      setResetStatus("Reset code sent successfully.");
      setLoading(false);
    } catch (err) {
      setError("Error sending reset code.");
      setLoading(false);
    }
  };
  // Validate the password reset code
  const validateResetCode = async (email, resetCode) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/validate-reset-code", { email, resetCode });
      setResetStatus("Reset code validated successfully.");
      setLoading(false);
    } catch (err) {
      setError("Invalid or expired reset code.");
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email, newPassword) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/reset-password", { email, newPassword });
      setResetStatus("Password successfully reset.");
      setLoading(false);
    } catch (err) {
      setError("Error resetting password.");
      setLoading(false);
    }
  };




  // Method to get the role of the current user
  const getRole = () => {
    return user?.role || null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated, getRole,
      sendResetCode,
      validateResetCode,
      resetPassword,
      clearWelcomeMessage,
      resetStatus,
      error,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;