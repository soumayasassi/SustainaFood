import { Link } from "react-router-dom"
import Navbar from "../components/Navbar" // Import the Navbar component
import Footer from "../components/Footer" // Import the Footer component
import "../assets/styles/Notfound.css" // Import the styles for the NotFound page
import { useEffect } from "react"
const NotFound = () => {
   // Set the page title dynamically
   useEffect(() => {
    document.title = "SustainaFood -  Not Found";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    return (
      <div className="notfound-container">
  
        <div className="notfound-content">
          <div className="notfound-card">
            <div className="notfound-icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="notfound-icon"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>
  
            <h1 className="notfound-title">404</h1>
            <h2 className="notfound-subtitle">Page Not Found</h2>
  
            <p className="notfound-message">
              We couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
            </p>
  
            <div className="notfound-actions">
              <Link to="/" className="notfound-btn notfound-btn-primary">
                Return Home
              </Link>
              <Link to="/contact" className="notfound-btn notfound-btn-secondary">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
  
      </div>
    )
  }
  
  export default NotFound
  
  
