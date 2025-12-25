import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter as Router } from "react-router-dom";
import {GoogleOAuthProvider} from "@react-oauth/google"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
    <AuthProvider>
    <GoogleOAuthProvider clientId="956944465220-h2iu00f6if7r8a58tb69s34qt9etetli.apps.googleusercontent.com">
    <App />
    </GoogleOAuthProvider>
    </AuthProvider>
    </Router>
  </React.StrictMode>
);
