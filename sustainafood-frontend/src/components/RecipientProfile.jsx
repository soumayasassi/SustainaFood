"use client"

import { useState, useEffect } from "react"
import { getRequestsByRecipientId } from "../api/requestNeedsService"
import { Link } from "react-router-dom"
import { updateUserAvailability } from "../api/userService"

const RecipientProfile = ({ user }) => {
  const userid = user?._id || user?.id
  let loggedInUser = null
  try {
    const userData = localStorage.getItem("user")
    loggedInUser = userData ? JSON.parse(userData) : null
  } catch (err) {
    console.error("Error parsing loggedInUser from localStorage:", err)
  }
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id
  const isOwnProfile = loggedInUser && userid && String(userid) === String(loggedInUserId)

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 2

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(null)

  useEffect(() => {
    setIsAvailable(user?.isAvailable || false)
  }, [user?.isAvailable])

  useEffect(() => {
    const fetchRequests = async () => {
      if (!userid) {
        setError("User ID not found")
        setLoading(false)
        return
      }

      try {
        console.log("Fetching requests for user ID:", userid)
        const response = await getRequestsByRecipientId(userid)
        console.log("Requests Data:", response.data)
        setRequests(response.data || [])
      } catch (err) {
        if (err.response?.status === 404 && err.response?.data?.message === "No requests found for this recipient") {
          setRequests([])
        } else {
          console.error("Fetch Error:", err)
          setError(err.response?.data?.message || "Error fetching request data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [userid])

  const filteredRequests = requests
    .filter(
      (request) =>
        (request.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (request.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )
    .filter((request) => (statusFilter ? request.status === statusFilter : true))

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Pagination logic to show limited page numbers with ellipses
  const renderPaginationButtons = () => {
    const pageButtons = []
    const maxVisibleButtons = 5 // Maximum number of page buttons to show

    // Always show first page button
    pageButtons.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        style={{
          background: currentPage === 1 ? "#228b22" : "#f5f5f5",
          color: currentPage === 1 ? "white" : "#555",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "background 0.3s",
          margin: "0 4px",
          fontWeight: currentPage === 1 ? "bold" : "normal",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = currentPage === 1 ? "#1e7a1e" : "#e0e0e0"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = currentPage === 1 ? "#228b22" : "#f5f5f5"
        }}
      >
        1
      </button>,
    )

    // Calculate range of visible page buttons
    let startPage = Math.max(2, currentPage - Math.floor(maxVisibleButtons / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisibleButtons - 3)

    if (endPage - startPage < maxVisibleButtons - 3) {
      startPage = Math.max(2, endPage - (maxVisibleButtons - 3) + 1)
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageButtons.push(
        <span key="ellipsis1" style={{ margin: "0 4px", color: "#555" }}>
          ...
        </span>,
      )
    }

    // Add page buttons between start and end
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            background: currentPage === i ? "#228b22" : "#f5f5f5",
            color: currentPage === i ? "white" : "#555",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background 0.3s",
            margin: "0 4px",
            fontWeight: currentPage === i ? "bold" : "normal",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = currentPage === i ? "#1e7a1e" : "#e0e0e0"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = currentPage === i ? "#228b22" : "#f5f5f5"
          }}
        >
          {i}
        </button>,
      )
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageButtons.push(
        <span key="ellipsis2" style={{ margin: "0 4px", color: "#555" }}>
          ...
        </span>,
      )
    }

    // Always show last page button if there's more than one page
    if (totalPages > 1) {
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          style={{
            background: currentPage === totalPages ? "#228b22" : "#f5f5f5",
            color: currentPage === totalPages ? "white" : "#555",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background 0.3s",
            margin: "0 4px",
            fontWeight: currentPage === totalPages ? "bold" : "normal",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = currentPage === totalPages ? "#1e7a1e" : "#e0e0e0"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = currentPage === totalPages ? "#228b22" : "#f5f5f5"
          }}
        >
          {totalPages}
        </button>,
      )
    }

    return pageButtons
  }

  const handleToggleAvailability = async () => {
    if (!user?._id) {
      setAvailabilityError("User ID is missing. Cannot update availability.")
      return
    }

    setAvailabilityLoading(true)
    setAvailabilityError(null)

    try {
      const newAvailability = !isAvailable
      await updateUserAvailability(user._id, newAvailability)
      setIsAvailable(newAvailability)
    } catch (err) {
      let errorMessage = "Failed to update availability"

      if (err.response && err.response.data) {
        if (typeof err.response.data.message === "string") {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage =
            typeof err.response.data.error === "string"
              ? err.response.data.error
              : "An error occurred while updating availability"
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      setAvailabilityError(errorMessage)
      console.error("Error updating availability:", err)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div style={{ background: "#f5f9f5", padding: "20px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          maxWidth: "1200px",
          margin: "0 auto 20px",
          padding: "0 20px",
        }}
      >
  

        {isOwnProfile && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(34, 139, 34, 0.08)",
              border: "1px solid rgba(34, 139, 34, 0.12)",
              width: "530px",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(34, 139, 34, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: isAvailable ? "#4CAF50" : "#9e9e9e",
                  boxShadow: isAvailable ? "0 0 0 3px rgba(76, 175, 80, 0.2)" : "none",
                }}
              ></div>
              <h4
                style={{
                  color: "#2e7d32",
                  fontSize: "16px",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Availability Status
              </h4>
            </div>

            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  color: "#555",
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {isAvailable ? "Status: Available" : "Status: Not Available"}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={handleToggleAvailability}
                  disabled={availabilityLoading}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: availabilityLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    background: "#f0f0f0",
                    color: "#333",
                    opacity: availabilityLoading ? 0.7 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {availabilityLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          border: "2px solid rgba(0,0,0,0.1)",
                          borderTopColor: "#333",
                          animation: "spin 1s linear infinite",
                        }}
                      ></span>
                      Updating...
                    </span>
                  ) : isAvailable ? (
                    "Set Unavailable"
                  ) : (
                    "Set Available"
                  )}
                </button>
              </div>
            </div>

            {availabilityError && (
              <div
                style={{
                  padding: "0 16px 12px",
                  color: "#d32f2f",
                  fontSize: "13px",
                }}
              >
                {availabilityError}
              </div>
            )}
          </div>
        )}
        
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "10px",
            width: "100%",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "12px", top: "12px", color: "#666" }}>🔍</span>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 36px",
                fontSize: "16px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                outline: "none",
                transition: "all 0.3s",
                background: "white",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#228b22"
                e.target.style.boxShadow = "0px 0px 5px rgba(34, 139, 34, 0.3)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#ddd"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              border: "2px solid #ddd",
              borderRadius: "6px",
              outline: "none",
              background: "white",
              minWidth: "150px",
            }}
          >
            <option value="">🟢 All Statuses</option>
            <option value="pending">🕒 Pending</option>
            <option value="approved">✅ Accepted</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >
          {currentRequests.length > 0 ? (
            currentRequests.map((request) => (
              <div
                key={request._id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                  padding: "20px",
                  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)"
                  e.currentTarget.style.boxShadow = "0px 8px 15px rgba(0, 0, 0, 0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.05)"
                }}
              >
                <h5
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#228b22",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🛒</span> {request.title || "Untitled"}
                </h5>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#444",
                    lineHeight: "1.6",
                    margin: "5px 0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#ff4081", fontSize: "18px", marginTop: "2px" }}>📍</span>
                  <span>
                    <strong>Location:</strong> {request.address || "Not specified"}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#444",
                    lineHeight: "1.6",
                    margin: "5px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#2196f3", fontSize: "18px" }}>📆</span>
                  <span>
                    <strong>Before Date:</strong>{" "}
                    {request.expirationDate ? new Date(request.expirationDate).toISOString().split("T")[0] : "Not set"}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#444",
                    lineHeight: "1.6",
                    margin: "5px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#9c27b0", fontSize: "18px" }}>📑</span>
                  <span>
                    <strong>Details:</strong> {request.description || "No description"}
                  </span>
                </p>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#444",
                    lineHeight: "1.6",
                    margin: "5px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#03a9f4", fontSize: "18px" }}>🔄</span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "18px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "white",
                        background:
                          request.status === "pending"
                            ? "orange"
                            : request.status === "approved"
                              ? "#228b22"
                              : request.status === "rejected"
                                ? "red"
                                : "#666",
                      }}
                    >
                      {request.status || "Unknown"}
                    </span>
                  </span>
                </p>

                <div
                  style={{
                    marginTop: "15px",
                    borderTop: "1px solid #e0e0e0",
                    paddingTop: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#333",
                      margin: "0 0 5px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "#ff9800", fontSize: "18px" }}>📦</span> Requested Products:
                  </h4>

                  <div
                    style={{
                      background: "#f8f8f8",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    {Array.isArray(request.requestedProducts) && request.requestedProducts.length > 0 ? (
                      request.requestedProducts.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                            padding: "10px 15px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            marginBottom: index < request.requestedProducts.length - 1 ? "8px" : 0,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span>
                              <strong>Type:</strong> {item.product?.productType || "Not specified"}
                            </span>
                            <span>
                              <strong>Weight:</strong> {item.product?.weightPerUnit || 0}{" "}
                              {item.product?.weightUnit || ""}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>
                              <strong>Quantity:</strong> {item.product?.totalQuantity || 0}
                            </span>
                            <span>
                              <strong>Status:</strong> {item.product?.status || "Unknown"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          backgroundColor: "#e8f5e9",
                          color: "#2e7d32",
                          padding: "10px 15px",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      >
                        {request.category === "prepared_meals"
                          ? `🍽️ Number of meals: ${request.numberOfMeals || "Not specified"}`
                          : "No requested products"}
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/DetailsRequest/${request._id}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    background: "#228b22",
                    color: "white",
                    textAlign: "center",
                    marginTop: "15px",
                    transition: "background 0.3s ease-in-out",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e7a1e")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#228b22")}
                >
                  See More
                </Link>
              </div>
            ))
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                margin: "20px auto",
                gridColumn: "1 / -1",
              }}
            >
              <p style={{ fontSize: "18px", color: "#444", lineHeight: "1.6", marginBottom: "20px" }}>
                {user?._id === loggedInUserId
                  ? "It looks like you haven't made any requests yet! Share your needs and join us in making a difference—your next step could help someone in need!"
                  : `${user?.name || "User"} has not made any requests yet.`}
              </p>
              {user?._id === loggedInUserId && (
                <Link
                  to="/addRequest"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    background: "#228b22",
                    color: "white",
                    transition: "background 0.3s ease-in-out",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e7a1e")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#228b22")}
                >
                  Add a Request
                </Link>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                background: currentPage === 1 ? "#e0e0e0" : "#228b22",
                color: currentPage === 1 ? "#999" : "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                transition: "background 0.3s",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) e.currentTarget.style.background = "#1e7a1e"
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) e.currentTarget.style.background = "#228b22"
              }}
            >
              Previous
            </button>

            {renderPaginationButtons()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                background: currentPage === totalPages ? "#e0e0e0" : "#228b22",
                color: currentPage === totalPages ? "#999" : "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                transition: "background 0.3s",
                fontWeight: "bold",
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) e.currentTarget.style.background = "#1e7a1e"
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) e.currentTarget.style.background = "#228b22"
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default RecipientProfile
