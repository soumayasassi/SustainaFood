import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import { getRequestsByDonationId } from "../../api/requestNeedsService";
import { getDonationById } from "../../api/donationService";
import { getUserById } from "../../api/userService";
import "../../assets/styles/backoffcss/RequestDetail.css";
import imgmouna from '../../assets/images/imgmouna.png';
import styled from 'styled-components';
import { useAlert } from '../../contexts/AlertContext';

// Styled Components (unchanged)
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

const RequestCard = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #228b22;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.02);
  }

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProfileImg = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #228b22;
`;

const ProfileText = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #495057;
`;

const RequestDetails = styled.div`
  margin-bottom: 15px;
`;

const RequestDetail = styled.p`
  font-size: 14px;
  color: #495057;
  margin: 5px 0;

  strong {
    color: #222;
    font-weight: 600;
  }
`;

const ItemSection = styled.div`
  margin-bottom: 15px;
`;

const ItemsTitle = styled.h4`
  font-size: 16px;
  color: #222;
  margin: 0 0 10px;
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

const Item = styled.li`
  background: #ffffff;
  padding: 10px;
  border-left: 3px solid #228b22;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 14px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
    gap: 60px;
      span {
    display: block;
    font-size: 13px;
    color: #333;
  }
`;

const ItemQuantity = styled.span`
  font-size: 14px;
  font-weight: bold;
  color: #d9534f;
  padding: 4px 8px;
  border-radius: 4px;

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px;
  }
`;

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

const ErrorContainer = styled.div`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin-top: -500px;
  margin-left: 200px;
  color: #4CAF50;
  font-size: 1.5rem;
  text-align: center;
  padding: 20px;
`;

const DonationsRequestList = () => {
  const { showAlert } = useAlert();
  const { id } = useParams();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [donation, setDonation] = useState(null);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Donation Requests";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [donationResponse, requestsData] = await Promise.all([
          getDonationById(id),
          getRequestsByDonationId(id)
        ]);

        console.log('Donation Response:', donationResponse.data);
        console.log('Requests Data:', requestsData);

        setDonation(donationResponse.data);
        const requestsArray = Array.isArray(requestsData.data) ? requestsData.data : requestsData || [];
        setRequests(requestsArray);

        if (requestsArray.length > 0) {
          const uniqueRecipientIds = [...new Set(requestsArray.map(r => {
            return typeof r.recipient === 'object' ? r.recipient._id : r.recipient;
          }).filter(id => id))];

          console.log('Unique Recipient IDs:', uniqueRecipientIds);

          const userPromises = uniqueRecipientIds.map(id => 
            getUserById(id)
              .then(response => {
                console.log(`User data for ID ${id}:`, response.data);
                return { id, data: response.data };
              })
              .catch(err => {
                console.error(`Error fetching user ${id}:`, err);
                return { id, data: null };
              })
          );
          
          const userResults = await Promise.all(userPromises);
          const usersData = Object.fromEntries(
            userResults.map(({ id, data }) => [id, data])
          );
          console.log('Fetched Users:', usersData);
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!requests.length) return;

    let result = [...requests];
    setFilteredRequests(result);
  }, [requests]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const RequestCardComponent = ({ request }) => {
    const userPhoto = request.recipient?.photo
      ? `http://localhost:3000/${request.recipient.photo}`
      : imgmouna;

    return (
      <RequestCard>
        <ProfileInfo>
          <ProfileImg
            src={userPhoto}
            alt="Profile"
            onError={(e) => {
              e.target.src = imgmouna;
              console.error(`Failed to load image: ${userPhoto}`);
            }}
          />
          <ProfileText>{request.recipient?.name || 'Unknown Recipient'}</ProfileText>
          <ProfileText>{request.recipient?.role || 'Role Not Specified'}</ProfileText>
        </ProfileInfo>
        <RequestDetails>
          <RequestDetail><strong>Title:</strong> {request.title || 'Untitled'}</RequestDetail>
          <RequestDetail><strong>Status:</strong> {request.status || 'pending'}</RequestDetail>
          <RequestDetail><strong>Location:</strong> {request.location || 'Not specified'}</RequestDetail>
          <RequestDetail><strong>Description:</strong> {request.description || 'No description'}</RequestDetail>
          {donation?.category === 'prepared_meals' && (
            <RequestDetail><strong>Number of Meals:</strong> {request.numberOfMeals || 'Not specified'}</RequestDetail>
          )}
        </RequestDetails>
        <ItemSection>
          {donation?.category === 'prepared_meals' && request.requestedMeals?.length > 0 ? (
            <>
              <ItemsTitle>Requested Meals:</ItemsTitle>
              <ItemList>
                {request.requestedMeals.map((item, index) => (
                  <Item key={index}>
                    <ItemDetails>
                      <span><strong>Name:</strong> {item.meal?.mealName || 'Not specified'}</span>
                      <span><strong>Type:</strong> {item.meal?.mealType || 'Unknown'}</span>
                      <span><strong>Description:</strong> {item.meal?.mealDescription || 'None'}</span>
                    </ItemDetails>
                    <ItemQuantity>{item.quantity || 0}</ItemQuantity>
                  </Item>
                ))}
              </ItemList>
            </>
          ) : donation?.category === 'packaged_products' && request.requestedProducts?.length > 0 ? (
            <>
              <ItemsTitle>Requested Products:</ItemsTitle>
              <ItemList>
                {request.requestedProducts.map((item, index) => (
                  <Item key={index}>
                    <ItemDetails>
                   
                <div style={{display:"flex"}}>
                <p> <strong>Name:</strong>{item.product?.name || item.product?.productType || 'Unknown Product'}</p>
                <p> 📦 <strong>Type:</strong> {item.product?.productType || 'Not specified'}</p>
                        <p> ⚖️ <strong>Weight:</strong> {item.product?.weightPerUnit || 0} {item.product?.weightUnit || ''}</p>
                        <p> 🔢 <strong>Quantity:</strong> {item.quantity || 0} {item.product?.weightUnitTotale || ''}</p>
                        <p> 🟢 <strong>Status:</strong> {item.product?.status || 'Unknown'}</p>
            </div>  
                    </ItemDetails>
                    <ItemQuantity>{item.quantity || 0}</ItemQuantity>
                  </Item>
                ))}
              </ItemList>
            </>
          ) : (
            <p>No items requested</p>
          )}
        </ItemSection>
     
      </RequestCard>
    );
  };

  if (loading) return <div className="loading-message">Loading...</div>;

  if (error) return (
    <>
      <Navbar />
      <Sidebar />
      <ErrorContainer>
        {error}<br />
        <Button variant="back" onClick={() => window.history.back()}>🔙 Go Back</Button>
      </ErrorContainer>
    </>
  );

  return (
    <div className="request-detail-container">
      <Sidebar />
      <div className="request-detail-content">
        <Navbar />
        <div className="container my-5">
          <h1>Requests for Donation: {donation?.title || 'Loading...'}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '10px' }}>
            <Button variant="back" onClick={() => window.history.back()}>🔙 Go Back</Button>
          </div>

          {currentItems.length > 0 ? (
            currentItems.map(request => (
              <RequestCardComponent
                key={request._id}
                request={request}
              />
            ))
          ) : (
            <p>No requests match the current filters</p>
          )}

          <PaginationControls>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </PaginationControls>
        </div>
      </div>
    </div>
  );
};

export default DonationsRequestList;