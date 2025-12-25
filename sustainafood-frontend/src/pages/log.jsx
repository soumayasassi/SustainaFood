import { useState, useContext , useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { loginUser } from "../api/userService"; // Ensure this is correctly imported
import { useGoogleLogin } from "@react-oauth/google";
import { createuser,getUserById } from '../api/userService'; // Exemple d'import

import "../assets/styles/log.css";
import logo from "../assets/images/LogoCh.png";
import loginImg from "../assets/images/Login-PNG-HD-Image.png";
import gglimg from "../assets/images/ggl.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";




const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Login";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const response = await loginUser({ email, password });

            if (response?.data?.requires2FA) {
                navigate(`/two-fa-verification?email=${encodeURIComponent(email)}`);
            } else if (response?.data?.token) {
                const userData = {
                    id: response.data.id,
                    role: response.data.role,
                    email,
                    welcomeMessage: response.data.message,
                };
                login(userData, response.data.token);

                if (userData.role === "admin") {
                    navigate("/dashboard");
                } else {
                    navigate("/profile");
                }
            } else {
                setError("Authentication failed. Please check your credentials.");
            }
        } catch (err) {
            console.error("Backend error:", err.response?.data || err.message);
            setError(err.response?.data?.error || "Login error.");
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        flow: "implicit", // Au lieu de "implicit"
        onSuccess: async (tokenResponse) => {
            try {
                if (!tokenResponse || !tokenResponse.access_token) {
                    setError("Google login error.");
                    console.error("Token Response Error:", error);
                    return;
                }
                

                const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoResponse.json();

                localStorage.setItem("email from google", userInfo.email);
                localStorage.setItem("id from google", userInfo.sub);

                const userData = {
                    email: userInfo.email,
                    name: userInfo.name,
                    photo: userInfo.picture,
                };

                const response = await createuser(userData);
                const user = await getUserById(response.data.id);
                login(user.data, tokenResponse.access_token);

                localStorage.setItem("user_id", response.data.id);

                if (!user.data.role) {
                    navigate("/Continueinfo");
                } else if (user.data.is2FAEnabled) {
                    navigate(`/two-fa-verification?email=${encodeURIComponent(user.data.email)}`);
                } else {
                    navigate("/profile");
                }
            } catch (error) {
                console.error("API error:", error.response ? error.response.data : error.message);
                setError("Google login error.");
            }
        },
        onError: (error) => {
            console.error("Google login failed", error);
            setError("Google login failed.");
        },
    });

    const handleForgotPassword = () => {
        navigate("/forget-password");
    };

    const togglePanel = () => {
        setIsRightPanelActive(!isRightPanelActive);
    };

    return (
        <div className="aa">
            <div className={`signup-container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
                <div className="signup-form-container signup-sign-up-container">
                    <form className="signup-form" onSubmit={handleLogin}>
                        <h1 className="signup-h1">Sign in</h1>
                        <div className="signup-social-container">
                            <a href="#" className="signup-social" onClick={handleGoogleLogin}>
                                <img src={gglimg} alt="Google" />
                            </a>
                        </div>
                        <span>or use your account</span>

                        <input
                            className="signup-input"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className="signup-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span className="auth-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>

                        {error && <p className="error-message">{error}</p>}

                        <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                            <label className="ios-checkbox green">
                                <input type="checkbox" />
                                <div className="checkbox-wrapper">
                                    <div className="checkbox-bg"></div>
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                        <path
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            strokeWidth="3"
                                            stroke="currentColor"
                                            d="M4 12L10 18L20 6"
                                            className="check-path"
                                        />
                                    </svg>
                                </div>
                            </label>
                            <span style={{ fontSize: "14px", marginLeft: "5px" }}>Remember me</span>
                            <a href="#" className="signup-a" onClick={handleForgotPassword} style={{ marginLeft: "190px" }}>
                                Forgot your password?
                            </a>
                        </div>

                        <button type="submit" className="signup-button">
                            Sign In
                        </button>
                        <div>
                            <span style={{ fontSize: "14px" }}>
                                Don't have an account? <a href="/signup">Sign Up</a>
                            </span>
                        </div>
                    </form>
                </div>

                <div className="signup-form-container signup-sign-in-container">
                    <form className="signup-form">
                        <img src={logo} alt="Logo" className="signup-logo" />
                        <p className="signup-p">
                            Thank you for joining us on a mission to reduce food waste and make a positive impact.
                        </p>
                    </form>
                </div>

                <div className="signup-overlay-container">
                    <div className="signup-overlay">
                        <div className="signup-overlay-panel signup-overlay-left">
                            <img src={loginImg} alt="Login" className="signup-logo" />
                            <button className="signbtn" onClick={togglePanel}>
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                        </div>
                        <div className="signup-overlay-panel signup-overlay-right">
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button className="signbtn" onClick={togglePanel}>
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;