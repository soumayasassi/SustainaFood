import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/viewRestaurant.css"; // Ensure you have the correct CSS
import { FaBan, FaUnlock } from "react-icons/fa";

const ViewRestaurant = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - View Restaurant";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        axios.get(`http://localhost:3000/users/view/${id}`)
            .then(response => {
                setRestaurant(response.data);
            })
            .catch(error => {
                console.error("Error fetching restaurant details:", error);
            });
    }, [id]);

    if (!restaurant) {
        return <div className="loading">Loading...</div>;
    }

    const handleBlockRestaurant = async (restaurantId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/users/toggle-block/${restaurantId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`Restaurant has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                setRestaurant({ ...restaurant, isBlocked: response.data.isBlocked });
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    return (
        <div className="view-restaurant-container">
            <Sidebar />
            <div className="view-restaurant-content">
                <Navbar />
                <div className="restaurant-card">
                    <div className="restaurant-header">
                    <img 
                                            src={restaurant.photo ? `http://localhost:3000/${restaurant.photo}` : "/src/assets/User_icon_2.svg.png"} 
                                            alt="restaurant" 
                                            className="restaurant-photo" 
                                        />
                        <div className="restaurant-info">
                            <h2>{restaurant.name}</h2>
                            <p className="email">{restaurant.email}</p>
                            <p className="id">ID: {restaurant.id}</p>
                            <div className="restaurant-actions">
                                <button
                                    className="block-btn"
                                    onClick={() => handleBlockRestaurant(restaurant._id, restaurant.isBlocked)}
                                    style={{ color: restaurant.isBlocked ? "green" : "red" }}
                                >
                                    {restaurant.isBlocked ? <FaUnlock /> : <FaBan />}
                                    {restaurant.isBlocked ? " Unblock" : " Block"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="restaurant-details">
                        <table className="details-table">
                            <tbody>
                                <tr>
                                    <td><strong>Phone:</strong></td>
                                    <td>{restaurant.phone}</td>
                                </tr>
                                <tr>
                                    <td><strong>Tax Referecence:</strong></td>
                                    <td>{restaurant.taxReference || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Address:</strong></td>
                                    <td>{restaurant.address || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewRestaurant;
