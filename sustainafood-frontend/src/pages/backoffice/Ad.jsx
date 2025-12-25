"use client"

import { useEffect, useState } from "react"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import { toast } from "react-toastify"

const Ad = () => {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAd, setSelectedAd] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:3000/users/advertisements")
      const data = await response.json()
      if (response.ok) {
        setAds(data)
      } else {
        toast.error("Failed to fetch ads")
      }
    } catch (error) {
      console.error("Error fetching ads:", error)
      toast.error("Error fetching ads")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (adId, status) => {
    try {
      const response = await fetch(`http://localhost:3000/users/advertisements/${adId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status")
      }

      toast.success(`Advertisement ${status} successfully`)
      fetchAds()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error updating ad status:", error)
      toast.error(error.message || "Error updating ad status")
    }
  }

  const openModal = (ad) => {
    setSelectedAd(ad)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAd(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredAds = activeTab === "all" ? ads : ads.filter((ad) => ad.status === activeTab)

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending"
      case "approved":
        return "status-approved"
      case "rejected":
        return "status-rejected"
      default:
        return ""
    }
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="profile-container">
        <Navbar />

        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Advertisement Management</h1>
              <p className="dashboard-subtitle">Review and manage advertisement submissions</p>
            </div>
            <button onClick={fetchAds} className="refresh-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="ads-card">
            <div className="ads-card-header">
              <div className="ads-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Advertisement Dashboard
              </div>
            </div>

            <div className="ads-tabs">
              <div className="tabs-list">
                <button
                  className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Ads
                </button>
                <button
                  className={`tab-button ${activeTab === "pending" ? "active pending" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  Pending
                </button>
                <button
                  className={`tab-button ${activeTab === "approved" ? "active approved" : ""}`}
                  onClick={() => setActiveTab("approved")}
                >
                  Approved
                </button>
                <button
                  className={`tab-button ${activeTab === "rejected" ? "active rejected" : ""}`}
                  onClick={() => setActiveTab("rejected")}
                >
                  Rejected
                </button>
              </div>

              <div className="tab-content">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                  </div>
                ) : filteredAds.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <h3 className="empty-title">No advertisements found</h3>
                    <p className="empty-description">
                      {activeTab === "all"
                        ? "There are no advertisements in the system."
                        : `There are no ${activeTab} advertisements.`}
                    </p>
                  </div>
                ) : (
                  <div className="ads-table-container">
                    <table className="ads-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Status</th>
                          <th>Created At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAds.map((ad) => (
                          <tr key={ad._id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                </div>
                                <div className="user-info">
                                  <div className="user-name">{ad.user?.name || "Unknown User"}</div>
                                  <div className="user-email">
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                      <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    {ad.user?.email || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusColor(ad.status)}`}>
                                {ad.status === "pending" && (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                )}
                                {ad.status === "approved" && (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                )}
                                {ad.status === "rejected" && (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                  </svg>
                                )}
                                {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                              </span>
                            </td>
                            <td className="date-cell">{formatDate(ad.createdAt)}</td>
                            <td>
                              <button onClick={() => openModal(ad)} className="view-button">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing ad details */}
      {isModalOpen && selectedAd && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Advertisement Details</h3>
              <button onClick={closeModal} className="close-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-column">
                  <div className="info-section">
                    <h4 className="section-title">User Information</h4>
                    <div className="info-card">
                      <div className="user-profile">
                        <div className="user-avatar-large">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div>
                          <div className="user-name-large">{selectedAd.user?.name || "Unknown User"}</div>
                          <div className="user-role">{selectedAd.user?.role || "N/A"}</div>
                        </div>
                      </div>

                      <div className="info-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>{selectedAd.user?.email || "N/A"}</span>
                      </div>

                      <div className="info-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Created: {formatDate(selectedAd.createdAt)}</span>
                      </div>

                      <div className="info-item">
                        <span className={`status-badge ${getStatusColor(selectedAd.status)}`}>
                          {selectedAd.status === "pending" && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          )}
                          {selectedAd.status === "approved" && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          )}
                          {selectedAd.status === "rejected" && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          )}
                          {selectedAd.status.charAt(0).toUpperCase() + selectedAd.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedAd.status === "pending" && (
                    <div className="info-section">
                      <h4 className="section-title">Actions</h4>
                      <div className="info-card">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleStatusUpdate(selectedAd._id, "approved")}
                            className="approve-button"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(selectedAd._id, "rejected")}
                            className="reject-button"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                            </svg>
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-column">
                  <div className="info-section">
                    <h4 className="section-title">Advertisement Image</h4>
                    <div className="image-card">
                      <div className="ad-image-container">
                        <img
                          src={`http://localhost:3000/${selectedAd.imagePath}`}
                          alt="Advertisement"
                          className="ad-image"
                        />
                      </div>
                      <div className="image-footer">
                        <div className="image-label">Advertisement Preview</div>
                        <span className="image-badge">Image</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Base styles */
        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(to bottom right, #f0f8f0, #e9ecef);
        }

        .profile-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .dashboard-content {
          flex: 1;
          padding: 24px;
        }

        /* Dashboard header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a7a1a;
          margin: 0;
          line-height: 1.2;
        }

        .dashboard-subtitle {
          color: #3a5a3a;
          margin-top: 4px;
          font-size: 14px;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          border: 1px solid #c8e6c9;
          border-radius: 6px;
          font-size: 14px;
          color: #1a7a1a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background-color: #f1f8f1;
          border-color: #a5d6a7;
        }

        /* Card styles */
        .ads-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(34, 139, 34, 0.08);
          overflow: hidden;
        }

        .ads-card-header {
          background: linear-gradient(to right, #228b22, #56ab2f);
          padding: 24px;
          color: white;
        }

        .ads-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
        }

        /* Tabs */
        .ads-tabs {
          display: flex;
          flex-direction: column;
        }

        .tabs-list {
          display: flex;
          border-bottom: 1px solid #e8f5e9;
          padding: 0 24px;
        }

        .tab-button {
          padding: 16px 20px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #3a5a3a;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab-button:hover {
          color: #1a7a1a;
        }

        .tab-button.active {
          color: #228b22;
          font-weight: 600;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #228b22;
        }

        .tab-button.active.pending {
          color: #f59e0b;
        }

        .tab-button.active.pending::after {
          background-color: #f59e0b;
        }

        .tab-button.active.approved {
          color: #228b22;
        }

        .tab-button.active.approved::after {
          background-color: #228b22;
        }

        .tab-button.active.rejected {
          color: #ef4444;
        }

        .tab-button.active.rejected::after {
          background-color: #ef4444;
        }

        /* Loading state */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 48px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(34, 139, 34, 0.1);
          border-left-color: #228b22;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          text-align: center;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background-color: #e8f5e9;
          border-radius: 50%;
          color: #228b22;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1a7a1a;
        }

        .empty-description {
          color: #3a5a3a;
          font-size: 14px;
        }

        /* Table styles */
        .ads-table-container {
          overflow-x: auto;
        }

        .ads-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ads-table th {
          padding: 16px 24px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          color: #3a5a3a;
          background-color: #f1f8f1;
          border-bottom: 1px solid #e8f5e9;
        }

        .ads-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #e8f5e9;
          vertical-align: middle;
        }

        .ads-table tr:hover {
          background-color: #f1f8f1;
        }

        /* User cell */
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background-color: #e0f2e0;
          color:rgb(0, 0, 0);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 500;
          color: #1a7a1a;
        }

        .user-email {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #3a5a3a;
          margin-top: 2px;
        }

        /* Status badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-pending {
          background-color:rgb(150, 150, 150);
          color:rgb(251, 255, 0);
          border: 1px solid #ffedd5;
        }

        .status-approved {
          background-color:rgb(83, 83, 83);
          color:rgb(210, 255, 74);
          border: 1px solidrgb(246, 255, 151);
        }

        .status-rejected {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fee2e2;
        }

        /* Date cell */
        .date-cell {
          font-size: 13px;
          color: #3a5a3a;
        }

        /* View button */
        .view-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color:rgb(217, 249, 255);
          color:rgb(59, 114, 255);
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-button:hover {
          background-color: #c8e6c9;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .ad-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #e8f5e9;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a7a1a;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: none;
          cursor: pointer;
          color: #3a5a3a;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: #e8f5e9;
          color: #1a7a1a;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr;
          }
        }

        .info-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: #3a5a3a;
          margin-bottom: 12px;
        }

        .info-card {
          background-color: #f1f8f1;
          border-radius: 8px;
          padding: 16px;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .user-avatar-large {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background-color: #e0f2e0;
          color:rgb(0, 0, 0);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .user-name-large {
          font-weight: 600;
          color: #1a7a1a;
        }

        .user-role {
          font-size: 12px;
          color: #3a5a3a;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #3a5a3a;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        /* Image card */
        .image-card {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e8f5e9;
        }

        .ad-image-container {
          aspect-ratio: 16/9;
          background-color: #f1f8f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ad-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .image-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid #e8f5e9;
        }

        .image-label {
          font-size: 13px;
          color:rgb(88, 90, 58);
        }

        .image-badge {
          font-size: 12px;
          padding: 4px 8px;
          background-color: #f1f8f1;
          border-radius: 4px;
          color: #3a5a3a;
        }

        /* Action buttons */
        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .approve-button, .reject-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .approve-button {
          background-color: #228b22 !important;
          color: white;
        } 

        
        .reject-button {
          background-color: #ef4444 !important;
          color: white;
        }


        /* Responsive adjustments */
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .tabs-list {
            overflow-x: auto;
            padding: 0 16px;
          }

          .tab-button {
            padding: 16px 12px;
            white-space: nowrap;
          }

          .ads-table th, 
          .ads-table td {
            padding: 12px 16px;
          }

          .user-cell {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .user-avatar {
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  )
}

export default Ad
