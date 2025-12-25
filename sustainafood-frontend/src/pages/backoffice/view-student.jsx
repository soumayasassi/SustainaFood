import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/viewStudent.css"; 
import { FaBan, FaUnlock } from "react-icons/fa";

const ViewStudent = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - View Student";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        axios.get(`http://localhost:3000/users/view/${id}`)
            .then(response => {
                setStudent(response.data);
            })
            .catch(error => {
                console.error("Error fetching student details:", error);
            });
    }, [id]);

    if (!student) {
        return <div className="loading">Loading...</div>;
    }

    const handleBlockUser = async (userId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/users/toggle-block/${userId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`User has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                setStudent({ ...student, isBlocked: response.data.isBlocked });
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    return (
        <div className="view-student-container">
            <Sidebar />
            <div className="view-student-content">
                <Navbar />
                <div className="student-card">
                    <div className="student-header">
                    <img 
                                            src={student.photo ? `http://localhost:3000/${student.photo}` : "/src/assets/User_icon_2.svg.png"} 
                                            alt="Student" 
                                            className="student-photo" 
                                        />
                        <div className="student-info">
                            <h2>{student.name}</h2>
                            <p className="email">{student.email}</p>
                            <p className="id">ID: {student.id}</p>
                            <div className="student-actions">
                                <button
                                    className="block-btn"
                                    onClick={() => handleBlockUser(student._id, student.isBlocked)}
                                    style={{ color: student.isBlocked ? "green" : "red" }}
                                >
                                    {student.isBlocked ? <FaUnlock /> : <FaBan />}
                                    
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="student-details">
                        <table className="details-table">
                            <tbody>
                                <tr>
                                    <td><strong>Phone:</strong></td>
                                    <td>{student.phone}</td>
                                </tr>
                                <tr>
                                    <td><strong>Age:</strong></td>
                                    <td>{student.age || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Sex:</strong></td>
                                    <td>{student.sexe}</td>
                                </tr>
                                <tr>
                                    <td><strong>Address:</strong></td>
                                    <td>{student.address || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Student Card:</strong></td>
                                    <td>{student.studentCard || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewStudent;
