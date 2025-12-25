import React, { useState, useEffect } from 'react';
import { useParams,Link } from 'react-router-dom';
import { getRequestById } from '../../api/requestNeedsService';
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "../../assets/styles/backoffcss/RequestDetail.css";
import imgmouna from '../../assets/images/imgmouna.png';
import styled from 'styled-components';

const Button = styled.button`
  display: inline-block;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 8px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  ${({ variant }) => variant === 'add' && `
    background: #228b22;
    &:hover { background: #1e7b1e; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'cancel' && `
    background: #dc3545;
    &:hover { background: #b02a37; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'submit' && `
    background: #28a745;
    &:hover { background: #218838; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'donate' && `
    background: #228b22;
    &:hover { background: #1e7b1e; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'back' && `
    background: #6c757d;
    &:hover { background: #5a6268; transform: translateY(-2px); }
  `}

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;
const RequestDetail = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Request Details";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await getRequestById(id);
        setRequest(response.data);
      } catch (err) {
        setError('❌ Error fetching request details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  if (loading) return <div className="loading">⏳ Loading request details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!request) return <div className="error">⚠️ Request not found.</div>;

  return (
    <div className="request-detail-container">
      <Sidebar />
      <div className="request-detail-content">
        <Navbar />
        <div className="request-card">
          <div className="request-header">
            <h2>📄 Request Details</h2>
          </div>

          <div className="request-info">
            <div className="recipient-info">
              <img
                src={request.recipient?.photo ? `http://localhost:3000/${request.recipient.photo}` : imgmouna}
                alt="Profile"
                className="profile-img-details"
                onError={(e) => (e.target.src = imgmouna)}
              />
              <div className="recipient-text">
                <h3> {request.recipient?.name || "Unknown User"}</h3>
                <p className="role"> {request.recipient?.role || "Role Not Specified"}</p>
              </div>
            </div>

            <div className="detail-item">📌 <strong>Title:</strong> {request.title || 'Untitled Request'}</div>
            <div className="detail-item">📂 <strong>Category:</strong> {request.category || 'Not specified'}</div>
            <div className="detail-item">📅 <strong>Expiration Date:</strong> 
              {request.expirationDate ? new Date(request.expirationDate).toLocaleDateString() : 'Not defined'}
            </div>
            <div className="detail-item">📊 <strong>Status:</strong> {request.status || 'Unknown'}</div>
            <div className="detail-item">📝 <strong>Description:</strong> {request.description || 'N/A'}</div>

            {request.category === 'prepared_meals' && (
              <div className="detail-item">🍽️ <strong>Number of Meals:</strong> {request.numberOfMeals || 'Not specified'}</div>
            )}

            {request.category === 'packaged_products' && request.requestedProducts && (
              <div className="products-section">
                <h3>🛒 Requested Products:</h3>
                {request.requestedProducts.length > 0 ? (
                  <div className="products-grid">
                    {request.requestedProducts.map((item, index) => (
                      <div className="product-card-details" key={index}>
                        <p> <strong>Name:</strong>{item.product?.name || item.product?.productType || 'Unknown Product'}</p>
                        <p>📦 <strong>Type:</strong> {item.product?.productType || 'Not specified'}</p>
                        <p>⚖️ <strong>Weight:</strong> {item.product?.weightPerUnit || 0} {item.product?.weightUnit || ''}</p>
                        <p>🔢 <strong>Quantity:</strong> {item.quantity || 0} {item.product?.weightUnitTotale || ''}</p>
                        <p>🟢 <strong>Status:</strong> {item.product?.status || 'Unknown'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>🚫 No products requested</p>
                )}
              </div>
            )}
          </div>
          <Button variant="back" onClick={() => window.history.back()}>🔙 Go Back</Button>
          <Button
              variant="submit"
              as={Link}
              to={`/DonationsRequestList/${id}`}
              style={{ textDecoration: 'none' }}
            >
              👀 View Donations
            </Button>
        </div>

      </div>

    </div>
  );
};

export default RequestDetail;
