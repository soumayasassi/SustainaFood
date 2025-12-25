import React, { useState, useEffect } from "react";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf } from "react-icons/fa";
import styled from "styled-components";
import imgmouna from '../../assets/images/imgmouna.png';
import logo from '../../assets/images/logooo.png';
import "../../assets/styles/backoffcss/anomaliesDashbord.css";
import { useAlert } from '../../contexts/AlertContext';

// Styled component for profile image
const ProfileImg = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #228b22;
`;

// Styled component for pagination controls
const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;

  button {
    padding: 10px 20px;
    font-size: 16px;
    background: #228b22;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
      background: #56ab2f;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  span {
    font-size: 16px;
    color: #333;
  }
`;

// Styled component for action status
const ActionStatus = styled.span`
  font-weight: bold;
  color: ${props => (props.isapprovedfromadmin === "approved" ? "#228b22" : props.isapprovedfromadmin === "rejected" ? "#ff4444" : "#333")};
`;

const AnomaliesDashboard = () => {
  const { showAlert } = useAlert(); // Ajout de useAlert

  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("");
  const anomaliesPerPage = 4;
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Anomalies";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  // Fetch anomalies on component mount
  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await axios.get('http://localhost:3000/donation/donations/anomalies');
        console.log('Anomalies fetched:', response.data);
        setAnomalies(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching anomalies:', error);
        setError('Unable to load anomalies. Please check the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  // Approve donation
  const handleApprove = async (donationId) => {
    try {
      await axios.post(`http://localhost:3000/donation/donations/${donationId}/approve`);
      setAnomalies(anomalies.map(anomaly =>
        anomaly.donationId === donationId ? { ...anomaly, isapprovedfromadmin: "approved" } : anomaly
      ));
      showAlert('success', `Donation ${donationId} approved successfully!`); // Remplacement de alert()
    } catch (error) {
      console.error('Error approving donation:', error);
      showAlert('error', 'Failed to approve donation'); // Remplacement de setError
    }
  };

  // Reject donation
  const handleReject = async (donationId) => {
    try {
      await axios.post(`http://localhost:3000/donation/donations/${donationId}/reject`);
      setAnomalies(anomalies.map(anomaly =>
        anomaly.donationId === donationId ? { ...anomaly, isapprovedfromadmin: "rejected" } : anomaly
      ));
      showAlert('success', `Donation ${donationId} rejected successfully!`); // Remplacement de alert()
    } catch (error) {
      console.error('Error rejecting donation:', error);
      showAlert('error', 'Failed to reject donation'); // Remplacement de setError
    }
  };

  // Filter anomalies by donor role
  const filteredAnomalies = anomalies.filter((anomaly) =>
    roleFilter === "" || (anomaly.donor && anomaly.donor.role === roleFilter)
  );

  // Sort anomalies
  const sortedAnomalies = [...filteredAnomalies].sort((a, b) => {
    let comparison = 0;
    if (sortField === "title") {
      comparison = (a.title || "").localeCompare(b.title || "");
    } else if (sortField === "donorName") {
      comparison = (a.donor?.name || "").localeCompare(b.donor?.name || "");
    } else if (sortField === "quantity") {
      comparison = (a.quantity || 0) - (b.quantity || 0);
    } else if (sortField === "daysToExpiry") {
      comparison = (a.daysToExpiry || 0) - (b.daysToExpiry || 0);
    } else if (sortField === "anomalyScore") {
      comparison = (a.anomalyScore || 0) - (b.anomalyScore || 0);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination logic
  const pagesVisited = currentPage * anomaliesPerPage;
  const displayAnomalies = sortedAnomalies.slice(pagesVisited, pagesVisited + anomaliesPerPage);
  const pageCount = Math.ceil(filteredAnomalies.length / anomaliesPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFillColor(50, 62, 72);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
    doc.setDrawColor(144, 196, 60);
    doc.setLineWidth(1.5);
    doc.line(0, 40, doc.internal.pageSize.width, 40);

    const imgWidth = 30, imgHeight = 30;
    doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Anomalies Report", doc.internal.pageSize.width / 2, 20, { align: "center" });

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 35);

    const tableColumn = ["Title", "Donor", "Quantity", "Days to Expiry", "Linked Requests", "Score", "Reason", "Status"];
    const tableRows = sortedAnomalies.map((anomaly) => [
      anomaly.title || "N/A",
      anomaly.donor ? `${anomaly.donor.name} (${anomaly.donor.role})` : "Unknown",
      anomaly.quantity || "N/A",
      anomaly.daysToExpiry !== "N/A" ? anomaly.daysToExpiry : "N/A",
      anomaly.linkedRequests || 0,
      anomaly.anomalyScore.toFixed(3),
      anomaly.reason || "N/A",
      anomaly.isapprovedfromadmin.charAt(0).toUpperCase() + anomaly.isapprovedfromadmin.slice(1) || "Pending"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, textColor: [45, 45, 45], lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [70, 80, 95], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
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

    doc.save(`Anomalies_Report_${today.toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />
        <div className="request-list">
          <div className="header-container">
            <h2 style={{ color: "green" }}>Anomaly Management</h2>
            <button className="export-pdf-btn" onClick={exportToPDF}>
              <FaFilePdf /> Export to PDF
            </button>
          </div>

          <div className="filter-container">
            <label htmlFor="roleFilter">Filter by Donor Role:</label>
            <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All</option>
              <option value="supermarket">Supermarket</option>
              <option value="restaurant">Restaurant</option>
              <option value="individual">Individual</option>
            </select>

            <label htmlFor="sortField">Sort by:</label>
            <select id="sortField" value={sortField} onChange={handleSortChange}>
              <option value="title">Title</option>
              <option value="donorName">Donor Name</option>
              <option value="quantity">Quantity</option>
              <option value="daysToExpiry">Days to Expiry</option>
              <option value="anomalyScore">Anomaly Score</option>
            </select>

            <label htmlFor="sortOrder">Order:</label>
            <select id="sortOrder" value={sortOrder} onChange={handleSortOrderChange}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {loading ? (
            <p>Loading anomalies...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : anomalies.length === 0 ? (
            <p>No anomalies detected.</p>
          ) : (
            <>
              <table className="anomalies-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Title</th>
                    <th>Quantity</th>
                    <th>Days to Expiry</th>
                    <th>Linked Requests</th>
                    <th>Anomaly Score</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAnomalies.map((anomaly) => {
                    const donorPhoto = anomaly.donor?.photo && anomaly.donor.photo !== ''
                      ? `http://localhost:3000/${anomaly.donor.photo}`
                      : imgmouna;
                    return (
                      <tr key={anomaly.donationId}>
                        <td>
                          <ProfileImg
                            src={donorPhoto}
                            alt="Donor Profile"
                            onError={(e) => {
                              e.target.src = imgmouna;
                              console.error(`Failed to load image: ${donorPhoto}`);
                            }}
                          />
                          <br />
                          <span style={{ fontWeight: "bold" }}>
                            {anomaly.donor?.name || "Unknown Donor"}
                          </span>
                          <br />
                          <span style={{ color: "#228b22" }}>
                            {anomaly.donor?.role || "Role Not Specified"}
                          </span>
                        </td>
                        <td>{anomaly.title || "N/A"}</td>
                        <td>{anomaly.quantity || "N/A"}</td>
                        <td>{anomaly.daysToExpiry !== "N/A" ? anomaly.daysToExpiry : "N/A"}</td>
                        <td>{anomaly.linkedRequests || 0}</td>
                        <td>{anomaly.anomalyScore.toFixed(3)}</td>
                        <td>{anomaly.reason || "N/A"}</td>
                        <td>
                          {anomaly.isapprovedfromadmin === "approved" || anomaly.isapprovedfromadmin === "rejected" ? (
                            <ActionStatus isapprovedfromadmin={anomaly.isapprovedfromadmin}>
                              {anomaly.isapprovedfromadmin.charAt(0).toUpperCase() + anomaly.isapprovedfromadmin.slice(1)}
                            </ActionStatus>
                          ) : (
                            <>
                              <button
                                className="approve-btn"
                                onClick={() => handleApprove(anomaly.donationId)}
                              >
                                Approve
                              </button>
                              <button
                                className="reject-btn"
                                onClick={() => handleReject(anomaly.donationId)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <PaginationControls>
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage + 1} of {pageCount}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, pageCount - 1))}
                  disabled={currentPage === pageCount - 1}
                >
                  Next
                </button>
              </PaginationControls>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomaliesDashboard;