import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDonationById } from "../../api/donationService";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import "../../assets/styles/backoffcss/RequestTable.css";
import styled from 'styled-components';
import imgmouna from '../../assets/images/imgmouna.png';

// Styled Components
const DonationCard = styled.div`
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 128, 0, 0.2);
    padding: 20px;
    margin: 50px auto;
    border-left: 6px solid #228b22;
`;

const DonationHeader = styled.h2`
  color: #228b22;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
`;

const DonorInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const ProfileImg = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
  border: 2px solid #228b22;
`;

const DonorText = styled.div`
  h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
  }
  p.role {
    margin: 5px 0 0;
    color: #666;
    font-size: 14px;
  }
`;

const ItemsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
`;

const ItemCard = styled.li`
  background: #f8f9fa;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  
  span {
    margin: 2px 0;
    color: #495057;
  }
  
  strong {
    color: #222;
  }
`;

const ProductsSection = styled.div`
  margin-top: 20px;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const ProductCard = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #228b22;
  padding: 10px;
  border-radius: 4px;
  
  p {
    margin: 5px 0;
    color: #495057;
  }
  
  strong {
    color: #222;
  }
`;

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

  ${({ variant }) => variant === 'back' && `
    background: #6c757d;
    &:hover { background: #5a6268; transform: translateY(-2px); }
  `}

  ${({ variant }) => variant === 'submit' && `
    background: #28a745;
    &:hover { background: #218838; transform: translateY(-2px); }
  `}

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const DonationDetails = () => {
    const { id } = useParams();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Donation Details";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

    useEffect(() => {
        const fetchDonation = async () => {
            try {
                const response = await getDonationById(id);
                console.log("Fetched donation:", response.data); // Debug log
                setDonation(response.data);
            } catch (err) {
                console.error("Fetch error:", err); // Debug log
                setError(err.response?.data?.message || '❌ Error fetching donation details');
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [id]);

    if (loading) {
        return <div className="loading">⏳ Loading donation details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!donation) {
        return <div className="error">⚠️ Donation not found.</div>;
    }

    return (
        <div className="product-detail-container">
            <Sidebar />
            <div className="product-detail-content">
                <Navbar />
                <DonationCard>
                    <DonationHeader>📦 Donation Details</DonationHeader>
                    
                    <DonorInfo>
                        <ProfileImg
                            src={donation.donor?.photo ? `http://localhost:3000/${donation.donor.photo}` : imgmouna}
                            alt="Donor Profile"
                            onError={(e) => (e.target.src = imgmouna)}
                        />
                        <DonorText>
                            <h3>{donation.donor?.name || "Unknown Donor"}</h3>
                            <p className="role">{donation.donor?.role || "Role Not Specified"}</p>
                        </DonorText>
                    </DonorInfo>

                    <ItemsList>
                        <ItemCard>
                            <span><strong>📝 Title:</strong> {donation.title || "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>📂 Category:</strong> {donation.category || "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>🔄 Status:</strong> {donation.status || "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>📍 Address:</strong> {donation.address || "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>📅 Expiration Date:</strong> {donation.expirationDate ? new Date(donation.expirationDate).toLocaleDateString() : "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>🕒 Created At:</strong> {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "N/A"}</span>
                        </ItemCard>
                        <ItemCard>
                            <span><strong>🔄 Updated At:</strong> {donation.updatedAt ? new Date(donation.updatedAt).toLocaleDateString() : "N/A"}</span>
                        </ItemCard>
                    </ItemsList>

                    {/* Products or Meals Section */}
                    {donation.category === "packaged_products" && donation.products && donation.products.length > 0 ? (
                        <ProductsSection>
                            <h3 style={{ color: "#228b22", marginBottom: "15px" }}>🛒 Donated Products</h3>
                            <ProductsGrid>
                                {donation.products.map((item, index) => (
                                    <ProductCard key={index}>
                                        <p><strong>Name:</strong> {item.product?.name || "Unknown Product"}</p>
                                        <p>📦 <strong>Type:</strong> {item.product?.productType || "Not specified"}</p>
                                        <p>⚖️ <strong>Weight:</strong> {item.product?.weightPerUnit || 0} {item.product?.weightUnit || ""}</p>
                                        <p>🔢 <strong>Quantity:</strong> {item.quantity || 0}</p>
                                        <p>🟢 <strong>Status:</strong> {item.product?.status || "Unknown"}</p>
                                    </ProductCard>
                                ))}
                            </ProductsGrid>
                        </ProductsSection>
                    ) : null}

                    {donation.category === "prepared_meals" && donation.meals && donation.meals.length > 0 ? (
                        <ProductsSection>
                            <h3 style={{ color: "#228b22", marginBottom: "15px" }}>🍽️ Donated Meals</h3>
                            {donation.numberOfMeals && (
                                <ItemCard>
                                    <span><strong>🍴 Total Number of Meals:</strong> {donation.numberOfMeals}</span>
                                </ItemCard>
                            )}
                            <ProductsGrid>
                                {donation.meals.map((item, index) => (
                                    <ProductCard key={index}>
                                        <p><strong>🍽️ Name:</strong> {item.meal?.mealName || "Not specified"}</p>
                                        <p>📝 <strong>Description:</strong> {item.meal?.mealDescription || "None"}</p>
                                        <p>🍴 <strong>Type:</strong> {item.meal?.mealType || "Unknown"}</p>
                                        <p>🔢 <strong>Quantity:</strong> {item.quantity || 0}</p>
                                    </ProductCard>
                                ))}
                            </ProductsGrid>
                        </ProductsSection>
                    ) : null}

                    {((donation.category === "packaged_products" && (!donation.products || donation.products.length === 0)) ||
                      (donation.category === "prepared_meals" && (!donation.meals || donation.meals.length === 0))) && (
                        <p>🚫 No items specified for this donation.</p>
                    )}

                    <Button variant="back" onClick={() => window.history.back()}>🔙 Go Back</Button>
                    <Button
                        variant="submit"
                        as={Link}
                        to={`/RequestDonationsList/${id}`}
                        style={{ textDecoration: 'none' }}
                    >
                        👀 View Requests
                    </Button>
                </DonationCard>
            </div>
        </div>
    );
};

export default DonationDetails;