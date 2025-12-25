import React, { useState, useEffect } from "react";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "../../assets/styles/backoffcss/studentList.css";
import { FaEye, FaFilePdf } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from '../../assets/images/logooo.png';
import imgmouna from '../../assets/images/imgmouna.png';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getDonations } from "../../api/donationService";
import styled from "styled-components";

// Styled Components
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

const ProfileImg = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #228b22;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;

  label {
    margin-right: 5px;
    font-weight: 500;
  }

  select {
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    min-width: 150px;
  }
`;

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const donationsPerPage = 3;

  // Sanitize donation data
  const sanitizeDonation = (donation) => ({
    ...donation,
    title: donation.title ? donation.title.trim() : "",
    category: donation.category ? donation.category.trim() : "",
    status: donation.status ? donation.status.trim() : "",
   
  });
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Donation List";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const response = await getDonations();
        const sanitizedData = (response.data || []).map(sanitizeDonation);
        setDonations(sanitizedData);
      } catch (error) {
        setError("Error fetching donations. Please try again later.");
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  // Filter and sort logic
  const filteredDonations = donations.filter((donation) => {
    const categoryMatch = categoryFilter === "" || donation.category === categoryFilter;
    const statusMatch = statusFilter === "" || donation.status === statusFilter;
    const searchMatch = (
      (donation.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (donation.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (donation.status || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (donation.expirationDate ? new Date(donation.expirationDate).toLocaleDateString() : "").includes(searchQuery)
    );
    return categoryMatch && statusMatch && searchMatch;
  });

  const sortedDonations = [...filteredDonations].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "title":
        comparison = (a.title || "").localeCompare(b.title || "");
        break;
      case "category":
        comparison = (a.category || "").localeCompare(b.category || "");
        break;
      case "status":
        comparison = (a.status || "").localeCompare(b.status || "");
        break;
      
      case "expirationDate":
        comparison = (new Date(a.expirationDate) || 0) - (new Date(b.expirationDate) || 0);
        break;
      case "createdAt":
        comparison = (new Date(a.createdAt) || 0) - (new Date(b.createdAt) || 0);
        break;
      case "updatedAt":
        comparison = (new Date(a.updatedAt) || 0) - (new Date(b.updatedAt) || 0);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const pagesVisited = currentPage * donationsPerPage;
  const displayDonations = sortedDonations.slice(pagesVisited, pagesVisited + donationsPerPage);
  const pageCount = Math.ceil(filteredDonations.length / donationsPerPage);

  const handlePageChange = (page) => {
    if (page >= 0 && page < pageCount) {
      setCurrentPage(page);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFillColor(50, 62, 72);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
    doc.setDrawColor(144, 196, 60);
    doc.setLineWidth(1.5);
    doc.line(0, 40, doc.internal.pageSize.width, 40);

    // Logo
    const imgWidth = 30, imgHeight = 30;
    doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Donations List", doc.internal.pageSize.width / 2, 20, { align: "center" });

    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 35);

    // Table
    const tableColumn = [
      "Donor",
      "Title",
      "Category",
      "Status",
      
      "Expiration Date",
      "Created At",
      "Updated At",
    ];

    const tableRows = sortedDonations.map((donation) => [
      donation.donor?.name || "Unknown",
      donation.title || "N/A",
      donation.category || "N/A",
      donation.status || "N/A",
      donation.location || "N/A",
      donation.expirationDate ? new Date(donation.expirationDate).toLocaleDateString() : "N/A",
      donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "N/A",
      donation.updatedAt ? new Date(donation.updatedAt).toLocaleDateString() : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [45, 45, 45],
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [70, 80, 95],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
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

    doc.save(`Donations_List_${today.toISOString().split("T")[0]}.pdf`);
  };

  if (loading) return <div className="loading-message">Loading donations...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar setSearchQuery={setSearchQuery} />
        <div className="request-list">
          <div className="header-container">
            <h2 style={{ color: "green" }}>Donation Management</h2>
            <button className="export-pdf-btn" onClick={exportToPDF}>
              <FaFilePdf /> Export to PDF
            </button>
          </div>

          <FilterContainer>
            <div>
              <label htmlFor="categoryFilter">Filter by Category:</label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="packaged_products">Packaged Products</option>
                <option value="prepared_meals">Prepared Meals</option>
              </select>
            </div>
            <div>
              <label htmlFor="statusFilter">Filter by Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
            <div>
              <label htmlFor="sortField">Sort by:</label>
              <select
                id="sortField"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="category">Category</option>
                <option value="status">Status</option>
                <option value="location">Location</option>
                <option value="expirationDate">Expiration Date</option>
                <option value="createdAt">Created At</option>
                <option value="updatedAt">Updated At</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </FilterContainer>

          <table>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
              
                <th>Expiration Date</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayDonations.map((donation) => (
                <tr key={donation._id}>
                  <td>
                    <ProfileImg
                      src={donation.donor?.photo ? `http://localhost:3000/${donation.donor.photo}` : imgmouna}
                      alt="Donor"
                      onError={(e) => { e.target.src = imgmouna; }}
                    />
                    <br />
                    <span style={{ fontWeight: "bold" }}>
                      {donation.donor?.name || "Unknown Donor"}
                    </span>
                  </td>
                  <td>{donation.title || "N/A"}</td>
                  <td>{donation.category || "N/A"}</td>
                  <td>{donation.status || "N/A"}</td>
                 
                  <td>{donation.expirationDate ? new Date(donation.expirationDate).toLocaleDateString() : "N/A"}</td>
                  <td>{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>{donation.updatedAt ? new Date(donation.updatedAt).toLocaleDateString() : "N/A"}</td>
                  <td className="action-buttons">
                    <button className="view-btn">
                      <Link to={`/donations/view/${donation._id}`}>
                        <FaEye />
                      </Link>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayDonations.length === 0 && (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              No donations match the current filters
            </div>
          )}

          <PaginationControls>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <span>Page {currentPage + 1} of {pageCount}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount - 1}
            >
              Next
            </button>
          </PaginationControls>
        </div>
      </div>
    </div>
  );
};

export default DonationList;