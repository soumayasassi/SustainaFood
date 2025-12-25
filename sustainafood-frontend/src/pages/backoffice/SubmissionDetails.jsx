"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, Link } from "react-router-dom"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import "/src/assets/styles/backoffcss/detailspage.css"

const SubmissionDetails = () => {
  const { id } = useParams()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Submission Details";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/contact/contact/submissions/${id}`)
      .then((response) => {
        setSubmission(response.data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching submission:", error)
        setError("Failed to load submission.")
        setLoading(false)
      })
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  if (!submission) return <div>Submission not found.</div>

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />
        <div className="detailspage-container">
          <div className="detailspage-header">
            <h2 className="detailspage-title">Submission Details</h2>
            <Link to="/contact/submissions" className="detailspage-button detailspage-button-secondary">
              Back to List
            </Link>
          </div>

          <div className="detailspage-content">
            <div className="detailspage-field-group">
              <div className="detailspage-field">
                <div className="detailspage-field-label">ID:</div>
                <div className="detailspage-field-value">{submission._id}</div>
              </div>

              <div className="detailspage-field">
                <div className="detailspage-field-label">Name:</div>
                <div className="detailspage-field-value">{submission.name}</div>
              </div>

              <div className="detailspage-field">
                <div className="detailspage-field-label">Email:</div>
                <div className="detailspage-field-value">{submission.email}</div>
              </div>

              <div className="detailspage-field">
                <div className="detailspage-field-label">Status:</div>
                <div className="detailspage-field-value">
                  <span className={`detailspage-status detailspage-status-${submission.status}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="detailspage-field">
                <div className="detailspage-field-label">Submitted At:</div>
                <div className="detailspage-field-value">{new Date(submission.submittedAt).toLocaleString()}</div>
              </div>

              <div className="detailspage-field">
                <div className="detailspage-field-label">Comment:</div>
                <div className="detailspage-field-value">
                  <div className="detailspage-long-text">{submission.comment}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="detailspage-actions">
            {submission.status === "pending" && (
              <button className="detailspage-button detailspage-button-primary">Mark as Responded</button>
            )}
            <Link to="/contact/submissions" className="detailspage-button detailspage-button-secondary">
              Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionDetails
