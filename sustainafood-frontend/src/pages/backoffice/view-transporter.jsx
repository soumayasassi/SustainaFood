import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/viewTransporter.css";
import { FaBan, FaUnlock } from "react-icons/fa";

const ViewTransporter = () => {
    const { id } = useParams();
    const [transporter, setTransporter] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - View Transporter";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        axios.get(`http://localhost:3000/users/view/${id}`)
            .then(response => {
                setTransporter(response.data);
            })
            .catch(error => {
                console.error("Error fetching transporter details:", error);
            });
    }, [id]);

    if (!transporter) {
        return <div className="loading">Loading...</div>;
    }

    const handleBlockUser = async (userId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/users/toggle-block/${userId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`Transporter has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                setTransporter({ ...transporter, isBlocked: response.data.isBlocked });
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    return (
        <div className="view-transporter-container">
            <Sidebar />
            <div className="view-transporter-content">
                <Navbar />
                <div className="transporter-card">
                    <div className="transporter-header">
                       <img 
                                            src={transporter.photo ? `http://localhost:3000/${transporter.photo}` : "/src/assets/User_icon_2.svg.png"} 
                                            alt="transporter" 
                                            className="transporter-photo" 
                                        />
                        <div className="transporter-info">
                            <h2>{transporter.name}</h2>
                            <p className="email">{transporter.email}</p>
                            <p className="id">ID: {transporter.id}</p>
                            <div className="transporter-actions">
                                <button
                                    className="block-btn"
                                    onClick={() => handleBlockUser(transporter._id, transporter.isBlocked)}
                                    style={{ color: transporter.isBlocked ? "green" : "red" }}
                                >
                                    {transporter.isBlocked ? <FaUnlock /> : <FaBan />}
                                    {transporter.isBlocked ? " Unblock" : " Block"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="transporter-details">
                        <table className="details-table">
                            <tbody>
                                <tr>
                                    <td><strong>Phone:</strong></td>
                                    <td>{transporter.phone}</td>
                                </tr>
                                <tr>
                                    <td><strong>Vehicle Type:</strong></td>
                                    <td>{transporter.vehiculeType || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Address:</strong></td>
                                    <td>{transporter.address || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewTransporter;
