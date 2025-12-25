import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "../../assets/styles/backoffcss/studentList.css";
import { FaEye, FaFilePdf, FaSort } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { Link } from "react-router-dom";
import logo from '../../assets/images/logooo.png';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllDonationTransactions } from "../../api/donationTransactionService";

const DonationTransactionList = () => {
    const navigate = useNavigate(); // Initialize navigate
    const [donationTransactions, setDonationTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const transactionsPerPage = 3;

    const pagesVisited = currentPage * transactionsPerPage;

    const handleViewClick = (transactionId) => {
        navigate(`/donation-transactions/view/${transactionId}`);
    };
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Donation Transactions";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        const fetchDonationTransactions = async () => {
            setLoading(true);
            setError(null);
            try {
                const transactions = await getAllDonationTransactions();
                console.log("Fetched Transactions:", transactions);
                if (Array.isArray(transactions)) {
                    setDonationTransactions(transactions);
                } else {
                    console.error("Response is not a valid array:", transactions);
                    setDonationTransactions([]);
                    setError("No data returned from the server or invalid format.");
                }
            } catch (error) {
                console.error("Error fetching donation transactions:", {
                    message: error.message,
                    response: error.response ? error.response.data : null,
                    status: error.response ? error.response.status : null,
                });
                setError("Failed to fetch donation transactions. Please try again.");
                setDonationTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDonationTransactions();
    }, []);

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

        const imgWidth = 30, imgHeight = 30;
        doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

        const title = "DONATION TRANSACTIONS LIST";
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
            head: [["ID", "Request Need Title", "Donation Title", "Status", "Allocated Products", "Allocated Meals", "Created At", "Updated At"]],
            body: donationTransactions.map((tx) => [
                tx.id?.toString() || "N/A",
                tx.requestNeed?.title || "N/A",
                tx.donation?.title || "N/A",
                tx.status || "N/A",
                tx.allocatedProducts && tx.allocatedProducts.length > 0
                    ? tx.allocatedProducts.map(p => `${p.product?.name || "N/A"} (Qty: ${p.quantity})`).join(", ")
                    : "None",
                tx.allocatedMeals && tx.allocatedMeals.length > 0
                    ? tx.allocatedMeals.map(m => `${m.meal?.mealName || "N/A"} (Qty: ${m.quantity})`).join(", ")
                    : "None",
                tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A",
                tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : "N/A",
            ]),
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

                doc.text("©SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
            },
        });

        doc.save(`Donation_Transactions_${today.toISOString().split("T")[0]}.pdf`);
    };

    const filteredTransactions = donationTransactions.filter(tx => {
        const createdAtString = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "";
        const updatedAtString = tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : "";
        return (
            (tx.id?.toString() || "").includes(searchQuery) ||
            (tx.requestNeed?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.donation?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.status || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            createdAtString.includes(searchQuery) ||
            updatedAtString.includes(searchQuery)
        );
    });

    const sortedTransactions = filteredTransactions.sort((a, b) => {
        if (sortField === "id") {
            return sortOrder === "asc" ? (a.id || 0) - (b.id || 0) : (b.id || 0) - (a.id || 0);
        } else if (sortField === "status") {
            return sortOrder === "asc" ? (a.status || "").localeCompare(b.status || "") : (b.status || "").localeCompare(a.status || "");
        } else if (sortField === "createdAt") {
            return sortOrder === "asc"
                ? (new Date(a.createdAt) || 0) - (new Date(b.createdAt) || 0)
                : (new Date(b.createdAt) || 0) - (new Date(a.createdAt) || 0);
        } else if (sortField === "updatedAt") {
            return sortOrder === "asc"
                ? (new Date(a.updatedAt) || 0) - (new Date(b.updatedAt) || 0)
                : (new Date(b.updatedAt) || 0) - (new Date(a.updatedAt) || 0);
        }
        return 0;
    });

    const displayTransactions = sortedTransactions.slice(pagesVisited, pagesVisited + transactionsPerPage);
    const pageCount = Math.ceil(filteredTransactions.length / transactionsPerPage);

    const changePage = ({ selected }) => {
        setCurrentPage(selected);
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <Navbar setSearchQuery={setSearchQuery} />
                <div className="student-list">
                    <div className="header-container">
                        <h2>Donation Transaction Management</h2>
                        <button className="export-pdf-btn" onClick={exportToPDF}>
                            <FaFilePdf /> Export to PDF
                        </button>
                    </div>
                    <div className="sort-container">
                        <label>Sort by:</label>
                        <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                            <option value="id">ID</option>
                            <option value="status">Status</option>
                            <option value="createdAt">Created At</option>
                            <option value="updatedAt">Updated At</option>
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
                                <th>Request Need Title</th>
                                <th>Donation Title</th>
                                <th>Status</th>
                                <th>Allocated Products</th>
                                <th>Allocated Meals</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center" }}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", color: "red" }}>
                                        {error}
                                    </td>
                                </tr>
                            ) : displayTransactions.length > 0 ? (
                                displayTransactions.map((tx) => (
                                    <tr key={tx._id}>
                                        <td>{tx.id || "N/A"}</td>
                                        <td>{tx.requestNeed?.title || "N/A"}</td>
                                        <td>{tx.donation?.title || "N/A"}</td>
                                        <td>{tx.status || "N/A"}</td>
                                        <td>
                                            {tx.allocatedProducts && tx.allocatedProducts.length > 0
                                                ? tx.allocatedProducts.map(p => `${p.product?.name || "N/A"} (Qty: ${p.quantity})`).join(", ")
                                                : "None"}
                                        </td>
                                        <td>
                                            {tx.allocatedMeals && tx.allocatedMeals.length > 0
                                                ? tx.allocatedMeals.map(m => `${m.meal?.mealName || "N/A"} (Qty: ${m.quantity})`).join(", ")
                                                : "None"}
                                        </td>
                                        <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}</td>
                                        <td>{tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : "N/A"}</td>
                                        <td className="action-buttons">
                                            <button className="view-btn" onClick={() => handleViewClick(tx._id)}>
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center" }}>
                                        No transactions available
                                    </td>
                                </tr>
                            )}
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
                        disabledClassName="paginationDisabled"
                        activeClassName="paginationActive"
                    />
                </div>
            </div>
        </div>
    );
};

export default DonationTransactionList;