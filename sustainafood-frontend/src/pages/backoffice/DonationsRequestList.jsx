import React, { useState, useEffect } from "react";
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import { getRequestById } from "../../api/requestNeedsService";
import { getDonationByRequestId, getDonationById } from "../../api/donationService";
import { getUserById } from "../../api/userService";
import { createAndAcceptDonationTransaction, rejectDonation } from "../../api/donationTransactionService";
import "../../assets/styles/backoffcss/RequestTable.css";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useAlert } from "../../contexts/AlertContext";
import "../../assets/styles/backoffcss/RequestDetail.css";
import imgmouna from "../../assets/images/imgmouna.png";

// Styled Components (inchangés, inclus pour référence)
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
`;

const ProfileText = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #495057;
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

  ${({ variant }) =>
    variant === "back" &&
    `
    background: #6c757d;
    &:hover { background: #5a6268; transform: translateY(-2px); }
  `}

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ErrorContainer = styled.div`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin-top: -500px;
  margin-left: 200px;
  color: #4caf50;
  font-size: 1.5rem;
  text-align: center;
  padding: 20px;
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

const DonationsRequestList = () => {
  const { showAlert } = useAlert();
  const { id } = useParams();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [request, setRequest] = useState(null);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [filterOption, setFilterOption] = useState("all");
  const [sortOption, setSortOption] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState({});
  const [currentRejectionId, setCurrentRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Donations Request List";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestResponse, donationData] = await Promise.all([
          getRequestById(id),
          getDonationByRequestId(id),
        ]);

        console.log("Request Response:", requestResponse.data);
        console.log("Donation Data:", donationData);

        setRequest(requestResponse.data);
        const donationsArray = Array.isArray(donationData) ? donationData : [];
        setDonations(donationsArray);

        if (donationsArray.length > 0) {
          // Extraire l'ID du donateur à partir de l'objet donor
          const uniqueDonorIds = [
            ...new Set(
              donationsArray.map((d) =>
                d.donor && typeof d.donor === "object" ? d.donor._id : d.donor
              )
            ),
          ].filter((id) => id); // Filtrer les valeurs undefined/null
          console.log("Unique Donor IDs:", uniqueDonorIds);

          const userPromises = uniqueDonorIds.map((id) =>
            getUserById(id)
              .then((response) => {
                console.log(`User data for ${id}:`, response.data);
                return { id, data: response.data };
              })
              .catch((err) => {
                console.error(`Error fetching user ${id}:`, err);
                return { id, data: null };
              })
          );

          const userResults = await Promise.all(userPromises);
          const usersMap = Object.fromEntries(
            userResults.map(({ id, data }) => [id, data])
          );
          console.log("Users Map:", usersMap);
          setUsers(usersMap);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!donations.length || !request) return;

    let result = [...donations];

    if (filterOption !== "all") {
      if (["pending", "approved", "rejected"].includes(filterOption)) {
        result = result.filter((d) => d.status === filterOption);
      } else if (filterOption === "full") {
        result = result.filter((donation) =>
          donation.products.every((item) => {
            const requestedProduct = request?.requestedProducts?.find(
              (rp) =>
                rp.productType === item.product?.productType ||
                rp._id === item.product?._id
            );
            return (
              requestedProduct && item.quantity >= requestedProduct.totalQuantity
            );
          })
        );
      }
    }

    if (searchQuery) {
      result = result.filter((donation) => {
        const productMatch = donation.products?.some(
          (product) =>
            product.product?.name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            product.product?.productType
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        );
        const donorId =
          donation.donor && typeof donation.donor === "object"
            ? donation.donor._id
            : donation.donor;
        const donorMatch = users[donorId]?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        return productMatch || donorMatch;
      });
    }

    result.sort((a, b) => {
      const donorAId =
        a.donor && typeof a.donor === "object" ? a.donor._id : a.donor;
      const donorBId =
        b.donor && typeof b.donor === "object" ? b.donor._id : b.donor;
      switch (sortOption) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "donor":
          return (users[donorAId]?.name || "").localeCompare(
            users[donorBId]?.name || ""
          );
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredDonations(result);
    setCurrentPage(1);
  }, [donations, request, users, filterOption, sortOption, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDonations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };



  const openRejectionDialog = (donationId) => {
    setCurrentRejectionId(donationId);
    setRejectionReason("");
  };

  if (loading) return <div className="loading-message">Loading...</div>;

  if (error)
    return (
      <>
        <Navbar />
        <Sidebar />
        <ErrorContainer>
          {error}
          <br />
          <Button variant="back" onClick={() => window.history.back()}>
            🔙 Go Back
          </Button>
        </ErrorContainer>
      </>
    );

  return (
    <div className="request-detail-container">
      <Sidebar />
      <div className="request-detail-content">
        <Navbar />
        <div className="container my-5">
          <h1>Donations for Request: {request?.title || "Loading..."}</h1>
          <div
            className="header-container"
            style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", padding: "10px" ,backgroundColor:"white"}}
          >
            <div className="filter-container">
              <Button variant="back" onClick={() => window.history.back()}>
                🔙 Go Back
              </Button>
              <select
                onChange={(e) => setFilterOption(e.target.value)}
                value={filterOption}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="full">Full</option>
              </select>
              <select
                onChange={(e) => setSortOption(e.target.value)}
                value={sortOption}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="donor">Sort by Donor</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {currentItems.length > 0 ? (
            currentItems.map((donation) => {
              const donorId =
                donation.donor && typeof donation.donor === "object"
                  ? donation.donor._id
                  : donation.donor;
              const userPhoto = users[donorId]?.photo
                ? `http://localhost:3000/${users[donorId].photo}`
                : imgmouna;

              return (
                <DonationCard key={donation._id}>
                  <ProfileInfo>
                    <ProfileImg
                      src={userPhoto}
                      alt="Donor"
                      onError={(e) => {
                        e.target.src = imgmouna;
                        console.error(`Failed to load image: ${userPhoto}`);
                      }}
                    />
                    <ProfileText>{users[donorId]?.name || "Unknown"}</ProfileText>
                    <ProfileText>{users[donorId]?.role || "N/A"}</ProfileText>
                  </ProfileInfo>
                  <DonationDetails>
                    <DonationDetail>
                      <strong>Title:</strong> {donation.title || "Untitled"}
                    </DonationDetail>
                    <DonationDetail>
                      <strong>Location:</strong> {donation.location || "Not specified"}
                    </DonationDetail>
                    <DonationDetail>
                      <strong>Expiration Date:</strong>{" "}
                      {donation.expirationDate
                        ? new Date(donation.expirationDate).toLocaleDateString()
                        : "Not set"}
                    </DonationDetail>
                    <DonationDetail>
                      <strong>Category:</strong> {donation.category || "Not specified"}
                    </DonationDetail>
                    <DonationDetail>
                      <strong>Status:</strong> {donation.status || "pending"}
                    </DonationDetail>
                    {donation.category === "prepared_meals" && (
                      <DonationDetail>
                        <strong>Total Meals Donated:</strong>{" "}
                        {donation.numberOfMeals || "N/A"}
                      </DonationDetail>
                    )}
                  </DonationDetails>
                  <ProductSection>
                    <ProductsTitle>
                      {donation.category === "prepared_meals" ? "Meals:" : "Products:"}
                    </ProductsTitle>
                    <ProductList>
                      {donation.category === "prepared_meals" ? (
                        donation.meals && donation.meals.length > 0 ? (
                          donation.meals.map((item, itemIndex) => (
                            <ProductItem key={item._id || itemIndex}>
                              <ProductDetails>
                                <span>
                                  <strong>Name:</strong> {item.meal?.mealName || "N/A"}
                                </span>
                                <span>
                                  <strong>Type:</strong> {item.meal?.mealType || "N/A"}
                                </span>
                              </ProductDetails>
                              <ProductQuantity>
                                <strong>Quantity Given:</strong> {item.quantity || 0}
                              </ProductQuantity>
                            </ProductItem>
                          ))
                        ) : (
                          <ProductItem>No meals available</ProductItem>
                        )
                      ) : (
                        donation.products && donation.products.length > 0 ? (
                          donation.products.map((item, itemIndex) => (
                            <ProductItem key={item._id || itemIndex}>
                              <ProductDetails>
                                <span>
                                  <strong>Name:</strong> {item.product?.name || "N/A"}
                                </span>
                                <span>
                                  <strong>Type:</strong>{" "}
                                  {item.product?.productType || "N/A"}
                                </span>
                                <span>
                                  <strong>Weight:</strong>{" "}
                                  {item.product?.weightPerUnit
                                    ? `${item.product.weightPerUnit} ${item.product.weightUnit || ""}`
                                    : "N/A"}
                                </span>
                              </ProductDetails>
                              <ProductQuantity>
                                <strong>Quantity Given:</strong> {item.quantity || 0}
                              </ProductQuantity>
                            </ProductItem>
                          ))
                        ) : (
                          <ProductItem>No products available</ProductItem>
                        )
                      )}
                    </ProductList>
                  </ProductSection>
                  
                </DonationCard>
              );
            })
          ) : (
            <p>No donations match the current filters</p>
          )}

          {currentRejectionId && (
            <RejectionModal>
              <ModalContent>
                <h3>Reason for Rejection</h3>
                <p>Please explain why you're rejecting this donation:</p>
                <ModalTextarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (required)..."
                />
                <ModalButtons>
                  <Button
                    variant="cancel"
                    onClick={() => setCurrentRejectionId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="submit"
                    onClick={() => handleRejectDonation(currentRejectionId)}
                    disabled={!rejectionReason || processing[currentRejectionId]}
                  >
                    {processing[currentRejectionId] === "rejecting"
                      ? "Submitting..."
                      : "Submit Rejection"}
                  </Button>
                </ModalButtons>
              </ModalContent>
            </RejectionModal>
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