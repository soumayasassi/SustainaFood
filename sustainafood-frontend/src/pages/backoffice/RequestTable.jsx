import React, { useState, useEffect } from "react";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaEye } from "react-icons/fa";
import "../../assets/styles/backoffcss/RequestTable.css";
import { Link } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import imgmouna from '../../assets/images/imgmouna.png';
import logo from '../../assets/images/logooo.png';  // Import the logo

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

const ProfileImg = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #228b22;
`;

const RequestTable = () => {
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
const [roleFilter, setRoleFilter] = useState("");
const [statusFilter, setStatusFilter] = useState("");
  const requestsPerPage = 4;

  // Sanitize data function
  const sanitizeRequest = (request) => {
    return {
      ...request,
      title: request.title ? request.title.trim() : "",
      category: request.category ? request.category.trim() : "",
      description: request.description ? request.description.trim() : "",
    };
  };
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Requests";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/request/requests");
        const sanitizedData = response.data.map(sanitizeRequest);
        setRequests(sanitizedData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError("Error fetching requests. Please try again later.");
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

   // Filter requests based on category, role, and status
   const filteredRequests = requests.filter((request) => {
    const categoryMatch = categoryFilter === "" || request.category === categoryFilter;
    const roleMatch = roleFilter === "" || (request.recipient && request.recipient.role === roleFilter);
    const statusMatch = statusFilter === "" || request.status === statusFilter;
    return categoryMatch && roleMatch && statusMatch;
  });

  // Sort filtered requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;
    if (sortField === "title") {
      comparison = (a.title || "").localeCompare(b.title || "");
    } else if (sortField === "category") {
      comparison = (a.category || "").localeCompare(b.category || "");
    } else if (sortField === "expirationDate") {
      const dateA = a.expirationDate ? new Date(a.expirationDate) : null;
      const dateB = b.expirationDate ? new Date(b.expirationDate) : null;
      if (dateA && dateB) {
        comparison = dateA.getTime() - dateB.getTime();
      } else if (dateA) {
        comparison = -1;
      } else if (dateB) {
        comparison = 1;
      } else {
        comparison = 0;
      }
    } else if (sortField === "status") {
      comparison = (a.status || "").localeCompare(b.status || "");
    } else if (sortField === "_id") {
      comparison = (a._id || "").localeCompare(b._id || "");
    } else if (sortField === "role") {
      comparison = (a.recipient?.role || "").localeCompare(b.recipient?.role || "");
    }
    return sortOrder === "asc" ? comparison : comparison * -1;
  });

  const pagesVisited = currentPage * requestsPerPage;
  const displayRequests = sortedRequests.slice(pagesVisited, pagesVisited + requestsPerPage);
  const pageCount = Math.ceil(filteredRequests.length / requestsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };



  const exportToPDF = () => {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    // 🎨 Header Background
    doc.setFillColor(50, 62, 72); // Dark Slate Blue
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

    // 🏆 Decorative Bottom Line

    doc.setDrawColor(144, 196, 60); // Accent Green
    doc.setLineWidth(1.5);
    doc.line(0, 40, doc.internal.pageSize.width, 40);

    // 🖼️ Add Logo
    const imgWidth = 30, imgHeight = 30;
    doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

    // 🏷️ Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); // White
    doc.setFont("helvetica", "bold");
    doc.text("Request List", doc.internal.pageSize.width / 2, 20, { align: "center" });

    // 📅 Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 35);

    // 📊 Table Headers
    const tableColumn = [
        "User",
        "Title",
        "Category",
        "Expiration Date",
        "Status",
        "Description",
        "Products",
        "Location",
    ];

    // 🔄 Data Processing
    const tableRows = sortedRequests.map((request) => {
        const username = request.recipient ? request.recipient.name : "Unknown";
        const role = request.recipient ? request.recipient.role : "Role Not Specified";

        const products =
            request.category === "prepared_meals"
                ? ` number Of Meals: ${request.numberOfMeals || "N/A"}\n `
                : request.category === "packaged_products" && request.requestedProducts?.length
                ? request.requestedProducts
                      .map((p) => ` ${p.product?.productType || "N/A"}\n ${p.product?.productDescription?.trim() || "N/A"}\n Qty: ${p.quantity || 0}`)
                      .join("\n\n")
                : " No Products";

        return [
            `${username} (${role})`,
            request.title?.trim() || "N/A",
            request.category?.trim() || "N/A",
            request.expirationDate ? new Date(request.expirationDate).toLocaleDateString() : "N/A",
            request.status || "N/A",
            request.description?.trim() || "N/A",
            products,
            request.address || "N/A",
        ];
    });

    // 🏆 Styled Table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: "grid",
        styles: {
            fontSize: 9,
            cellPadding: 5,
            textColor: [45, 45, 45], // Dark Gray Text
            lineColor: [220, 220, 220], // Light Borders
            lineWidth: 0.3,
            valign: "middle",
        },
        headStyles: {
            fillColor: [70, 80, 95], // Dark Blue Headers
            textColor: [255, 255, 255], // White Text
            fontStyle: "bold",
            fontSize: 10,
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245], // Light Gray Background for Alternating Rows
        },
        columnStyles: {
            6: { cellWidth: 50 }, // Wider Product Column
        },
        didDrawPage: (data) => {
            // 🔻 Footer Line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);

            // 📄 Page Numbers
            doc.setFillColor(144, 196, 60);
            doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });

            // 🔒 Confidentiality Notice
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10);

            // 🔗 Branding
            doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
        },
    });

    // 📥 Save PDF
    doc.save(`Request_List_${today.toISOString().split("T")[0]}.pdf`);
};

  
  

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar setSearchQuery={setSearchQuery} />

        <div className="request-list">
          <div className="header-container">
            <h2 style={{ color:"green"}}>Request Management</h2>
            <button className="export-pdf-btn" onClick={exportToPDF}>
              <FaFilePdf />
              Export to PDF
            </button>
          </div>
          <div className="filter-container">
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

            <label htmlFor="roleFilter">Filter by Role:</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="ong">ONG</option>
              <option value="student">Student</option>
            </select>

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
              <option value="partially_fulfilled">Partially Fulfilled</option>
            </select>
          </div>

        

          {loading ? (
            <div>Loading requests...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Expiration Date</th>
                    <th>Status</th>
                    <th>Products</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRequests.map((request) => {
                    const userPhoto = request.recipient?.photo
                      ? `http://localhost:3000/${request.recipient.photo}`
                      : imgmouna;
                    return (
                      <tr key={request._id}>
                      <td>
                        <ProfileImg
                          src={userPhoto}
                          alt="Profile"
                          onError={(e) => {
                            e.target.src = imgmouna;
                            console.error(`Failed to load image: ${userPhoto}`);
                          }}
                        />
                        <br />
                        <span style={{ fontWeight: "bold" }}>
                          {request.recipient
                            ? `${request.recipient.name || "Unknown"}`.trim() || "Unknown User"
                            : "Unknown User"}
                        </span>
                        <br />
                        <span style={{ color: "#228b22" }}>
                          {request.recipient?.role || "Role Not Specified"}
                        </span>
                      </td>
                        <td>{request.title}</td>
                        <td>{request.category}</td>
                        <td>
                          {new Date(request.expirationDate).toLocaleDateString()}
                        </td>
                        <td>{request.status}</td>
                        <td>
                          {request.category === "prepared_meals" ? (
                            <div>
                              number Of Meals: {request.numberOfMeals || "N/A"}
                            </div>
                          ) : (
                            <div>
                              requsted product: {request.requestedProducts.length}
                            </div>
                          )}
                        </td>
                        <td>{request.address || "N/A"}</td>
                        <td >
                          <button className="view-btn">
                            <Link to={`/requests/view/${request._id}`}>
                              <FaEye />
                            </Link>
                          </button>
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
                  onClick={() =>
                    handlePageChange(Math.min(currentPage + 1, pageCount - 1))
                  }
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

export default RequestTable;