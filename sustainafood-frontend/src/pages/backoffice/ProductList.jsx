import React, { useState, useEffect } from "react";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import { FaFilePdf, FaEye } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/styles/backoffcss/ProductList.css";
import { getAllProducts } from "../../api/productService";
import { getrequests } from "../../api/requestNeedsService"; // Importez getrequests
import { Link } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productsPerPage = 5;

  const pagesVisited = currentPage * productsPerPage;
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Products";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsResponse = await getAllProducts();
        const requestsResponse = await getrequests(); // Récupérer les requêtes
        console.log("Products API Response Data:", productsResponse.data);
        console.log("Requests API Response Data:", requestsResponse.data);

        // Filtrer les requêtes pour ne garder que les "prepared_meals"
        const preparedMeals = requestsResponse.data.filter(req => req.category === "prepared_meals");

        // Formatter les "prepared_meals" pour qu'ils aient la même structure que les produits
        const formattedMeals = preparedMeals.map(meal => ({
          id: meal._id,
          name: meal.mealName,
          productType: meal.mealType, // Assigner mealType à productType
          status: meal.status,
          productDescription: meal.mealDescription,
          weightPerUnit: meal.numberOfMeals,
          weightUnit: "meals",
          isPreparedMeal: true // Ajouter un indicateur pour distinguer les "prepared_meals" des produits
        }));

        // Combiner les produits et les "prepared_meals"
        const allProducts = [...productsResponse.data, ...formattedMeals];
        setProducts(allProducts);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError("Error fetching products. Please try again later.");
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products;

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;

    if (sortField === "name") {
      comparison = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "productType") {
      comparison = (a.productType || "").localeCompare(b.productType || "");
    } else if (sortField === "status") {
      comparison = (a.status || "").localeCompare(b.status || "");
    } else if (sortField === "weight") {
      const weightA = a.weightPerUnit || 0;
      const weightB = b.weightPerUnit || 0;
      comparison = weightA - weightB;
    } else if (sortField === "id") {
      comparison = a.id - b.id;
    }

    return sortOrder === "asc" ? comparison : comparison * -1;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Product List", 10, 10);

    const tableColumn = ["ID", "Name", "Type", "Status", "Description", "Weight"];
    const tableRows = sortedProducts.map((product) => [
      product.id,
      product.name,
      product.productType,
      product.status,
      product.productDescription,
      product.weightPerUnit ? `${product.weightPerUnit} ${product.weightUnit}` : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: "#4CAF50",
        textColor: "#ffffff",
      },
    });

    doc.save("Product_List.pdf");
  };

  const displayProducts = sortedProducts.slice(pagesVisited, pagesVisited + productsPerPage);
  const pageCount = Math.ceil(filteredProducts.length / productsPerPage);

  const changePage = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />

        <div className="product-list">
          <div className="header-container">
            <h2>Product Management</h2>
            <button className="export-pdf-btn" onClick={exportToPDF}>
              <FaFilePdf /> Export to PDF
            </button>
          </div>

          <div className="sort-container">
            <label htmlFor="sortField">Sort By:</label>
            <select
              id="sortField"
              value={sortField}
              onChange={handleSortChange}
            >
              <option value="name">Name</option>
              <option value="productType">Type</option>
              <option value="status">Status</option>
              <option value="weight">Weight</option>
              <option value="id">ID</option>
            </select>

            <label htmlFor="sortOrder">Order:</label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={handleSortOrderChange}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {loading ? (
            <div>Loading products...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Weight</th>
                    <th>Actions</th>{/* Nouvelle colonne */}
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.productType}</td>
                      <td>{product.status}</td>
                      <td>{product.productDescription}</td>
                      <td>{product.weightPerUnit ? `${product.weightPerUnit} ${product.weightUnit}` : "N/A"}</td>
                      <td>
                        <Link to={`/products/view/${product.id}`}>
                          <button>
                            <FaEye />{/* Utilise l'icône FaEye de react-icons/fa */}
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                pageCount={pageCount}
                onPageChange={changePage}
                containerClassName={"pagination"}
                activeClassName={"active"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
