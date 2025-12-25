import React, { useState ,useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import '../assets/styles/ForgetPass.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const email = searchParams.get('email');
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - ResetPassword";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Password reset successfully');
        navigate('/login');
      } else {
        alert(data.error || 'Error resetting password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error resetting password');
    }
  };

  return (
    <div className="forget-pass-container">
      <div className="forget-pass-card">
        <h2>Reset Your Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;