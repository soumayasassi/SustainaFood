import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/transporterList.css";
import { FaEye, FaFilePdf } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { Link } from "react-router-dom";
import logo from '../../assets/images/logooo.png';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Delivery = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOption, setFilterOption] = useState("all");
    const [sortOption, setSortOption] = useState("date");
    const [deliveriesPerPage] = useState(5);
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Delivery List";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    // Fetch deliveries
    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Please log in to view deliveries");
                }

                const response = await axios.get("http://localhost:3000/deliveries", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const deliveriesArray = Array.isArray(response.data.data) ? response.data.data : [];
                setDeliveries(deliveriesArray);
                setFilteredDeliveries(deliveriesArray);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message || "Failed to fetch deliveries");
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();
    }, []);

    // Apply search, filter, and sort
    useEffect(() => {
        if (!deliveries.length) return;

        let updatedDeliveries = [...deliveries];

        // Apply search
        if (searchQuery) {
            updatedDeliveries = updatedDeliveries.filter((delivery) => {
                const donation = delivery.donationTransaction?.donation || {};
                const recipient = delivery.donationTransaction?.requestNeed?.recipient || {};
                const donor = donation.donor || {};
                const transporter = delivery.transporter || {};
                const titleMatch = donation.title?.toLowerCase().includes(searchQuery.toLowerCase());
                const categoryMatch = donation.category?.toLowerCase().includes(searchQuery.toLowerCase());
                const recipientMatch = recipient.name?.toLowerCase().includes(searchQuery.toLowerCase());
                const donorMatch = donor.name?.toLowerCase().includes(searchQuery.toLowerCase());
                const transporterMatch = transporter.name?.toLowerCase().includes(searchQuery.toLowerCase());
                const addressMatch =
                    delivery.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    delivery.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase());
                return titleMatch || categoryMatch || recipientMatch || donorMatch || transporterMatch || addressMatch;
            });
        }

        // Apply filter
        if (filterOption !== "all") {
            updatedDeliveries = updatedDeliveries.filter(
                (delivery) => (delivery.status || "no-status") === filterOption
            );
        }

        // Apply sorting
        updatedDeliveries.sort((a, b) => {
            const donationA = a.donationTransaction?.donation || {};
            const donationB = b.donationTransaction?.donation || {};
            const recipientA = a.donationTransaction?.requestNeed?.recipient || {};
            const recipientB = b.donationTransaction?.requestNeed?.recipient || {};
            const transporterA = a.transporter || {};
            const transporterB = b.transporter || {};
            if (sortOption === "title") {
                return (donationA.title || "").localeCompare(donationB.title || "");
            } else if (sortOption === "recipient") {
                return (recipientA.name || "").localeCompare(recipientB.name || "");
            } else if (sortOption === "transporter") {
                return (transporterA.name || "").localeCompare(transporterB.name || "");
            } else if (sortOption === "status") {
                return (a.status || "no-status").localeCompare(b.status || "no-status");
            } else {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });

        setFilteredDeliveries(updatedDeliveries);
        setCurrentPage(0);
    }, [deliveries, searchQuery, filterOption, sortOption]);

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        doc.setFillColor(245, 245, 245);
        doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

        doc.setDrawColor(144, 196, 60);
        doc.setLineWidth(1.5);
        doc.line(0, 40, doc.internal.pageSize.width, 40);

        const imgWidth = 30,
            imgHeight = 30;
        doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

        const title = "DELIVERY LIST";
        doc.setFontSize(28);
        doc.setTextColor(50, 62, 72);
        doc.setFont("helvetica", "bold");
        doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });

        const today = new Date();
        const dateStr = today.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 38);

        autoTable(doc, {
            head: [["ID", "Donation Title", "Donor", "Recipient", "Transporter", "Pickup Address", "Delivery Address", "Status"]],
            body: filteredDeliveries.map((delivery, index) => {
                const donation = delivery.donationTransaction?.donation || {};
                const recipient = delivery.donationTransaction?.requestNeed?.recipient || {};
                const donor = donation.donor || {};
                const transporter = delivery.transporter || {};
                return [
                    (index + 1).toString(),
                    donation.title || "Untitled",
                    donor.name || "Unknown Donor",
                    recipient.name || "Unknown Recipient",
                    transporter.name || "No Transporter Assigned",
                    delivery.pickupAddress || "Not specified",
                    delivery.deliveryAddress || "Not specified",
                    delivery.status || "No Status",
                ];
            }),
            startY: 50,
            theme: "grid",
            styles: {
                fontSize: 9,
                cellPadding: 6,
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                valign: "middle",
                textColor: [45, 45, 45],
            },
            headStyles: {
                fillColor: [70, 80, 95],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
                fontSize: 10,
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },
            didDrawCell: (data) => {
                if (data.section === "body" && data.column.index === 7) {
                    const status = data.cell.text[0];
                    if (status === "delivered") {
                        doc.setFillColor(144, 196, 60);
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
                        doc.setTextColor(255, 255, 255);
                    } else if (status === "failed") {
                        doc.setFillColor(220, 220, 220);
                        doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
                        doc.setTextColor(100, 100, 100);
                    }
                }
            },
            didDrawPage: (data) => {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);

                doc.setFillColor(144, 196, 60);
                doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });

                doc.setTextColor(120, 120, 120);
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10);

                doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
            },
        });

        doc.save(`Delivery_List_${today.toISOString().split("T")[0]}.pdf`);
    };

    const pagesVisited = currentPage * deliveriesPerPage;
    const displayDeliveries = filteredDeliveries.slice(pagesVisited, pagesVisited + deliveriesPerPage);
    const pageCount = Math.ceil(filteredDeliveries.length / deliveriesPerPage);

    const changePage = ({ selected }) => {
        setCurrentPage(selected);
    };

    if (loading) return <div>Loading...</div>;

    if (error) return <div>Error: {error}</div>;

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <Navbar setSearchQuery={setSearchQuery} />
                <div className="transporter-list">
                    <div className="header-container">
                        <h2>Delivery Management</h2>
                        <button className="export-pdf-btn" onClick={exportToPDF}>
                            <FaFilePdf /> Export to PDF
                        </button>
                    </div>
                    <div className="sort-container" style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                        <div>
                            <label>Filter by Status: </label>
                            <select
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                                style={{
                                    padding: "5px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    marginLeft: "5px",
                                }}
                            >
                                <option value="all">All Deliveries</option>
                                <option value="no-status">No Status</option>
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="in_progress">In Progress</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label>Sort by: </label>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                style={{
                                    padding: "5px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc",
                                    marginLeft: "5px",
                                }}
                            >
                                <option value="date">Sort by Date</option>
                                <option value="title">Sort by Donation Title</option>
                                <option value="recipient">Sort by Recipient</option>
                                <option value="transporter">Sort by Transporter</option>
                                <option value="status">Sort by Status</option>
                            </select>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Donation Title</th>
                                <th>Donor</th>
                                <th>Recipient</th>
                                <th>Transporter</th>
                                <th>Pickup Address</th>
                                <th>Delivery Address</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayDeliveries.map((delivery, index) => {
                                const donation = delivery.donationTransaction?.donation || {};
                                const recipient = delivery.donationTransaction?.requestNeed?.recipient || {};
                                const donor = donation.donor || {};
                                const transporter = delivery.transporter || {};

                                return (
                                    <tr key={delivery._id}>
                                        <td>{pagesVisited + index + 1}</td>
                                        <td>{donation.title || "Untitled"}</td>
                                        <td>{donor.name || "Unknown Donor"}</td>
                                        <td>{recipient.name || "Unknown Recipient"}</td>
                                        <td>{transporter.name || "No Transporter Assigned"}</td>
                                        <td>{delivery.pickupAddress || "Not specified"}</td>
                                        <td>{delivery.deliveryAddress || "Not specified"}</td>
                                        <td>{delivery.status || "No Status"}</td>
                                        <td className="action-buttons">
                                            <button className="view-btn">
                                                <Link to={`/deliveries/view/${delivery._id}`}>
                                                    <FaEye />
                                                </Link>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

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

export default Delivery;