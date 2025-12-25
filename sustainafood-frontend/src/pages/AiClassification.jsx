"use client"

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/styles/AiClassification.css"; // Use the correct CSS file
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { getDonationsByUserId } from "../api/donationService"; // Import the API to fetch donations
import { getUserById } from "../api/userService"; // Import the API to fetch user data
import axios from "axios"; // For making API calls to update classifications

const AiClassification = () => {
    const { user: authUser, token, logout } = useAuth(); // Get the logged-in user from context
    const { showAlert } = useAlert(); // For showing success/error messages
    const navigate = useNavigate();

    const [user, setUser] = useState(null); // Store the fetched user data
    const [donations, setDonations] = useState([]); // Store the user's donations
    const [loading, setLoading] = useState(true); // Loading state while fetching data
    const [userId, setUserId] = useState(null);
    // Fetch user and donations when the component mounts
     // Set the page title dynamically
  useEffect(() => {
    document.title = "SustainaFood -  AiClassification";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        const fetchData = async () => {
            // Check if the user is authenticated
            if (!authUser || (!authUser.id && !authUser._id)) {
                showAlert("error", "Please log in to view your donations.");
                navigate("/login");
                return;
            }

            try {
                setLoading(true);

                // Determine the user ID (handle both `id` and `_id` cases)

                // Determine the user ID (handle both `id` and `_id` cases)
                if (typeof authUser.id === "number") {
                    if (!authUser || !authUser._id) return;
                    try {
                        setUserId(authUser._id);
                    } catch (error) {
                      console.error("Backend Error:", error);
                    }
                  }
                  else if (typeof authUser.id === "string") {
                    if (!authUser || !authUser.id) return;
                    try {
                        setUserId(authUser.id);
                    } catch (error) {
                      console.error("Backend Error:", error);
                    }
                  }                console.log("Fetching data for userId:", userId); // Debug log

                // Fetch user data
                const userResponse = await getUserById(userId);
                const fetchedUser = userResponse.data;
                setUser(fetchedUser);

                // Fetch donations using the user ID
                const donationsResponse = await getDonationsByUserId(userId);
                console.log("Donations response:", donationsResponse.data); // Debug log
                setDonations(donationsResponse.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                showAlert("error", "Failed to load your data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authUser, navigate, showAlert]); // Dependencies: authUser, navigate, showAlert

    // Function to handle updating the productType or mealType
    const handleClassificationChange = async (donationId, itemIndex, newType, category) => {
        try {
            const donation = donations.find((d) => d._id === donationId);
            let updatedItems;

            if (category === "packaged_products") {
                updatedItems = [...donation.products];
                updatedItems[itemIndex].product.productType = newType; // Update the productType in the nested product object
            } else if (category === "prepared_meals") {
                updatedItems = [...donation.meals];
                updatedItems[itemIndex].meal.mealType = newType; // Update the mealType in the nested meal object
            }

            // Update the donation in the backend
            const updatedDonation = {
                ...donation,
                products: category === "packaged_products" ? updatedItems : donation.products,
                meals: category === "prepared_meals" ? updatedItems : donation.meals,
            };

            await axios.put(`/api/donations/update/${donationId}`, updatedDonation);

            // Update the local state
            setDonations((prev) =>
                prev.map((d) =>
                    d._id === donationId ? { ...d, ...updatedDonation } : d
                )
            );

            showAlert("success", "Classification updated successfully!");
        } catch (error) {
            console.error("Error updating classification:", error);
            showAlert("error", "Failed to update classification.");
        }
    };

    // Separate donations into packaged products and prepared meals
    const packagedDonations = donations.filter((d) => d.category === "packaged_products");
    const mealDonations = donations.filter((d) => d.category === "prepared_meals");

    return (
        <>
            <Navbar />

            <div className="ai-classification-container">
                <h1>AI Classification Results</h1>
                {loading ? (
                    <div className="loading-spinner">
                        <svg
                            width="50"
                            height="50"
                            viewBox="0 0 50 50"
                            xmlns="http://www.w3.org/2000/svg"
                            className="spinner"
                        >
                            <circle
                                cx="25"
                                cy="25"
                                r="20"
                                stroke="#4CAF50"
                                strokeWidth="5"
                                fill="none"
                                strokeDasharray="31.415, 31.415"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                ) : (
                    <>
                        {/* Display Packaged Products */}
                        {packagedDonations.length > 0 ? (
                            <div className="section">
                                <h2>Packaged Products</h2>
                                {packagedDonations.map((donation) => (
                                    <div key={donation._id} className="table-container">
                                        <h3>Donation ID: {donation._id}</h3>
                                        <table className="donation-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Description</th>
                                                    <th>Weight Per Unit</th>
                                                    <th>Weight Unit</th>
                                                    <th>Total Weight Unit</th>
                                                    <th>Donated Quantity</th>
                                                    <th>Product Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donation.products.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.product.name}</td>
                                                        <td>{item.product.productDescription}</td>
                                                        <td>{item.product.weightPerUnit}</td>
                                                        <td>{item.product.weightUnit}</td>
                                                        <td>{item.product.weightUnitTotale}</td>
                                                        <td>{item.quantity}</td> {/* Use the donated quantity */}
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <select
                                                                    value={item.product.productType || "Other"}
                                                                    onChange={(e) =>
                                                                        handleClassificationChange(
                                                                            donation._id,
                                                                            index,
                                                                            e.target.value,
                                                                            "packaged_products"
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="Canned_Goods">Canned Goods</option>
                                                                    <option value="Dry_Goods">Dry Goods</option>
                                                                    <option value="Beverages">Beverages</option>
                                                                    <option value="Snacks">Snacks</option>
                                                                    <option value="Cereals">Cereals</option>
                                                                    <option value="Baked_Goods">Baked Goods</option>
                                                                    <option value="Condiments">Condiments</option>
                                                                    <option value="Vegetables">Vegetables</option>
                                                                    <option value="Fruits">Fruits</option>
                                                                    <option value="Meat">Meat</option>
                                                                    <option value="Fish">Fish</option>
                                                                    <option value="Dairy">Dairy</option>
                                                                    <option value="Eggs">Eggs</option>
                                                                    <option value="Baby_Food">Baby Food</option>
                                                                    <option value="Pet_Food">Pet Food</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                                <span
                                                                    title="Automatically classified by AI"
                                                                    style={{ cursor: "pointer", color: "#4CAF50" }}
                                                                >
                                                                    ℹ️
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>
                                No packaged product donations found.{" "}
                                <a href="/add-donation">Add a donation now</a> to get started!
                            </p>
                        )}

                        {/* Display Prepared Meals */}
                        {mealDonations.length > 0 ? (
                            <div className="section">
                                <h2>Prepared Meals</h2>
                                {mealDonations.map((donation) => (
                                    <div key={donation._id} className="table-container">
                                        <h3>Donation ID: {donation._id}</h3>
                                        <table className="donation-table">
                                            <thead>
                                                <tr>
                                                    <th>Meal Name</th>
                                                    <th>Meal Description</th>
                                                    <th>Quantity</th>
                                                    <th>Meal Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donation.meals.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.meal.mealName}</td>
                                                        <td>{item.meal.mealDescription}</td>
                                                        <td>{item.quantity}</td> {/* Use the donated quantity */}
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <select
                                                                    value={item.meal.mealType || "Other"}
                                                                    onChange={(e) =>
                                                                        handleClassificationChange(
                                                                            donation._id,
                                                                            index,
                                                                            e.target.value,
                                                                            "prepared_meals"
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="Breakfast">Breakfast</option>
                                                                    <option value="Lunch">Lunch</option>
                                                                    <option value="Dinner">Dinner</option>
                                                                    <option value="Snack">Snack</option>
                                                                    <option value="Dessert">Dessert</option>
                                                                    <option value="Soup">Soup</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                                <span
                                                                    title="Automatically classified by AI"
                                                                    style={{ cursor: "pointer", color: "#4CAF50" }}
                                                                >
                                                                    ℹ️
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>
                                No prepared meal donations found.{" "}
                                <a href="/add-donation">Add a donation now</a> to get started!
                            </p>
                        )}

                        {/* About SustainaFood Section */}
                        <div className="about-section">
                            <h2>About SustainaFood</h2>
                            <p>
                                SustainaFood is a platform dedicated to reducing food waste and fighting hunger by connecting food donors with those in need. 
                                Our mission is to create a sustainable food ecosystem where surplus food from restaurants, supermarkets, and individuals can be 
                                redistributed to communities and organizations that need it most.
                            </p>
                            <p>
                                Using advanced AI technology, SustainaFood automatically classifies donated food items to streamline the donation process, ensuring 
                                that food reaches its destination quickly and efficiently. Join us in making a difference—one donation at a time.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </>
    );
};

export default AiClassification;