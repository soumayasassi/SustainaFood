import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../assets/styles/ForgetPass.css';

const ResetCode = () => {
  const [resetCode, setResetCode] = useState("");
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const email = searchParams.get('email');
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood -  ResetCode";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/users/reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, resetCode }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Reset code verified');
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        alert(data.error || 'Invalid reset code');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error verifying reset code');
    }
  };

  return (
    <div className="forget-pass-container">
      <div className="forget-pass-card">
        <h2>Enter Reset Code</h2>
        <p>Check your email for the reset code and enter it below.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter the reset code"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            required
          />
          <button type="submit">Verify Code</button>
        </form>
      </div>
    </div>
  );
};

export default ResetCode;