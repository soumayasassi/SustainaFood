import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/transporterList.css";
import { FaEye, FaTrash, FaBan, FaUnlock, FaFilePdf, FaSort } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { Link } from "react-router-dom";
import logo from '../../assets/images/logooo.png';  // Import the logo

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const TransporterList = () => {
    const [transporters, setTransporters] = useState([]); // Liste complète des transporteurs
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState(""); // State to store the search query
    const [sortField, setSortField] = useState("name"); // State to store the sorting field
    const [sortOrder, setSortOrder] = useState("asc"); // State to store the sorting order
    const transportersPerPage = 5; // Nombre de transporteurs par page

    // Calculate pagesVisited
    const pagesVisited = currentPage * transportersPerPage;
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Transporter List";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    // Récupération des transporteurs depuis le backend
    useEffect(() => {
        axios.get("http://localhost:3000/users/list")
            .then(response => {
                const transporterUsers = response.data.filter(user => user.role === "transporter");
                setTransporters(transporterUsers);
            })
            .catch(error => console.error("Error fetching transporters:", error));
    }, []);

    // Fonction pour bloquer/débloquer un transporteur
    const handleBlockUser = async (userId, isBlocked) => {
        try {
            const response = await axios.put(`http://localhost:3000/users/toggle-block/${userId}`, {
                isBlocked: !isBlocked
            });

            if (response.status === 200) {
                alert(`User has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`);
                // Update the UI after blocking/unblocking
                setTransporters(transporters.map(transporter =>
                    transporter._id === userId ? { ...transporter, isBlocked: response.data.isBlocked } : transporter
                ));
            } else {
                alert(response.data.error || "Error toggling block status.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update block status.");
        }
    };

    // Fonction pour supprimer un transporteur
    const deleteTransporter = async (transporterId) => {
        if (!window.confirm("Are you sure you want to delete this transporter?")) return;

        try {
            await axios.delete(`http://localhost:3000/users/delete/${transporterId}`);
            alert("Transporter deleted!");
            setTransporters(transporters.filter(transporter => transporter._id !== transporterId));
        } catch (error) {
            console.error("Error deleting transporter:", error);
        }
    };

    // Fonction pour exporter la liste en PDF
    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });
    
        // Header background - changed to a neutral light gray
        doc.setFillColor(245, 245, 245); // Light gray instead of green
        doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
    
        // Decorative bottom line - keeping main color as accent
        doc.setDrawColor(144, 196, 60); // Main color #90C43C
        doc.setLineWidth(1.5);
        doc.line(0, 40, doc.internal.pageSize.width, 40);
    
        // Logo
        const imgWidth = 30, imgHeight = 30;
        doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);
    
        // Title - changed to dark slate blue
        const title = "TRANSPORTER LIST";
        doc.setFontSize(28);
        doc.setTextColor(50, 62, 72); // Dark slate blue instead of green
        doc.setFont("helvetica", "bold");
        doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });
    
        // Date
        const today = new Date();
        const dateStr = today.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80); // Dark gray
        doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 38);
    
        // Table
        autoTable(doc, {
            head: [["ID", "Name", "Email", "Phone", "Vehicle Type", "Status"]],
            body: transporters.map((transporter, index) => [
                (index + 1).toString(),
                transporter.name,
                transporter.email,
                transporter.phone || "N/A",
                transporter.vehiculeType || "N/A",
                transporter.isActive ? "Active" : "Inactive",
            ]),
            startY: 50,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 6,
                lineColor: [200, 200, 200], // Light gray borders
                lineWidth: 0.2,
                valign: "middle",
                textColor: [45, 45, 45], // Dark gray text
            },
            headStyles: {
                fillColor: [70, 80, 95], // Dark blue-gray instead of green
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
                fontSize: 10,
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250], // Very light gray instead of light green
            },
            didDrawCell: (data) => {
                if (data.section === "body" && data.column.index === 5) {
                    const status = data.cell.text[0];
                    if (status === "Active") {
                        doc.setFillColor(144, 196, 60); // Main green for active status only
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
                        doc.setTextColor(255, 255, 255); // White text
                    } else if (status === "Inactive") {
                        doc.setFillColor(220, 220, 220); // Light gray for inactive
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
                        doc.setTextColor(100, 100, 100); // Dark gray text
                    }
                }
            },
            didDrawPage: (data) => {
                // Footer line
                doc.setDrawColor(200, 200, 200); // Light gray line
                doc.setLineWidth(0.5);
                doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);
    
                // Page numbers - using main color as accent
                doc.setFillColor(144, 196, 60); // Main green #90C43C
                doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
    
                // Confidentiality notice
                doc.setTextColor(120, 120, 120);
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10);
    
                // Institution info
                doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
            },
        });
    
        doc.save(`Transporter_Directory_${today.toISOString().split("T")[0]}.pdf`);
    };

    // Filtering the transporters based on the search query
    const filteredTransporters = transporters.filter(transporter => {
        const phoneString = transporter.phone?.toString(); // Convert phone number to string for searching
        return (
            transporter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transporter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phoneString.includes(searchQuery) // Search in the phone number as a string
        );
    });

    // Sorting the transporters based on the selected field and order
    const sortedTransporters = filteredTransporters.sort((a, b) => {
        if (sortField === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortField === "email") {
            return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
        } else if (sortField === "phone") {
            return sortOrder === "asc" ? a.phone - b.phone : b.phone - a.phone;
        } else if (sortField === "vehiculeType") {
            return sortOrder === "asc" ? (a.vehiculeType || "").localeCompare(b.vehiculeType || "") : (b.vehiculeType || "").localeCompare(a.vehiculeType || "");
        } else if (sortField === "isActive") {
            return sortOrder === "asc" ? (a.isActive ? 1 : -1) - (b.isActive ? 1 : -1) : (b.isActive ? 1 : -1) - (a.isActive ? 1 : -1);
        }
        return 0;
    });

    const displayTransporters = sortedTransporters.slice(pagesVisited, pagesVisited + transportersPerPage);

    const pageCount = Math.ceil(filteredTransporters.length / transportersPerPage);

    const changePage = ({ selected }) => {
        setCurrentPage(selected);
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <Navbar setSearchQuery={setSearchQuery} /> {/* Pass search setter to Navbar */}
                <div className="transporter-list">
                    <div className="header-container">
                        <h2>Transporter Management</h2>
                        <button className="export-pdf-btn" onClick={exportToPDF}>
                            <FaFilePdf /> Export to PDF
                        </button>
                    </div>
                    <div className="sort-container">
                        <label>Sort by:</label>
                        <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="vehiculeType">Vehicle Type</option>
                            <option value="isActive">Active Status</option>
                        </select>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Vehicle Type</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayTransporters.map((transporter, index) => (
                                <tr key={transporter._id}>
                                    <td>{pagesVisited + index + 1}</td>
                                    <td>
                                        <img
                                            src={transporter.photo ? `http://localhost:3000/${transporter.photo}` : "/src/assets/User_icon_2.svg.png"}
                                            alt="transporter"
                                            className="transporter-photoList"
                                        />
                                    </td>
                                    <td>{transporter.name}</td>
                                    <td>{transporter.email}</td>
                                    <td>{transporter.phone}</td>
                                    <td>{transporter.vehiculeType || "N/A"}</td>
                                    <td>{transporter.isActive ? "Yes" : "No"}</td>
                                    <td className="action-buttons">
                                        <button className="view-btn">
                                            <Link to={`/transporters/view/${transporter._id}`}>
                                                <FaEye />
                                            </Link>
                                        </button>
                                        <button
                                            className="block-btn"
                                            onClick={() => handleBlockUser(transporter._id, transporter.isBlocked)}
                                            style={{ color: transporter.isBlocked ? "green" : "red" }}
                                        >
                                            {transporter.isBlocked ? <FaUnlock /> : <FaBan />}
                                        </button>
                                        <button className="delete-btn" onClick={() => deleteTransporter(transporter._id)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <ReactPaginate
                        previousLabel={"Previous"}
                        nextLabel={"Next"}
                        pageCount={pageCount}
                        onPageChange={changePage}
                        containerClassName={"pagination"}
                        previousLinkClassName={"previousBttn"}
                        nextLinkClassName={"nextBttn"}
                        disabledClassName={"paginationDisabled"}
                        activeClassName={"paginationActive"}
                    />
                </div>
            </div>
        </div>
    );
};

export default TransporterList;