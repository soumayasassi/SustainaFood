import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getDonationTransactionsByRequestNeedId } from '../api/donationTransactionService';
import { getRequestById } from '../api/requestNeedsService';
import { createAndAcceptDonationTransactionBiderc, rejectDonationTransaction } from '../api/donationTransactionService';
import imgmouna from '../assets/images/imgmouna.png';
import styled, { createGlobalStyle } from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { useAlert } from '../contexts/AlertContext';

// Global Styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background: #f0f8f0;
    box-sizing: border-box;
  }
`;

// Styled Components
const DonationContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Controls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin: 20px 0;
`;

const Select = styled.select`
  font-size: 16px;
  border-radius: 25px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: 0.3s;
  cursor: pointer;
  background: white;
  color: #333;
  font-weight: bold;
  padding: 10px 10px 10px 3px;
  
  &:hover {
    border-color: #228b22;
    transform: scale(1.05);
  }
`;

const DonationCard = styled.div`
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
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const ProfileText = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #495057;
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #228b22;
  }
`;

const DonationDetails = styled.div`
  margin-bottom: 15px;
`;

const DonationDetail = styled.p`
  font-size: 14px;
  color: #495057;
  margin: 5px 0;

  strong {
    color: #222;
    font-weight: 600;
  }
`;

const ProductSection = styled.div`
  margin-bottom: 15px;
`;

const ProductsTitle = styled.h4`
  font-size: 16px;
  color: #222;
  margin: 0 0 10px;
`;

const ProductList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

const ProductItem = styled.li`
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

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  span {
    display: block;
    font-size: 13px;
    color: #333;
  }
`;

const ProductQuantity = styled.span`
  font-size: 16px;
  font-weight: bold;
  color: #d9534f;
  padding: 4px 8px;
  border-radius: 4px;

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 6px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-top: 15px;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background 0.3s ease-in-out;

  &.accept-btn {
    background-color: #28a745;
    color: white;

    &:hover {
      background-color: #218838;
    }
  }

  &.reject-btn {
    background-color: #dc3545;
    color: white;

    &:hover {
      background-color: #c82333;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    font-size: 14px;
    background: #228b22;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover:not(:disabled) {
      background: #56ab2f;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  span {
    font-size: 14px;
    color: #333;
  }
`;

const LoadingMessage = styled.div`
  font-size: 18px;
  color: #555;
  text-align: center;
  padding: 40px;
`;

const NoDonations = styled.p`
  font-size: 18px;
  color: #888;
  text-align: center;
  padding: 20px;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
`;

const DonationTitle = styled.h1`
  color: #228b22;
  font-size: 40px;
  margin-bottom: 20px;
  text-align: center;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 8px;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 320px;
  margin: 0 auto 20px;
  transition: all 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
`;

const SearchIcon = styled(FaSearch)`
  color: #555;
  margin-right: 8px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 16px;
  width: 100%;
  padding: 8px;
  background: transparent;
`;

const RejectionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Spinner = styled.div`
  display: inline-block;
  width: ${props => props.size === 'sm' ? '12px' : '16px'};
  height: ${props => props.size === 'sm' ? '12px' : '16px'};
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 5px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 5px;
  
  &.pending {
    background-color: #fff3cd;
    color: #856404;
  }
  
  &.approved {
    background-color: #d4edda;
    color: #155724;
  }
  
  &.rejected {
    background-color: #f8d7da;
    color: #721c24;
  }
`;

const ListDonationsRequest = () => {
  const { showAlert } = useAlert();
  const { id } = useParams(); // requestNeedId
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentRejectionId, setCurrentRejectionId] = useState(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood -  List Donations Request";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const requestResponse = await getRequestById(id);
        setRequest(requestResponse.data);

        const transactionData = await getDonationTransactionsByRequestNeedId(id);
        const transactionsArray = Array.isArray(transactionData) ? transactionData : [];
        setTransactions(transactionsArray);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!request || transactions.length === 0) return;

    let updatedTransactions = [...transactions];

    // Apply filters
    if (filterOption === 'pending' || filterOption === 'approved' || filterOption === 'rejected') {
      updatedTransactions = updatedTransactions.filter(t => t.status === filterOption);
    } else if (filterOption === 'full') {
      updatedTransactions = updatedTransactions.filter(transaction => {
        if (transaction.donation.category === 'packaged_products') {
          return transaction.allocatedProducts.every(item => {
            const requestedProduct = request.requestedProducts?.find(
              rp => rp.product.toString() === item.product.toString()
            );
            return requestedProduct && item.quantity >= requestedProduct.quantity;
          });
        } else if (transaction.donation.category === 'prepared_meals') {
          const totalAllocated = transaction.allocatedMeals.reduce((sum, m) => sum + m.quantity, 0);
          return totalAllocated >= request.numberOfMeals;
        }
        return false;
      });
    }

    // Apply search
    if (searchQuery) {
      updatedTransactions = updatedTransactions.filter(transaction => {
        const donation = transaction.donation;
        const productMatch = donation.products?.some(product =>
          product.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.product?.productType?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const mealMatch = donation.meals?.some(meal =>
          meal.meal?.mealName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const donorMatch = donation.donor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return productMatch || mealMatch || donorMatch;
      });
    }

    // Apply sorting
    updatedTransactions.sort((a, b) => {
      const donationA = a.donation;
      const donationB = b.donation;
      if (sortOption === 'title') {
        return donationA.title.localeCompare(donationB.title);
      } else if (sortOption === 'donor') {
        return (donationA.donor?.name || '').localeCompare(donationB.donor?.name || '');
      } else if (sortOption === 'status') {
        return a.status.localeCompare(b.status);
      } else {
        return new Date(donationA.expirationDate) - new Date(donationB.expirationDate);
      }
    });

    setFilteredTransactions(updatedTransactions);
    setCurrentPage(1);
  }, [transactions, request, filterOption, sortOption, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAcceptDonation = async (transactionId) => {
    if (!window.confirm('Are you sure you want to accept this transaction?')) return;

    try {
      setProcessing(prev => ({ ...prev, [transactionId]: 'accepting' }));

      const transaction = transactions.find(t => t._id === transactionId);
      const donation = transaction.donation;

      // Optimistic update
      setTransactions(prev => prev.map(t => 
        t._id === transactionId ? { ...t, status: 'approved' } : t
      ));

      if (donation.category === 'prepared_meals') {
        const totalAllocated = transaction.allocatedMeals.reduce((sum, m) => sum + m.quantity, 0);
        setRequest(prev => ({
          ...prev,
          numberOfMeals: prev.numberOfMeals - totalAllocated
        }));
      } else if (donation.category === 'packaged_products') {
        setRequest(prev => ({
          ...prev,
          requestedProducts: prev.requestedProducts.map(rp => {
            const allocatedProduct = transaction.allocatedProducts.find(ap => 
              ap.product.toString() === rp.product.toString()
            );
            if (allocatedProduct) {
              return {
                ...rp,
                quantity: rp.quantity - allocatedProduct.quantity
              };
            }
            return rp;
          })
        }));
      }

      const response = await createAndAcceptDonationTransactionBiderc(
        donation._id,
        id,
        transaction.allocatedProducts,
        transaction.allocatedMeals
      );
      console.log('createAndAcceptDonationTransactionBiderc response:', response);

      const { transaction: updatedTransaction, donation: updatedDonation, request: updatedRequest } = response;
      setTransactions(prev => prev.map(t => 
        t._id === transactionId ? updatedTransaction : t
      ));
      setRequest(updatedRequest);

      setFilterOption('all');
      showAlert('success', 'Transaction accepted successfully!');
    } catch (error) {
      console.error('Error accepting transaction:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred while accepting the transaction.';
      
      setTransactions(prev => prev.map(t => 
        t._id === transactionId ? { ...t, status: 'pending' } : t
      ));
      setRequest(prev => ({ ...prev }));

      showAlert('error', errorMessage);
    } finally {
      setProcessing(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleRejectDonation = async (transactionId) => {
    if (!rejectionReason) {
      showAlert('warning', 'Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [transactionId]: 'rejecting' }));
      await rejectDonationTransaction(transactionId, rejectionReason);

      setTransactions(prev => prev.map(t => 
        t._id === transactionId ? { ...t, status: 'rejected', rejectionReason } : t
      ));
      setCurrentRejectionId(null);
      setRejectionReason('');

      showAlert('success', 'Transaction rejected successfully!');
    } catch (error) {
      console.error('Error rejecting transaction:', error.response?.data || error.message);
      showAlert('error', 'Failed to reject transaction');
    } finally {
      setProcessing(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const openRejectionDialog = (transactionId) => {
    setCurrentRejectionId(transactionId);
    setRejectionReason('');
  };

  const handleProfileClick = (donorId) => {
    if (donorId) {
      navigate(`/ViewProfile/${donorId}`);
    }
  };

  if (loading) return <LoadingMessage>Loading...</LoadingMessage>;

  if (error) return (
    <>
      <Navbar />
      <ErrorContainer>Error: {error}</ErrorContainer>
      <Footer />
    </>
  );

  if (!request || transactions.length === 0) return (
    <>
      <Navbar />
      <ErrorContainer>
        {request ? `No transactions found for request: ${request.title}` : 'Request not found'}
      </ErrorContainer>
      <Footer />
    </>
  );

  return (
    <>
      <GlobalStyle />
      <Navbar />
      <DonationContainer>
        <DonationTitle>
          🤝 Transactions for Request: <br />
          <span className="request-title">{request.title}</span>
        </DonationTitle>

        <Controls>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search by product, meal, or donor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>

          <Select value={filterOption} onChange={(e) => setFilterOption(e.target.value)}>
            <option value="all">🟢 All Transactions</option>
            <option value="pending">🟠 Pending</option>
            <option value="approved">🟢 Approved</option>
            <option value="rejected">🔴 Rejected</option>
          </Select>

          <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="date">📆 Sort by Date</option>
            <option value="title">📝 Sort by Title</option>
            <option value="donor">👤 Sort by Donor</option>
            <option value="status">🔄 Sort by Status</option>
          </Select>
        </Controls>

        {currentTransactions.length > 0 ? (
          currentTransactions.map((transaction) => {
            const donation = transaction.donation;
            const userPhoto = donation.donor?.photo
              ? `http://localhost:3000/${donation.donor.photo}`
              : imgmouna;
            return (
              <DonationCard key={transaction._id}>
                <ProfileInfo>
                  <ProfileImg
                    src={userPhoto}
                    alt="Profile"
                    onError={(e) => {
                      e.target.src = imgmouna;
                      console.error(`Failed to load image: ${userPhoto}`);
                    }}
                    onClick={() => handleProfileClick(donation.donor?._id)}
                  />
                  <ProfileText onClick={() => handleProfileClick(donation.donor?._id)}>
                    {donation.donor?.name || 'Unknown'}
                  </ProfileText>
                  <ProfileText>{donation.donor?.role || 'N/A'}</ProfileText>
                </ProfileInfo>
                <DonationDetails>
                  <DonationDetail><strong>Transaction ID:</strong> {transaction.id}</DonationDetail>
                  <DonationDetail><strong>Donation Title:</strong> {donation.title || 'Untitled'}</DonationDetail>
                  <DonationDetail><strong>Location:</strong> {donation.address || 'Not specified'}</DonationDetail>
                  <DonationDetail>
                    <strong>Expiration Date:</strong> {donation.expirationDate ? new Date(donation.expirationDate).toLocaleDateString() : 'Not set'}
                  </DonationDetail>
                  <DonationDetail><strong>Category:</strong> {donation.category || 'Not specified'}</DonationDetail>
                  <DonationDetail>
                    <strong>Status:</strong>
                    <StatusBadge className={transaction.status || 'pending'}>
                      {transaction.status || 'pending'}
                    </StatusBadge>
                  </DonationDetail>
                  {donation.category === 'prepared_meals' && (
                    <DonationDetail>
                      <strong>Total Meals Donated:</strong> {donation.numberOfMeals || 'N/A'}
                    </DonationDetail>
                  )}
                  {transaction.rejectionReason && (
                    <DonationDetail>
                      <strong>Rejection Reason:</strong> {transaction.rejectionReason}
                    </DonationDetail>
                  )}
                </DonationDetails>
                <ProductSection>
                  <ProductsTitle>{donation.category === 'prepared_meals' ? 'Allocated Meals:' : 'Allocated Products:'}</ProductsTitle>
                  <ProductList>
                    {donation.category === 'prepared_meals' ? (
                      transaction.allocatedMeals && transaction.allocatedMeals.length > 0 ? (
                        transaction.allocatedMeals.map((item, itemIndex) => (
                          <ProductItem key={item._id || itemIndex}>
                            <ProductDetails>
                              <span><strong>Name:</strong> {item.meal?.mealName || 'N/A'}</span>
                              <span><strong>Type:</strong> {item.meal?.mealType || 'N/A'}</span>
                            </ProductDetails>
                            <ProductQuantity>
                              <strong>Quantity:</strong> {item.quantity || 0}
                            </ProductQuantity>
                          </ProductItem>
                        ))
                      ) : (
                        <ProductItem>No meals allocated</ProductItem>
                      )
                    ) : (
                      transaction.allocatedProducts && transaction.allocatedProducts.length > 0 ? (
                        transaction.allocatedProducts.map((item, itemIndex) => (
                          <ProductItem key={item._id || itemIndex}>
                            <ProductDetails>
                              <span><strong>Name:</strong> {item.product?.name || 'N/A'}</span>
                              <span><strong>Type:</strong> {item.product?.productType || 'N/A'}</span>
                              <span><strong>Weight:</strong> {item.product?.weightPerUnit ? `${item.product.weightPerUnit} ${item.product.weightUnit || ''}` : 'N/A'}</span>
                            </ProductDetails>
                            <ProductQuantity>
                              <strong>Quantity:</strong> {item.quantity || 0}
                            </ProductQuantity>
                          </ProductItem>
                        ))
                      ) : (
                        <ProductItem>No products allocated</ProductItem>
                      )
                    )}
                  </ProductList>
                </ProductSection>
                <ButtonContainer>
                  {transaction.status === 'pending' ? (
                    <>
                      <ActionButton
                        className="accept-btn"
                        onClick={() => handleAcceptDonation(transaction._id)}
                        disabled={processing[transaction._id]}
                      >
                        {processing[transaction._id] === 'accepting' ? (
                          <>
                            <Spinner size="sm" /> Processing...
                          </>
                        ) : '✔ Accept'}
                      </ActionButton>
                      <ActionButton
                        className="reject-btn"
                        onClick={() => openRejectionDialog(transaction._id)}
                        disabled={processing[transaction._id]}
                      >
                        ✖ Reject
                      </ActionButton>
                    </>
                  ) : (
                    <div style={{
                      color: transaction.status === 'approved' ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      Status: {transaction.status}
                    </div>
                  )}
                </ButtonContainer>
              </DonationCard>
            );
          })
        ) : (
          <NoDonations>No matching transactions found.</NoDonations>
        )}

        {currentRejectionId && (
          <RejectionModal>
            <ModalContent>
              <h3>Reason for Rejection</h3>
              <p>Please explain why you're rejecting this transaction:</p>
              <ModalTextarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (required)..."
              />
              <ModalButtons>
                <ActionButton
                  className="cancel-btn"
                  onClick={() => setCurrentRejectionId(null)}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  className="reject-btn"
                  onClick={() => handleRejectDonation(currentRejectionId)}
                  disabled={!rejectionReason || processing[currentRejectionId]}
                >
                  {processing[currentRejectionId] === 'rejecting' ? (
                    <>
                      <Spinner size="sm" /> Submitting...
                    </>
                  ) : 'Submit Rejection'}
                </ActionButton>
              </ModalButtons>
            </ModalContent>
          </RejectionModal>
        )}

        {totalPages > 1 && (
          <PaginationControls>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </PaginationControls>
        )}
      </DonationContainer>
      <Footer />
    </>
  );
};

export default ListDonationsRequest;