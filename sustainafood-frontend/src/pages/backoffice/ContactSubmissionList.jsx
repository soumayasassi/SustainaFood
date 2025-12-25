// src/components/backoffcom/ContactSubmissionList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "/src/assets/styles/backoffcss/backlist.css"; // Updated to use our new CSS
import { FaEye, FaFilePdf, FaSort } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/images/logooo.png";

const ContactSubmissionList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const submissionsPerPage = 5;
  const pagesVisited = currentPage * submissionsPerPage;
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Contact Submissions";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  // Fetch submissions from backend
  useEffect(() => {
    axios
      .get("http://localhost:3000/contact/contact/submissions") // Fixed endpoint
      .then((response) => {
        setSubmissions(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching submissions:", error);
        alert("Failed to load submissions.");
      });
  }, []);

  // Mark submission as responded
  const handleMarkAsResponded = async (submissionId) => {
    try {
      const response = await axios.put(`http://localhost:3000/contact/contact/submissions/${submissionId}/respond`, {
        status: "responded",
      });
      if (response.status === 200) {
        setSubmissions(
          submissions.map((submission) =>
            submission._id === submissionId ? { ...submission, status: "responded" } : submission
          )
        );
        alert("Submission marked as responded.");
      }
    } catch (error) {
      console.error("Error marking submission as responded:", error);
      alert("Failed to update status.");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Header background
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

    // Decorative bottom line
    doc.setDrawColor(144, 196, 60);
    doc.setLineWidth(1.5);
    doc.line(0, 40, doc.internal.pageSize.width, 40);

    // Logo
    const imgWidth = 30,
      imgHeight = 30;
    doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);

    // Title
    const title = "CONTACT SUBMISSIONS LIST";
    doc.setFontSize(28);
    doc.setTextColor(50, 62, 72);
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
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 38);

    // Table
    autoTable(doc, {
      head: [["ID", "Name", "Email", "Comment", "Submitted At", "Status"]],
      body: submissions.map((submission, index) => [
        (index + 1).toString(),
        submission.name,
        submission.email,
        submission.comment.substring(0, 50) + (submission.comment.length > 50 ? "..." : ""),
        new Date(submission.submittedAt).toLocaleString(),
        submission.status.charAt(0).toUpperCase() + submission.status.slice(1),
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
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const status = data.cell.text[0];
          if (status === "Responded") {
            doc.setFillColor(144, 196, 60);
            doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
          } else if (status === "Pending") {
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F");
            doc.setTextColor(100, 100, 100);
          }
        }
      },
      didDrawPage: (data) => {
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);

        // Page numbers
        doc.setFillColor(144, 196, 60);
        doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
          align: "center",
        });

        // Confidentiality notice
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10);

        // Institution info
        doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
      },
    });

    doc.save(`Contact_Submissions_${today.toISOString().split("T")[0]}.pdf`);
  };

  // Filter submissions based on search query
  const filteredSubmissions = submissions.filter((submission) =>
    submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort submissions
  const sortedSubmissions = filteredSubmissions.sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortField === "email") {
      return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
    } else if (sortField === "submittedAt") {
      return sortOrder === "asc"
        ? new Date(a.submittedAt) - new Date(b.submittedAt)
        : new Date(b.submittedAt) - new Date(a.submittedAt);
    } else if (sortField === "status") {
      return sortOrder === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    return 0;
  });

  const displaySubmissions = sortedSubmissions.slice(pagesVisited, pagesVisited + submissionsPerPage);
  const pageCount = Math.ceil(filteredSubmissions.length / submissionsPerPage);

  const changePage = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className="dashboard-container">
      <style>
        {`
          .respond-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 0.9rem;
            margin-left: 5px;
          }
          .respond-btn:hover {
            background-color: #0056b3;
          }
        `}
      </style>
      <Sidebar />
      <div className="dashboard-content">
        <Navbar setSearchQuery={setSearchQuery} />
        <div className="backlist-container">
          <div className="backlist-header">
            <h2 className="backlist-title">Contact Submissions</h2>
            <button className="backlist-action-button" onClick={exportToPDF}>
              <FaFilePdf /> Export to PDF
            </button>
          </div>
          
          <div className="backlist-search">
            <div className="sort-container">
              <label>Sort by:</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="submittedAt">Submitted At</option>
                <option value="status">Status</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          <table className="backlist-table">
            <thead className="backlist-table-head">
              <tr>
                <th className="backlist-table-header">ID</th>
                <th className="backlist-table-header">Name</th>
                <th className="backlist-table-header">Email</th>
                <th className="backlist-table-header">Comment</th>
                <th className="backlist-table-header">Submitted At</th>
                <th className="backlist-table-header">Status</th>
                <th className="backlist-table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displaySubmissions.map((submission, index) => (
                <tr key={submission._id} className="backlist-table-row">
                  <td className="backlist-table-cell">{pagesVisited + index + 1}</td>
                  <td className="backlist-table-cell">{submission.name}</td>
                  <td className="backlist-table-cell">{submission.email}</td>
                  <td className="backlist-table-cell">{submission.comment.substring(0, 50) + (submission.comment.length > 50 ? "..." : "")}</td>
                  <td className="backlist-table-cell">{new Date(submission.submittedAt).toLocaleString()}</td>
                  <td className="backlist-table-cell">{submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}</td>
                  <td className="backlist-table-cell backlist-actions-cell">
                    <Link to={`/contact/submissions/view/${submission._id}`} className="backlist-row-action">
                      <FaEye />
                    </Link>
                    {submission.status === "pending" && (
                      <button
                        className="backlist-row-action"
                        onClick={() => handleMarkAsResponded(submission._id)}
                        aria-label="Mark as responded"
                      >
                        Mark Responded
                      </button>
                    )}
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
            containerClassName={"backlist-pagination"}
            pageClassName={"backlist-pagination-item"}
            previousClassName={"backlist-pagination-item"}
            nextClassName={"backlist-pagination-item"}
            pageLinkClassName={"backlist-pagination-link"}
            previousLinkClassName={"backlist-pagination-link"}
            nextLinkClassName={"backlist-pagination-link"}
            disabledClassName={"backlist-pagination-disabled"}
            activeClassName={"backlist-pagination-active"}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactSubmissionList;