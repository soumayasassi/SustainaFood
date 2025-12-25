import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/viewNgo.css"; // Assurez-vous d'avoir le bon fichier CSS
import { FaBan, FaUnlock } from "react-icons/fa";

const ViewNGO = () => {
    const { id } = useParams();
    const [ngo, setNgo] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - View NGO";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        axios.get(`http://localhost:3000/users/view/${id}`)
            .then(response => {
                setNgo(response.data);
            })
            .catch(error => {
                console.error("Error fetching NGO details:", error);
            });
    }, [id]);

    if (!ngo) {
        return <div className="loading">Loading...</div>;
    }

    const handleBlockNgo = async (ngoId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/ngos/toggle-block/${ngoId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`NGO has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                setNgo({ ...ngo, isBlocked: response.data.isBlocked });
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    return (
        <div className="view-ngo-container">
            <Sidebar />
            <div className="view-ngo-content">
                <Navbar />
                <div className="ngo-card">
                    <div className="ngo-header">
                    <img 
                                            src={ngo.photo ? `http://localhost:3000/${ngo.photo}` : "/src/assets/User_icon_2.svg.png"} 
                                            alt="ong" 
                                            className="ong-photo" 
                                        />
                        <div className="ngo-info">
                            <h2>{ngo.name}</h2>
                            <p className="email">{ngo.email}</p>
                            <p className="id">ID: {ngo.id}</p>
                            <div className="ngo-actions">
                                <button
                                    className="block-btn"
                                    onClick={() => handleBlockNgo(ngo._id, ngo.isBlocked)}
                                    style={{ color: ngo.isBlocked ? "green" : "red" }}
                                >
                                    {ngo.isBlocked ? <FaUnlock /> : <FaBan />}
                                    {ngo.isBlocked ? " Unblock" : " Block"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ngo-details">
                        <table className="details-table">
                            <tbody>
                                <tr>
                                    <td><strong>Type:</strong></td>
                                    <td>{ngo.type || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Phone:</strong></td>
                                    <td>{ngo.phone}</td>
                                </tr>
                                
                                <tr>
                                    <td><strong>Address:</strong></td>
                                    <td>{ngo.address || "N/A"}</td>
                                </tr>
                                
                                <tr>
                                    <td><strong>Tax ID:</strong></td>
                                    <td>{ngo.id_fiscale || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewNGO;
