import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/viewSupermarket.css"; 
import { FaBan, FaUnlock } from "react-icons/fa";

const ViewSupermarket = () => {
    const { id } = useParams();
    const [supermarket, setSupermarket] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - View Supermarket";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        axios.get(`http://localhost:3000/users/view/${id}`)
            .then(response => {
                setSupermarket(response.data);
            })
            .catch(error => {
                console.error("Error fetching supermarket details:", error);
            });
    }, [id]);

    if (!supermarket) {
        return <div className="loading">Loading...</div>;
    }

    const handleBlockUser = async (userId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/users/toggle-block/${userId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`Supermarket has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                setSupermarket({ ...supermarket, isBlocked: response.data.isBlocked });
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    return (
        <div className="view-supermarket-container">
            <Sidebar />
            <div className="view-supermarket-content">
                <Navbar />
                <div className="supermarket-card">
                    <div className="supermarket-header">
                    <img 
                                            src={supermarket.photo ? `http://localhost:3000/${supermarket.photo}` : "/src/assets/User_icon_2.svg.png"} 
                                            alt="supermarket" 
                                            className="supermarket-photo" 
                                        />
                        <div className="supermarket-info">
                            <h2>{supermarket.name}</h2>
                            <p className="email">{supermarket.email}</p>
                            <p className="id">ID: {supermarket.id}</p>
                            <div className="supermarket-actions">
                                <button
                                    className="block-btn"
                                    onClick={() => handleBlockUser(supermarket._id, supermarket.isBlocked)}
                                    style={{ color: supermarket.isBlocked ? "green" : "red" }}
                                >
                                    {supermarket.isBlocked ? <FaUnlock /> : <FaBan />}
                                    {supermarket.isBlocked ? " Unblock" : " Block"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="supermarket-details">
                        <table className="details-table">
                            <tbody>
                                <tr>
                                    <td><strong>Phone:</strong></td>
                                    <td>{supermarket.phone}</td>
                                </tr>
                                <tr>
                                    <td><strong>Tax Registration Number:</strong></td>
                                    <td>{supermarket.taxReference || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Address:</strong></td>
                                    <td>{supermarket.address || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSupermarket;
