"use client"

import { useEffect, useState } from "react"
import { FaSearch, FaCheckCircle, FaTimesCircle, FaTruck, FaChevronDown } from "react-icons/fa"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  acceptOrRefuseDelivery,
  getDeliveriesByTransporter,
  startJourney,
  updateDeliveryStatus,
} from "../api/deliveryService"
import { createFeedback } from "../api/feedbackService"
import { getRequestById } from "../api/requestNeedsService"
import { getUserById, updateTransporterLocation } from "../api/userService"
import imgmouna from "../assets/images/imgmouna.png"
import DeleveryMap from "../components/DeleveryMap"
import Footer from "../components/Footer"
import Navbar from "../components/Navbar"
import StarRating from "../components/StarRating"
import { useAlert } from "../contexts/AlertContext"
import "../assets/styles/assigned-deliveries.css"

const AssignedDeliveries = () => {
  const { showAlert } = useAlert()
  const { transporterId } = useParams()
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(3)
  const [filterOption, setFilterOption] = useState("all")
  const [sortOption, setSortOption] = useState("date")
  const [searchQuery, setSearchQuery] = useState("")
  const [processing, setProcessing] = useState({})
  const [isMapOpen, setIsMapOpen] = useState(null)
  const [transporterLocation, setTransporterLocation] = useState({ type: "Point", coordinates: [0, 0] })
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [feedbackState, setFeedbackState] = useState({})
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Assigned Deliveries";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const initializeFeedbackState = (deliveryId, targetRole) => ({
    rating: 0,
    comment: "",
    submitted: false,
    error: "",
    success: "",
  })

  const handleFeedbackChange = (deliveryId, targetRole, field, value) => {
    setFeedbackState((prev) => ({
      ...prev,
      [deliveryId]: {
        ...prev[deliveryId],
        [targetRole]: {
          ...prev[deliveryId]?.[targetRole],
          [field]: value,
        },
      },
    }))
  }

  const handleFeedbackSubmit = async (deliveryId, targetRole, recipientId) => {
    const feedback = feedbackState[deliveryId]?.[targetRole]
    if (!feedback) return

    if (feedback.rating < 1 || feedback.rating > 5) {
      setFeedbackState((prev) => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: "Please select a rating between 1 and 5 stars",
            success: "",
          },
        },
      }))
      return
    }

    if (!feedback.comment.trim()) {
      setFeedbackState((prev) => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: "Please enter a comment",
            success: "",
          },
        },
      }))
      return
    }

    try {
      const token = localStorage.getItem("token")
      await createFeedback(recipientId, feedback.rating, feedback.comment, transporterId, token)
      setFeedbackState((prev) => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            submitted: true,
            error: "",
            success: "Feedback submitted successfully!",
          },
        },
      }))
    } catch (error) {
      setFeedbackState((prev) => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: error.message || "Failed to submit feedback",
            success: "",
          },
        },
      }))
    }
  }

  const openFeedbackModal = (deliveryId, targetRole, targetId, targetName) => {
    setFeedbackModal({ deliveryId, targetRole, targetId, targetName })
  }

  const closeFeedbackModal = () => {
    setFeedbackModal(null)
  }

  useEffect(() => {
    const fetchTransporterLocation = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"))
        if (user?.location) {
          setTransporterLocation(user.location)
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              const newLocation = { type: "Point", coordinates: [coords.longitude, coords.latitude] }
              setTransporterLocation(newLocation)
              updateTransporterLocation(transporterId, { location: newLocation, address: "Current Location" })
            },
            () => console.error("Failed to get initial geolocation"),
          )
        }
      } catch (err) {
        console.error("Error fetching transporter location:", err)
      }
    }
    fetchTransporterLocation()
  }, [transporterId])

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        showAlert("error", "Please log in to view deliveries")
        navigate("/login")
        return
      }

      try {
        setLoading(true)
        const response = await getDeliveriesByTransporter(transporterId, filterOption !== "all" ? filterOption : "")
        const deliveriesArray = Array.isArray(response.data.data) ? response.data.data : []

        const enrichedDeliveries = await Promise.all(
          deliveriesArray.map(async (delivery) => {
            let pickupCoordinates = delivery.pickupCoordinates
            let deliveryCoordinates = delivery.deliveryCoordinates

            if (!pickupCoordinates) {
              pickupCoordinates = await geocodeAddress(delivery.pickupAddress)
            }
            if (!deliveryCoordinates) {
              deliveryCoordinates = await geocodeAddress(delivery.deliveryAddress)
            }

            return {
              ...delivery,
              pickupCoordinates: pickupCoordinates || { type: "Point", coordinates: [0, 0] },
              deliveryCoordinates: deliveryCoordinates || { type: "Point", coordinates: [0, 0] },
            }
          }),
        )

        const userIds = new Set()
        const requestNeedIds = new Set()
        enrichedDeliveries.forEach((delivery) => {
          const donation = delivery.donationTransaction?.donation || {}
          const requestNeed = delivery.donationTransaction?.requestNeed
          if (donation.donor) userIds.add(donation.donor)
          if (requestNeed) requestNeedIds.add(requestNeed)
        })

        const requestNeedPromises = Array.from(requestNeedIds).map((id) =>
          getRequestById(id).catch((err) => {
            console.error(`Failed to fetch requestNeed ${id}:`, err)
            return { _id: id, recipient: null }
          }),
        )
        const requestNeeds = await Promise.all(requestNeedPromises)
        const requestNeedMap = requestNeeds.reduce((map, rn) => {
          const requestNeedData = rn.data ? rn.data : rn
          map[requestNeedData._id] = requestNeedData
          return map
        }, {})

        requestNeeds.forEach((rn) => {
          const recipient = rn.data ? rn.data.recipient : rn.recipient
          if (recipient && recipient._id) userIds.add(recipient._id)
        })

        const userPromises = Array.from(userIds).map((id) =>
          getUserById(id).catch((err) => {
            console.error(`Failed to fetch user ${id}:`, err)
            return { _id: id, name: "Unknown", phone: "Not provided", photo: null, isAvailable: false, isActive: true }
          }),
        )
        const users = await Promise.all(userPromises)
        const userMap = users.reduce((map, user) => {
          const userData = user.data ? user.data : user
          map[userData._id] = userData
          return map
        }, {})

        const finalDeliveries = enrichedDeliveries.map((delivery) => {
          const donation = delivery.donationTransaction?.donation || {}
          const requestNeedId = delivery.donationTransaction?.requestNeed
          const requestNeed = requestNeedMap[requestNeedId] || { recipient: null }
          const recipient = requestNeed.recipient || null
          return {
            ...delivery,
            donationTransaction: {
              ...delivery.donationTransaction,
              donation: {
                ...donation,
                donor: userMap[donation.donor] || {
                  name: "Unknown Donor",
                  phone: "Not provided",
                  photo: null,
                  isAvailable: false,
                  isActive: true,
                },
              },
              requestNeed: {
                recipient: userMap[recipient?._id] || {
                  name: "Unknown Recipient",
                  phone: "Not provided",
                  photo: null,
                  isAvailable: false,
                  isActive: true,
                },
              },
            },
          }
        })

        setDeliveries(finalDeliveries)
        setFilteredDeliveries(finalDeliveries)

        const initialFeedbackState = {}
        finalDeliveries.forEach((delivery) => {
          if (delivery.status === "picked_up" || delivery.status === "delivered") {
            initialFeedbackState[delivery._id] = {}
            if (delivery.status === "picked_up" || delivery.status === "delivered") {
              initialFeedbackState[delivery._id].donor = initializeFeedbackState(delivery._id, "donor")
            }
            if (delivery.status === "delivered") {
              initialFeedbackState[delivery._id].recipient = initializeFeedbackState(delivery._id, "recipient")
            }
          }
        })
        setFeedbackState(initialFeedbackState)
      } catch (err) {
        console.error("Fetch error:", err)
        let errorMessage = "Failed to fetch deliveries"
        if (err.response) {
          if (err.response.status === 404) {
            errorMessage = "No deliveries found for this transporter"
          } else if (err.response.status === 400) {
            errorMessage = "Invalid transporter ID"
          } else {
            errorMessage = err.message || "An unexpected error occurred"
          }
        }
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [transporterId, navigate, showAlert, filterOption])

  const geocodeAddress = async (address) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      const data = await res.json()
      if (data.length > 0) {
        return { type: "Point", coordinates: [Number.parseFloat(data[0].lon), Number.parseFloat(data[0].lat)] }
      }
      return null
    } catch (err) {
      console.error(`Failed to geocode address ${address}:`, err)
      return null
    }
  }

  const handleAcceptOrRefuse = async (deliveryId, action) => {
    if (!transporterId) {
      showAlert("error", "Transporter ID is missing. Please try again or log in.")
      return
    }

    if (!window.confirm(`Are you sure you want to ${action} this delivery?`)) return

    try {
      setProcessing((prev) => ({ ...prev, [deliveryId]: true }))
      const response = await acceptOrRefuseDelivery(deliveryId, action, transporterId)

      if (action === "accept") {
        setDeliveries((prev) => prev.map((d) => (d._id === deliveryId ? { ...d, status: "accepted" } : d)))
        showAlert("success", "Delivery accepted successfully!")
      } else {
        setDeliveries((prev) => prev.filter((d) => d._id !== deliveryId))
        showAlert("success", response.data.message || "Delivery refused and removed from your list.")
      }
    } catch (error) {
      console.error(`Error ${action}ing delivery:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} delivery`
      showAlert("error", errorMessage)
    } finally {
      setProcessing((prev) => ({ ...prev, [deliveryId]: false }))
    }
  }

  const handleStartJourney = async (deliveryId) => {
    if (!window.confirm("Are you sure you want to start the delivery journey?")) return

    try {
      setProcessing((prev) => ({ ...prev, [deliveryId]: true }))

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const newLocation = { type: "Point", coordinates: [coords.longitude, coords.latitude] }
            await updateTransporterLocation(transporterId, {
              location: newLocation,
              address: await reverseGeocode(coords.longitude, coords.latitude),
            })
            setTransporterLocation(newLocation)
          },
          () => showAlert("error", "Failed to get current location"),
        )
      }

      await startJourney(deliveryId, transporterId)
      setDeliveries((prev) => prev.map((d) => (d._id === deliveryId ? { ...d, status: "in_progress" } : d)))
      showAlert("success", "Journey started successfully!")
    } catch (error) {
      console.error("Error starting journey:", error)
      showAlert("error", error.message || "Failed to start journey")
    } finally {
      setProcessing((prev) => ({ ...prev, [deliveryId]: false }))
    }
  }

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this delivery as ${newStatus}?`)) return

    try {
      setProcessing((prev) => ({ ...prev, [deliveryId]: true }))

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const newLocation = { type: "Point", coordinates: [coords.longitude, coords.latitude] }
            await updateTransporterLocation(transporterId, {
              location: newLocation,
              address: await reverseGeocode(coords.longitude, coords.latitude),
            })
            setTransporterLocation(newLocation)
          },
          () => showAlert("error", "Failed to get current location"),
        )
      }

      await updateDeliveryStatus(deliveryId, newStatus, transporterId)
      setDeliveries((prev) => prev.map((d) => (d._id === deliveryId ? { ...d, status: newStatus } : d)))
      setFeedbackState((prev) => {
        const updated = { ...prev }
        if (newStatus === "picked_up") {
          updated[deliveryId] = { ...updated[deliveryId], donor: initializeFeedbackState(deliveryId, "donor") }
        } else if (newStatus === "delivered") {
          updated[deliveryId] = {
            ...updated[deliveryId],
            donor: initializeFeedbackState(deliveryId, "donor"),
            recipient: initializeFeedbackState(deliveryId, "recipient"),
          }
        }
        return updated
      })
      showAlert("success", `Delivery marked as ${newStatus} successfully!`)
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error)
      showAlert("error", error.message || `Failed to update status to ${newStatus}`)
    } finally {
      setProcessing((prev) => ({ ...prev, [deliveryId]: false }))
    }
  }

  const reverseGeocode = async (lng, lat) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${lng}&lat=${lat}`)
      const data = await res.json()
      return data.display_name || "Unknown Location"
    } catch {
      return "Unknown Location"
    }
  }

  const handleOpenMap = (delivery) => {
    setIsMapOpen(delivery._id)
  }

  useEffect(() => {
    if (!deliveries.length) return

    let updatedDeliveries = [...deliveries]

    if (searchQuery) {
      updatedDeliveries = updatedDeliveries.filter((delivery) => {
        const donation = delivery.donationTransaction?.donation || {}
        const recipient = delivery.donationTransaction?.requestNeed?.recipient || {}
        const donor = donation.donor || {}
        const titleMatch = donation.title?.toLowerCase().includes(searchQuery.toLowerCase())
        const categoryMatch = donation.category?.toLowerCase().includes(searchQuery.toLowerCase())
        const recipientMatch = recipient.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const donorMatch = donor.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const addressMatch =
          delivery.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
        return titleMatch || categoryMatch || recipientMatch || donorMatch || addressMatch
      })
    }

    updatedDeliveries.sort((a, b) => {
      const donationA = a.donationTransaction?.donation || {}
      const donationB = b.donationTransaction?.donation || {}
      const recipientA = a.donationTransaction?.requestNeed?.recipient || {}
      const recipientB = b.donationTransaction?.requestNeed?.recipient || {}
      if (sortOption === "title") {
        return (donationA.title || "").localeCompare(donationB.title || "")
      } else if (sortOption === "recipient") {
        return (recipientA.name || "").localeCompare(recipientB.name || "")
      } else if (sortOption === "status") {
        return (a.status || "pending").localeCompare(b.status || "pending")
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }
    })

    setFilteredDeliveries(updatedDeliveries)
    setCurrentPage(1)
  }, [deliveries, sortOption, searchQuery])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDeliveries = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  if (loading) return <div className="assigneddel-loading-message">Loading...</div>

  if (error)
    return (
      <>
        <Navbar />
        <div className="assigneddel-error-container">Error: {error}</div>
        <Footer />
      </>
    )

  if (!deliveries.length)
    return (
      <>
        <Navbar />
        <div className="assigneddel-error-container">No deliveries found for this transporter</div>
        <Footer />
      </>
    )

  return (
    <>
      <Navbar />
      <div className="assigneddel-container">
        <div className="assigneddel-header-section">
          <div className="assigneddel-title-container">
            <FaTruck className="assigneddel-title-icon" />
            <h1 className="assigneddel-title">Assigned Deliveries</h1>
          </div>

          <div className="assigneddel-controls-container">
            <div className="assigneddel-search-container">
              <FaSearch className="assigneddel-search-icon" />
              <input
                type="text"
                className="assigneddel-search-input"
                placeholder="Search by title, category, recipient, donor, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search deliveries"
              />
            </div>

            <div className="assigneddel-filter-container">
              <div className="assigneddel-select-wrapper">
                <select
                  className="assigneddel-select"
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">
                    <span className="assigneddel-status-dot"></span>All Deliveries
                  </option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
                <FaChevronDown className="assigneddel-select-icon" />
              </div>

              <div className="assigneddel-select-wrapper">
                <select
                  className="assigneddel-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  aria-label="Sort deliveries"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Donation Title</option>
                  <option value="recipient">Sort by Recipient</option>
                  <option value="status">Sort by Status</option>
                </select>
                <FaChevronDown className="assigneddel-select-icon" />
              </div>
            </div>
          </div>
        </div>

        {currentDeliveries.length > 0 ? (
          currentDeliveries.map((delivery) => {
            const donation = delivery.donationTransaction?.donation || {}
            const recipient = delivery.donationTransaction?.requestNeed?.recipient || {}
            const donor = donation.donor || {}

            const userPhoto = recipient.photo ? `http://localhost:3000/${recipient.photo}` : imgmouna

            // Determine if "Start Journey" should be enabled
            const canStartJourney = donor.isAvailable && recipient.isAvailable

            // Determine donor and recipient status
            const donorStatus = !donor.isActive ? "Inactive" : !donor.isAvailable ? "Unavailable" : "Available"
            const recipientStatus = !recipient.isActive
              ? "Inactive"
              : !recipient.isAvailable
                ? "Unavailable"
                : "Available"

            return (
              <div className="assigneddel-card" key={delivery._id}>
                <div className="assigneddel-profile-info">
                  <img
                    src={userPhoto || "/placeholder.svg"}
                    alt="Recipient Profile"
                    className="assigneddel-profile-img"
                    onError={(e) => {
                      e.target.src = imgmouna
                      console.error(`Failed to load image: ${userPhoto}`)
                    }}
                  />
                  <p className="assigneddel-profile-text">
                    Recipient:{" "}
                    <Link to={`/ViewProfile/${recipient._id}`} className="assigneddel-profile-link">
                      {recipient.name || "Unknown Recipient"}
                    </Link>
                  </p>
                </div>

                <div className="assigneddel-availability-section">
                  <h4 className="assigneddel-availability-title">Availability Status</h4>
                  <div
                    className={`assigneddel-availability-status ${donorStatus === "Available" ? "available" : "unavailable"}`}
                  >
                    {donorStatus === "Available" ? <FaCheckCircle /> : <FaTimesCircle />}
                    <strong>Donor:</strong> {donorStatus}
                  </div>
                  <div
                    className={`assigneddel-availability-status ${recipientStatus === "Available" ? "available" : "unavailable"}`}
                  >
                    {recipientStatus === "Available" ? <FaCheckCircle /> : <FaTimesCircle />}
                    <strong>Recipient:</strong> {recipientStatus}
                  </div>
                </div>

                <div className="assigneddel-delivery-details">
                  <p className="assigneddel-delivery-detail">
                    <strong>Delivery ID:</strong> {delivery._id}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Donation Title:</strong> {donation.title || "Untitled"}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Pickup Address:</strong> {delivery.pickupAddress || "Not specified"}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Delivery Address:</strong> {delivery.deliveryAddress || "Not specified"}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Donor Name:</strong>{" "}
                    <Link to={`/ViewProfile/${donor._id}`} className="assigneddel-profile-link">
                      {donor.name || "Unknown Donor"}
                    </Link>
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Donor Phone:</strong> {donor.phone || "Not provided"}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Recipient Phone:</strong> {recipient.phone || "Not provided"}
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Recipient Name:</strong>{" "}
                    <Link to={`/ViewProfile/${recipient._id}`} className="assigneddel-profile-link">
                      {recipient.name || "Unknown Recipient"}
                    </Link>
                  </p>
                  <p className="assigneddel-delivery-detail">
                    <strong>Status:</strong>
                    <span className={`assigneddel-status-badge ${delivery.status || "pending"}`}>
                      {delivery.status || "Pending"}
                    </span>
                  </p>
                </div>
                <div className="assigneddel-item-section">
                  <h4 className="assigneddel-items-title">Allocated Items:</h4>
                  <ul className="assigneddel-item-list">
                    <li className="assigneddel-item">
                      <div className="assigneddel-item-details">
                        <span>
                          <strong>Title:</strong> {donation.title || "Untitled"}
                        </span>
                        <span>
                          <strong>Category:</strong> {donation.category || "Not specified"}
                        </span>
                      </div>
                      <span className="assigneddel-item-quantity">1 item</span>
                    </li>
                  </ul>
                </div>
                <div className="assigneddel-button-container">
                  {(!delivery.status || delivery.status === "pending") && (
                    <>
                      <button
                        className="assigneddel-action-button accept-btn"
                        onClick={() => handleAcceptOrRefuse(delivery._id, "accept")}
                        disabled={processing[delivery._id]}
                        aria-label="Accept delivery"
                      >
                        {processing[delivery._id] ? (
                          <>
                            <div className="assigneddel-spinner sm"></div> Accepting...
                          </>
                        ) : (
                          "Accept"
                        )}
                      </button>
                      <button
                        className="assigneddel-action-button refuse-btn"
                        onClick={() => handleAcceptOrRefuse(delivery._id, "refuse")}
                        disabled={processing[delivery._id]}
                        aria-label="Refuse delivery"
                      >
                        {processing[delivery._id] ? (
                          <>
                            <div className="assigneddel-spinner sm"></div> Refusing...
                          </>
                        ) : (
                          "Refuse"
                        )}
                      </button>
                    </>
                  )}
                  {delivery.status === "accepted" && (
                    <button
                      className="assigneddel-action-button start-btn"
                      onClick={() => handleStartJourney(delivery._id)}
                      disabled={processing[delivery._id] || !canStartJourney}
                      aria-label="Start journey"
                      title={
                        canStartJourney
                          ? "Start the delivery journey"
                          : "Cannot start journey: Donor or Recipient is not available"
                      }
                    >
                      {processing[delivery._id] ? (
                        <>
                          <div className="assigneddel-spinner sm"></div> Starting...
                        </>
                      ) : (
                        "Start Journey"
                      )}
                    </button>
                  )}
                  {delivery.status === "in_progress" && (
                    <button
                      className="assigneddel-action-button picked-up-btn"
                      onClick={() => handleUpdateStatus(delivery._id, "picked_up")}
                      disabled={processing[delivery._id]}
                      aria-label="Mark as picked up"
                    >
                      {processing[delivery._id] ? (
                        <>
                          <div className="assigneddel-spinner sm"></div> Marking...
                        </>
                      ) : (
                        "Mark Picked Up"
                      )}
                    </button>
                  )}
                  {delivery.status === "picked_up" && (
                    <>
                      <button
                        className="assigneddel-action-button delivered-btn"
                        onClick={() => handleUpdateStatus(delivery._id, "delivered")}
                        disabled={processing[delivery._id]}
                        aria-label="Mark as delivered"
                      >
                        {processing[delivery._id] ? (
                          <>
                            <div className="assigneddel-spinner sm"></div> Marking...
                          </>
                        ) : (
                          "Mark Delivered"
                        )}
                      </button>
                      <button
                        className="assigneddel-action-button feedback-btn"
                        onClick={() =>
                          openFeedbackModal(delivery._id, "donor", donor._id, donor.name || "Unknown Donor")
                        }
                        disabled={feedbackState[delivery._id]?.donor?.submitted}
                        aria-label="Add feedback for donor"
                      >
                        {feedbackState[delivery._id]?.donor?.submitted
                          ? "Feedback for Donor Submitted"
                          : "Add Feedback for Donor"}
                      </button>
                    </>
                  )}
                  {delivery.status === "delivered" && (
                    <>
                      <button
                        className="assigneddel-action-button feedback-btn"
                        onClick={() =>
                          openFeedbackModal(delivery._id, "donor", donor._id, donor.name || "Unknown Donor")
                        }
                        disabled={feedbackState[delivery._id]?.donor?.submitted}
                        aria-label="Add feedback for donor"
                      >
                        {feedbackState[delivery._id]?.donor?.submitted
                          ? "Feedback for Donor Submitted"
                          : "Add Feedback for Donor"}
                      </button>
                      <button
                        className="assigneddel-action-button feedback-btn"
                        onClick={() =>
                          openFeedbackModal(
                            delivery._id,
                            "recipient",
                            recipient._id,
                            recipient.name || "Unknown Recipient",
                          )
                        }
                        disabled={feedbackState[delivery._id]?.recipient?.submitted}
                        aria-label="Add feedback for recipient"
                      >
                        {feedbackState[delivery._id]?.recipient?.submitted
                          ? "Feedback for Recipient Submitted"
                          : "Add Feedback for Recipient"}
                      </button>
                    </>
                  )}
                  <button
                    className="assigneddel-action-button map-btn"
                    onClick={() => handleOpenMap(delivery)}
                    aria-label="View map"
                  >
                    Get Map
                  </button>
                </div>
                {isMapOpen === delivery._id && (
                  <DeleveryMap
                    isOpen={isMapOpen === delivery._id}
                    onClose={() => setIsMapOpen(null)}
                    pickupCoordinates={delivery.pickupCoordinates}
                    deliveryCoordinates={delivery.deliveryCoordinates}
                    transporterCoordinates={transporterLocation}
                    donorName={donor.name}
                    recipientName={recipient.name}
                    transporterName={JSON.parse(localStorage.getItem("user"))?.name || "Transporter"}
                  />
                )}
              </div>
            )
          })
        ) : (
          <p className="assigneddel-no-deliveries">No matching deliveries found.</p>
        )}

        {feedbackModal && (
          <div className="assigneddel-modal-overlay">
            <div className="assigneddel-modal-content">
              <button className="assigneddel-close-button" onClick={closeFeedbackModal}>
                ×
              </button>
              <form
                className="assigneddel-feedback-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleFeedbackSubmit(feedbackModal.deliveryId, feedbackModal.targetRole, feedbackModal.targetId)
                }}
              >
                <div className="assigneddel-form-group">
                  <label className="assigneddel-form-label">
                    Feedback for {feedbackModal.targetRole.charAt(0).toUpperCase() + feedbackModal.targetRole.slice(1)}{" "}
                    ({feedbackModal.targetName}):
                  </label>
                  <StarRating
                    rating={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.rating || 0}
                    setRating={(rating) =>
                      handleFeedbackChange(feedbackModal.deliveryId, feedbackModal.targetRole, "rating", rating)
                    }
                    interactive={!feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
                  />
                </div>
                <div className="assigneddel-form-group">
                  <textarea
                    className="assigneddel-feedback-textarea"
                    value={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.comment || ""}
                    onChange={(e) =>
                      handleFeedbackChange(
                        feedbackModal.deliveryId,
                        feedbackModal.targetRole,
                        "comment",
                        e.target.value,
                      )
                    }
                    placeholder={`Write your feedback for the ${feedbackModal.targetRole}...`}
                    disabled={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
                  />
                </div>
                {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.error && (
                  <p className="assigneddel-feedback-message error">
                    {feedbackState[feedbackModal.deliveryId][feedbackModal.targetRole].error}
                  </p>
                )}
                {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.success && (
                  <p className="assigneddel-feedback-message">
                    {feedbackState[feedbackModal.deliveryId][feedbackModal.targetRole].success}
                  </p>
                )}
                <button
                  className="assigneddel-submit-button"
                  type="submit"
                  disabled={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
                >
                  {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted
                    ? "Feedback Submitted"
                    : "Submit Feedback"}
                </button>
              </form>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="assigneddel-pagination-controls">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

export default AssignedDeliveries
