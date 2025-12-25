import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import DeleveryMap from "../../components/DeleveryMap";
import "/src/assets/styles/backoffcss/transporterList.css";

// Styles adaptés pour le backoffice
const DeliveryViewContainer = {
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

const Title = {
    color: "#228b22",
    fontSize: "28px",
    marginBottom: "20px",
    textAlign: "center",
};

const Section = {
    marginBottom: "20px",
    padding: "15px",
    borderLeft: "4px solid #228b22",
    borderRadius: "5px",
    background: "#f8f9fa",
};

const ProfileInfo = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "15px",
};

const ProfileImg = {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #228b22",
};

const ProfileText = {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: "#495057",
};

const Detail = {
    fontSize: "14px",
    color: "#495057",
    margin: "5px 0",
};

const Strong = {
    color: "#222",
    fontWeight: 600,
};

const ItemSection = {
    marginBottom: "15px",
};

const ItemsTitle = {
    fontSize: "16px",
    color: "#222",
    margin: "0 0 10px",
};

const ItemList = {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "10px",
};

const Item = {
    background: "#ffffff",
    padding: "10px",
    borderLeft: "3px solid #228b22",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    fontSize: "14px",
};

const ItemDetails = {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
};

const ItemDetailSpan = {
    display: "block",
    fontSize: "13px",
    color: "#333",
};

const ItemQuantity = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#d9534f",
    padding: "4px 8px",
    borderRadius: "4px",
};

const StatusBadge = {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    marginLeft: "5px",
};

const statusStyles = {
    "no-status": { backgroundColor: "#e9ecef", color: "#495057" },
    pending: { backgroundColor: "#fff3cd", color: "#856404" },
    picked_up: { backgroundColor: "#e2e3e5", color: "#383d41" },
    in_progress: { backgroundColor: "#d4edda", color: "#155724" },
    delivered: { backgroundColor: "#cce5ff", color: "#004085" },
    failed: { backgroundColor: "#f8d7da", color: "#721c24" },
};

const ButtonContainer = {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
};

const ActionButton = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s ease-in-out",
    backgroundColor: "#28a745",
    color: "white",
    margin: "0 10px",
};

const RouteInfo = {
    marginTop: "10px",
    padding: "10px",
    background: "#e9ecef",
    borderRadius: "5px",
    fontSize: "14px",
    color: "#333",
};

const LoadingMessage = {
    fontSize: "18px",
    color: "#555",
    textAlign: "center",
    padding: "40px",
};

const ErrorMessage = {
    fontSize: "18px",
    color: "#d32f2f",
    textAlign: "center",
    padding: "40px",
};

const DeliveryView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [transporterLocation, setTransporterLocation] = useState({ type: "Point", coordinates: [0, 0] });
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Delivery View";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    // Fetch delivery details
    useEffect(() => {
        const fetchDelivery = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Please log in to view delivery details");
                }

                const response = await axios.get(`http://localhost:3000/deliveries/${id}`);
                const deliveryData = response.data.data;

                if (!deliveryData) {
                    throw new Error("Delivery not found");
                }

                // Fetch donor and recipient details if needed
                const donation = deliveryData.donationTransaction?.donation || {};
                const requestNeed = deliveryData.donationTransaction?.requestNeed || {};

                let donor = donation.donor || { name: "Unknown Donor", phone: "Not provided", photo: null };
                if (donation.donor && typeof donation.donor === "object" && donation.donor._id) {
                    try {
                        const donorRes = await axios.get(`http://localhost:3000/users/details/${donation.donor._id}`);
                        donor = donorRes.data || donor;
                    } catch (err) {
                        console.error(`Failed to fetch donor ${donation.donor._id}:`, err);
                    }
                }

                let recipient = requestNeed.recipient || { name: "Unknown Recipient", phone: "Not provided", photo: null };
                if (requestNeed.recipient && typeof requestNeed.recipient === "object" && requestNeed.recipient._id) {
                    try {
                        const recipientRes = await axios.get(`http://localhost:3000/users/details/${requestNeed.recipient._id}`);
                        recipient = recipientRes.data || recipient;
                    } catch (err) {
                        console.error(`Failed to fetch recipient ${requestNeed.recipient._id}:`, err);
                    }
                }

                // Fetch transporter details (assuming delivery has transporterId)
                let transporter = { location: { type: "Point", coordinates: [0, 0] } };
                if (deliveryData.transporterId) {
                    try {
                        const transporterRes = await axios.get(`http://localhost:3000/users/details/${deliveryData.transporterId}`);
                        transporter = transporterRes.data || transporter;
                    } catch (err) {
                        console.error(`Failed to fetch transporter ${deliveryData.transporterId}:`, err);
                    }
                }

                setTransporterLocation(transporter.location || { type: "Point", coordinates: [0, 0] });

                // Enrich delivery data
                const enrichedDelivery = {
                    ...deliveryData,
                    donationTransaction: {
                        ...deliveryData.donationTransaction,
                        donation: { ...donation, donor },
                        requestNeed: { ...requestNeed, recipient },
                    },
                    pickupCoordinates: deliveryData.pickupCoordinates || { type: "Point", coordinates: [0, 0] },
                    deliveryCoordinates: deliveryData.deliveryCoordinates || { type: "Point", coordinates: [0, 0] },
                };

                setDelivery(enrichedDelivery);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message || "Failed to fetch delivery details");
            } finally {
                setLoading(false);
            }
        };

        fetchDelivery();
    }, [id]);

    // Calculate route using OSRM
    const calculateRoute = async () => {
        if (!delivery) return;

        try {
            const pickupCoords = delivery.pickupCoordinates;
            const deliveryCoords = delivery.deliveryCoordinates;

            if (
                transporterLocation.coordinates[0] === 0 ||
                pickupCoords.coordinates[0] === 0 ||
                deliveryCoords.coordinates[0] === 0
            ) {
                setRouteInfo({ error: "Invalid coordinates" });
                return;
            }

            // Route from transporter to pickup
            const toPickupUrl = `http://router.project-osrm.org/route/v1/driving/${transporterLocation.coordinates[0]},${transporterLocation.coordinates[1]};${pickupCoords.coordinates[0]},${pickupCoords.coordinates[1]}?overview=full&geometries=geojson`;
            const toPickupRes = await axios.get(toPickupUrl);
            const toPickupRoute = toPickupRes.data.routes[0];
            const toPickupDuration = toPickupRoute.duration / 60; // Convert seconds to minutes
            const toPickupDistance = toPickupRoute.distance / 1000; // Convert meters to kilometers

            // Route from pickup to delivery
            const toDeliveryUrl = `http://router.project-osrm.org/route/v1/driving/${pickupCoords.coordinates[0]},${pickupCoords.coordinates[1]};${deliveryCoords.coordinates[0]},${deliveryCoords.coordinates[1]}?overview=full&geometries=geojson`;
            const toDeliveryRes = await axios.get(toDeliveryUrl);
            const toDeliveryRoute = toDeliveryRes.data.routes[0];
            const toDeliveryDuration = toDeliveryRoute.duration / 60; // Convert seconds to minutes
            const toDeliveryDistance = toDeliveryRoute.distance / 1000; // Convert meters to kilometers

            setRouteInfo({
                toPickup: { duration: toPickupDuration, distance: toPickupDistance, geometry: toPickupRoute.geometry },
                toDelivery: { duration: toDeliveryDuration, distance: toDeliveryDistance, geometry: toDeliveryRoute.geometry },
            });
        } catch (err) {
            console.error("Failed to calculate route:", err);
            setRouteInfo({ error: "Failed to calculate route" });
        }
    };

    const handleOpenMap = () => {
        setIsMapOpen(true);
        calculateRoute();
    };

    if (loading) return <div style={LoadingMessage}>Loading...</div>;

    if (error) return <div style={ErrorMessage}>Error: {error}</div>;

    if (!delivery) return <div style={ErrorMessage}>Delivery not found</div>;

    const donation = delivery.donationTransaction?.donation || {};
    const recipient = delivery.donationTransaction?.requestNeed?.recipient || {};
    const donor = donation.donor || {};
    const userPhoto = recipient.photo ? `http://localhost:3000/${recipient.photo}` : "/src/assets/User_icon_2.svg.png";

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <Navbar />
                <div style={DeliveryViewContainer}>
                    <h1 style={Title}>Delivery Details 🚚</h1>

                    <div style={Section}>
                        <div style={ProfileInfo}>
                            <img
                                src={userPhoto}
                                alt="Recipient Profile"
                                style={ProfileImg}
                                onError={(e) => (e.target.src = "/src/assets/User_icon_2.svg.png")}
                            />
                            <p style={ProfileText}>Recipient: {recipient.name || "Unknown Recipient"}</p>
                        </div>
                        <div>
                            <p style={Detail}><span style={Strong}>Delivery ID:</span> {delivery._id}</p>
                            <p style={Detail}><span style={Strong}>Donation Title:</span> {donation.title || "Untitled"}</p>
                            <p style={Detail}><span style={Strong}>Pickup Address:</span> {delivery.pickupAddress || "Not specified"}</p>
                            <p style={Detail}><span style={Strong}>Delivery Address:</span> {delivery.deliveryAddress || "Not specified"}</p>
                            <p style={Detail}><span style={Strong}>Donor Name:</span> {donor.name || "Unknown Donor"}</p>
                            <p style={Detail}><span style={Strong}>Donor Phone:</span> {donor.phone || "Not provided"}</p>
                            <p style={Detail}><span style={Strong}>Recipient Phone:</span> {recipient.phone || "Not provided"}</p>
                            <p style={Detail}><span style={Strong}>Transporter Name:</span> {delivery.transporter?.name || "Not provided"}</p>

                            <p style={Detail}>
                                <span style={Strong}>Status:</span>{" "}
                                <span
                                    style={{
                                        ...StatusBadge,
                                        ...(statusStyles[delivery.status || "no-status"] || statusStyles["no-status"]),
                                    }}
                                >
                                    {delivery.status || "No Status"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div style={ItemSection}>
                        <h4 style={ItemsTitle}>Allocated Items:</h4>
                        <ul style={ItemList}>
                            <li style={Item}>
                                <div style={ItemDetails}>
                                    <span style={ItemDetailSpan}><strong>Title:</strong> {donation.title || "Untitled"}</span>
                                    <span style={ItemDetailSpan}><strong>Category:</strong> {donation.category || "Not specified"}</span>
                                </div>
                                <span style={ItemQuantity}>1 item</span>
                            </li>
                        </ul>
                    </div>

                    {routeInfo && (
                        <div style={RouteInfo}>
                            {routeInfo.error ? (
                                <p>Error: {routeInfo.error}</p>
                            ) : (
                                <>
                                    <p><strong>To Pickup:</strong> {routeInfo.toPickup.distance.toFixed(2)} km, {routeInfo.toPickup.duration.toFixed(2)} mins</p>
                                    <p><strong>To Delivery:</strong> {routeInfo.toDelivery.distance.toFixed(2)} km, {routeInfo.toDelivery.duration.toFixed(2)} mins</p>
                                </>
                            )}
                        </div>
                    )}

                    <div style={ButtonContainer}>
                        <button
                            style={ActionButton}
                            onClick={handleOpenMap}
                        >
                            View Map
                        </button>
                        <button
                            style={{ ...ActionButton, backgroundColor: "#007bff" }}
                            onClick={() => navigate("/Delivery")}
                        >
                            Back to List
                        </button>
                    </div>

                    {isMapOpen && (
                        <DeleveryMap
                            isOpen={isMapOpen}
                            onClose={() => setIsMapOpen(false)}
                            onLocationChange={() => {}}
                            onAddressChange={() => {}}
                            onSelect={() => {}}
                            initialAddress={delivery.pickupAddress}
                            pickupCoordinates={delivery.pickupCoordinates}
                            deliveryCoordinates={delivery.deliveryCoordinates}
                            transporterCoordinates={transporterLocation}
                            donorName={donor.name}
                            recipientName={recipient.name}
                            transporterName={delivery.transporterId ? "Transporter" : "Unknown Transporter"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryView;