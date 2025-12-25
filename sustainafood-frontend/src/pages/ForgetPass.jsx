import React, { useState,useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";  // ✅ Import Axios
import '../assets/styles/ForgetPass.css';

const ForgetPass = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Forget Password";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/users/forgot-password", { email });

      if (response.headers["content-type"].includes("application/json")) {
        console.log("Reset code sent:", response.data);

        // ✅ Redirect to ResetCode page with email as a query parameter
        navigate(`/reset-code?email=${encodeURIComponent(email)}`);
      } else {
        throw new Error("Unexpected response type");
      }
    } catch (err) {
      console.error("Error sending reset code", err);
      alert("Error: Unable to send reset code. Please try again.");
    }
  };

  return (
    <div className="forget-pass-container">
      <div className="forget-pass-card">
        <h2>Forgot Password?</h2>
        <p>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
};

export default ForgetPass;
