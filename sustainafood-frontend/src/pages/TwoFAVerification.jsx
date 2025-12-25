import React, { useState ,useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { validate2FACode } from "../api/userService";

const TwoFAVerification = () => {
    const [code, setCode] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const email = new URLSearchParams(location.search).get("email");
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await validate2FACode({ email, twoFACode: code.toString() });
            console.log("API Response:", response);
            if (response.status === 200) {
                const { token, role, id } = response.data;
                if (!token || !role || !id) {
                    throw new Error("Missing token, role, or id in response");
                }
                login({ id, role, email }, token, false);
                navigate("/profile");
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error verifying 2FA code:", {
                message: error.message,
                response: error.response ? error.response.data : "No response",
                status: error.response ? error.response.status : "No status",
                request: error.request ? error.request : "No request",
            });
            if (error.response && error.response.status === 500) {
                alert("Server error occurred. Please try again later or contact support.");
            } else if (error.response) {
                alert(error.response.data.error || "Invalid 2FA code");
            } else {
                alert("An unexpected error occurred. Check the console for details.");
            }
        }
    };

    return (
        <div className="forget-pass-container">
            <div className="forget-pass-card">
                <h2>2FA Verification</h2>
                <p>Check your phone for the 2FA code and enter it below.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter the 2FA code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                    <button type="submit">Verify Code</button>
                </form>
            </div>
        </div>
    );
};

export default TwoFAVerification;