"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import "/src/assets/styles/backoffcss/backlist.css" // Changed from ngoList.css to backlist.css
import { FaEye, FaTrash, FaBan, FaUnlock, FaFilePdf } from "react-icons/fa"
import ReactPaginate from "react-paginate"
import { Link } from "react-router-dom"
import logo from "../../assets/images/logooo.png"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const ONGList = () => {
  const [ongs, setONGs] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const ongsPerPage = 5

  const pagesVisited = currentPage * ongsPerPage
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - ONGs";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    axios
      .get("http://localhost:3000/users/list")
      .then((response) => {
        const ongUsers = response.data.filter((user) => user.role === "ong")
        setONGs(ongUsers)
      })
      .catch((error) => console.error("Error fetching ONGs:", error))
  }, [])

  const handleBlockONG = async (ongId, isBlocked) => {
    try {
      const response = await axios.put(`http://localhost:3000/users/toggle-block/${ongId}`, {
        isBlocked: !isBlocked,
      })

      if (response.status === 200) {
        alert(`ONG has been ${response.data.isBlocked ? "blocked" : "unblocked"} successfully.`)
        setONGs(ongs.map((ong) => (ong._id === ongId ? { ...ong, isBlocked: response.data.isBlocked } : ong)))
      } else {
        alert(response.data.error || "Error toggling block status.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update block status.")
    }
  }

  const deleteONG = async (ongId) => {
    if (!window.confirm("Are you sure you want to delete this ONG?")) return

    try {
      await axios.delete(`http://localhost:3000/users/delete/${ongId}`)
      alert("ONG deleted!")
      setONGs(ongs.filter((ong) => ong._id !== ongId))
    } catch (error) {
      console.error("Error deleting ONG:", error)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Header background
    doc.setFillColor(245, 245, 245)
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F")

    // Decorative bottom line
    doc.setDrawColor(144, 196, 60)
    doc.setLineWidth(1.5)
    doc.line(0, 40, doc.internal.pageSize.width, 40)

    // Logo
    const imgWidth = 30,
      imgHeight = 30
    doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight)

    // Title
    const title = "ONG LIST"
    doc.setFontSize(28)
    doc.setTextColor(50, 62, 72)
    doc.setFont("helvetica", "bold")
    doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" })

    // Date
    const today = new Date()
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 38)

    // Table
    autoTable(doc, {
      head: [["ID", "Name", "Email", "Phone", "Tax Reference", "Status"]],
      body: ongs.map((ong, index) => [
        (index + 1).toString(),
        ong.name,
        ong.email,
        ong.phone || "N/A",
        ong.id_fiscale || "N/A",
        ong.isActive ? "Active" : "Inactive",
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
          const status = data.cell.text[0]
          if (status === "Active") {
            doc.setFillColor(144, 196, 60)
            doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F")
            doc.setTextColor(255, 255, 255)
          } else if (status === "Inactive") {
            doc.setFillColor(220, 220, 220)
            doc.roundedRect(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, 2, 2, "F")
            doc.setTextColor(100, 100, 100)
          }
        }
      },
      didDrawPage: (data) => {
        // Footer line
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(
          15,
          doc.internal.pageSize.height - 20,
          doc.internal.pageSize.width - 15,
          doc.internal.pageSize.height - 20,
        )

        // Page numbers
        doc.setFillColor(144, 196, 60)
        doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.text(
          `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        )

        // Confidentiality notice
        doc.setTextColor(120, 120, 120)
        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10)

        // Institution info
        doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10)
      },
    })

    doc.save(`ONG_Directory_${today.toISOString().split("T")[0]}.pdf`)
  }

  const filteredONGs = ongs.filter((ong) => {
    const phoneString = ong.phone ? ong.phone.toString() : ""
    return (
      ong.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ong.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneString.includes(searchQuery)
    )
  })

  const sortedONGs = filteredONGs.sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortField === "email") {
      return sortOrder === "asc" ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email)
    } else if (sortField === "phone") {
      return sortOrder === "asc" ? a.phone - b.phone : b.phone - a.phone
    } else if (sortField === "id_fiscale") {
      return sortOrder === "asc"
        ? (a.id_fiscale || "").localeCompare(b.id_fiscale || "")
        : (b.id_fiscale || "").localeCompare(a.id_fiscale || "")
    } else if (sortField === "isActive") {
      return sortOrder === "asc"
        ? (a.isActive ? 1 : -1) - (b.isActive ? 1 : -1)
        : (b.isActive ? 1 : -1) - (a.isActive ? 1 : -1)
    }
    return 0
  })

  const displayONGs = sortedONGs.slice(pagesVisited, pagesVisited + ongsPerPage)
  const pageCount = Math.ceil(filteredONGs.length / ongsPerPage)

  const changePage = ({ selected }) => {
    setCurrentPage(selected)
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar setSearchQuery={setSearchQuery} />
        <div className="backlist-container">
          {/* Changed from ong-list to backlist-container */}
          <div className="backlist-header">
            {/* Changed from header-container to backlist-header */}
            <h2 className="backlist-title">ONG Management</h2>
            {/* Added backlist-title class */}
            <button className="backlist-action-button" onClick={exportToPDF}>
              {/* Changed from export-pdf-btn to backlist-action-button */}
              <FaFilePdf /> Export to PDF
            </button>
          </div>

          <div className="backlist-search">
            {/* Added backlist-search wrapper */}
            <div className="sort-container">
              <label>Sort by:</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="id_fiscale">Tax Reference</option>
                <option value="isActive">Active Status</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <table className="backlist-table">
            {/* Added backlist-table class */}
            <thead className="backlist-table-head">
              {/* Added backlist-table-head class */}
              <tr>
                <th className="backlist-table-header">ID</th>
                <th className="backlist-table-header">Photo</th>
                <th className="backlist-table-header">Name</th>
                <th className="backlist-table-header">Email</th>
                <th className="backlist-table-header">Phone</th>
                <th className="backlist-table-header">Tax Reference</th>
                <th className="backlist-table-header">Active</th>
                <th className="backlist-table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayONGs.map((ong, index) => (
                <tr key={ong._id} className="backlist-table-row">
                  {/* Added backlist-table-row class */}
                  <td className="backlist-table-cell">{pagesVisited + index + 1}</td>
                  <td className="backlist-table-cell">
                    <img
                      src={ong.photo ? `http://localhost:3000/${ong.photo}` : "/src/assets/User_icon_2.svg.png"}
                      alt="ong"
                      style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                    />
                  </td>
                  <td className="backlist-table-cell">{ong.name}</td>
                  <td className="backlist-table-cell">{ong.email}</td>
                  <td className="backlist-table-cell">{ong.phone}</td>
                  <td className="backlist-table-cell">{ong.id_fiscale || "N/A"}</td>
                  <td className="backlist-table-cell">{ong.isActive ? "Yes" : "No"}</td>
                  <td className="backlist-table-cell backlist-actions-cell">
                    {/* Added backlist-actions-cell class */}
                    <Link to={`/ongs/view/${ong._id}`} className="backlist-row-action">
                      {/* Changed from view-btn to backlist-row-action */}
                      <FaEye />
                    </Link>
                    <button
                      className="backlist-row-action"
                      onClick={() => handleBlockONG(ong._id, ong.isBlocked)}
                      style={{ color: ong.isBlocked ? "green" : "red" }}
                    >
                      {/* Changed from block-btn to backlist-row-action */}
                      {ong.isBlocked ? <FaUnlock /> : <FaBan />}
                    </button>
                    <button className="backlist-row-action" onClick={() => deleteONG(ong._id)}>
                      {/* Changed from delete-btn to backlist-row-action */}
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
  )
}

export default ONGList
