// ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById } from '../../api/productService'; // Assure-toi que le chemin est correct
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "../../assets/styles/backoffcss/ProductDetail.css"; // Crée ce fichier CSS

const ProductDetail = () => {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Product Details";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching product details.');
        console.error(error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div className="product-detail-container">
      <Sidebar />
      <div className="product-detail-content">
        <Navbar />
        <div className="product-card">
          <div className="product-header">
            <h2>Product Details</h2>
          </div>
          <div className="product-details">
            <table className="details-table">
              <tbody>
                <tr>
                  <td><strong>ID:</strong></td>
                  <td>{product.id}</td>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>{product.name}</td>
                </tr>
                <tr>
                  <td><strong>Type:</strong></td>
                  <td>{product.productType}</td>
                </tr>
                <tr>
                  <td><strong>Status:</strong></td>
                  <td>{product.status}</td>
                </tr>
                <tr>
                  <td><strong>Description:</strong></td>
                  <td>{product.productDescription}</td>
                </tr>
                <tr>
                  <td><strong>Weight:</strong></td>
                  <td>{product.weightPerUnit ? `${product.weightPerUnit} ${product.weightUnit}` : "N/A"}</td>
                </tr>
                {/* Ajoute d'autres champs ici selon ton modèle de produit */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
