import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/styles/AccountSettings.css";
import { useAuth } from "../contexts/AuthContext";
import { deactivateAccount, changePassword, toggle2FA, getUserById } from "../api/userService";
import ConfirmationModal from "../pages/ConfirmationModal"; // Import the ConfirmationModal

const AccountSettings = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const { user, token, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State for confirmation modal
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Account Settings";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlertMessage("New password and Confirm password do not match!");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    try {
      const response = await changePassword(user.id, currentPassword, newPassword);

      if (response.status === 200) {
        setAlertMessage("Password changed successfully!");
        setAlertType("success");
        setShowAlert(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setAlertMessage(error.response?.data?.error || "Failed to change password");
      setAlertType("error");
      setShowAlert(true);
    }
  };

  const handleDeactivateAccount = async () => {
    setShowConfirmationModal(true); // Show the confirmation modal
  };

  const confirmDeactivateAccount = async () => {
    setShowConfirmationModal(false); // Hide the confirmation modal

    if (user && user.id) {
      try {
        const response = await deactivateAccount(user.id, token);

        if (response.status === 200) {
          setAlertMessage("Your account has been deactivated. You can reactivate it by logging in.");
          setAlertType("success");
          setShowAlert(true);

          // Delay the logout to allow the alert to be displayed
          setTimeout(() => {
            logout();
          }, 3000); // Logout after 3 seconds
        }
      } catch (error) {
        console.error("Error deactivating account:", error);
        setAlertMessage("Failed to deactivate account. Please try again.");
        setAlertType("error");
        setShowAlert(true);
      }
    } else {
      setAlertMessage("User information is not available. Please try again.");
      setAlertType("error");
      setShowAlert(true);
    }
  };

  const cancelDeactivateAccount = () => {
    setShowConfirmationModal(false); // Hide the confirmation modal
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getUserById(user.id);
        setIs2FAEnabled(response.data.is2FAEnabled);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user.id]);

  const handle2FAToggle = async () => {
    try {
      const response = await toggle2FA(user.email);

      if (response.status === 200) {
        setIs2FAEnabled(!is2FAEnabled);
        setAlertMessage(`2FA has been ${!is2FAEnabled ? "enabled" : "disabled"}.`);
        setAlertType("success");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      setAlertMessage("Failed to toggle 2FA. Please try again.");
      setAlertType("error");
      setShowAlert(true);
    }
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000); // Dismiss after 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [showAlert]);

  return (
    <div className="accountsettings-page">
      <Navbar />
      {showAlert && (
        <div className={`custom-alert ${alertType}`}>
          <div className="alert-content">
            {alertType === "success" && (
              <div className="alert-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {alertType === "error" && (
              <div className="alert-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
            <span>{alertMessage}</span>
            <button className="alert-close" onClick={() => setShowAlert(false)} aria-label="Close alert">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {/* Animated progress bar for auto-dismiss */}
          <div className="alert-progress"></div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <ConfirmationModal
          message="Are you sure you want to deactivate your account? You can reactivate it later by logging in."
          onConfirm={confirmDeactivateAccount}
          onCancel={cancelDeactivateAccount}
        />
      )}

      <div className="accountsettings-content">
        <div className="accountsettings-container">
          <h1 className="accountsettings-title">Account Settings</h1>

          {/* Change Password Section */}
          <section className="accountsettings-section">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="accountsettings-form">
              <div className="accountsettings-form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="accountsettings-form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="accountsettings-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="accountsettings-button">
                Change Password
              </button>
            </form>
          </section>

          {/* 2FA Section */}
          <section className="accountsettings-section">
            <h2>Two-Factor Authentication (2FA)</h2>
            <div className="accountsettings-twofa-toggle">
              <label className="accountsettings-switch">
                <input
                  type="checkbox"
                  checked={is2FAEnabled}
                  onChange={handle2FAToggle}
                />
                <span className="accountsettings-slider accountsettings-round"></span>
              </label>
              <span>{is2FAEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            {is2FAEnabled && <p>2FA is enabled. Use an authenticator app to generate codes.</p>}
          </section>

          {/* Deactivate Account Section */}
          <section className="accountsettings-section">
            <h2>Deactivate Account</h2>
            <p>
              Warning: Deactivating your account will temporarily suspend your access to
              SustainaFood. Your data will be preserved, and you can reactivate your account at
              any time by logging in.
            </p>
            <button
              onClick={handleDeactivateAccount}
              className="accountsettings-button accountsettings-deactivate"
            >
              Deactivate Account
            </button>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AccountSettings;