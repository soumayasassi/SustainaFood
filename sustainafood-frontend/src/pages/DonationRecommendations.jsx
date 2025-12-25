"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { getDonationsByUserId } from "../api/donationService";
import axios from "axios";
import styled, { createGlobalStyle } from "styled-components";
import { FaSearch, FaFilter } from "react-icons/fa";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000"; // Ensure this matches your backend port

// Global styles for the page
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background: #f0f8f0;
    box-sizing: border-box;
  }
`;

const Container = styled.div`
  padding: 40px 60px;
  text-align: center;
`;

const Title = styled.h1`
  color: #228b22;
  font-size: 40px;
  margin-bottom: 20px;
`;

const TopControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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
  margin-right: 39%;
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

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
`;

const FilterIcon = styled(FaFilter)`
  margin-right: 8px;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border-radius: 25px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: 0.3s;
  cursor: pointer;
  background: white;
  color: #333;
  font-weight: bold;

  &:hover {
    border-color: #228b22;
    transform: scale(1.05);
  }
`;

const DonationSection = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const DonationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th, td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #228b22;
    color: white;
  }
`;

const RecommendationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th, td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #228b22;
    color: white;
  }
`;

const Warning = styled.p`
  color: red;
  font-weight: bold;
`;

const LoadingMessage = styled.div`
  font-size: 18px;
  color: #555;
`;

const NoDonations = styled.p`
  font-size: 18px;
  color: #888;
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

const AddDonationButton = styled(Link)`
  text-decoration: none;
  background: #228b22;
  color: white;
  transition: background 0.3s;
  font-size: 18px;
  font-weight: bold;
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;

  &:hover {
    background: #1e7a1e;
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: ${(props) => (props.disabled ? "#ccc" : "#228b22")};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background 0.3s;

  &:hover:not(:disabled) {
    background: #56ab2f;
  }
`;

const AssignedNote = styled.span`
  color: #888;
  font-style: italic;
`;

const DonationRecommendations = () => {
    const { user: authUser } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFilteredDonations] = useState([]);
    const [recommendations, setRecommendations] = useState({});
    const [loading, setLoading] = useState(true);
    const [assignedRequests, setAssignedRequests] = useState({}); // Track assigned requests per donation

    // Search, Filter, and Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [expirationFilter, setExpirationFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const donationsPerPage = 3;
 // Set the page title dynamically
 useEffect(() => {
    document.title = "SustainaFood - Donation Recommendations";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!authUser || (!authUser.id && !authUser._id)) {
                showAlert("error", "Please log in to view your donations.");
                navigate("/login");
                return;
            }

            try {
                setLoading(true);
                const userId = authUser._id || authUser.id;
                if (!userId) {
                    throw new Error("User ID not found");
                }

                console.log("Fetching data for userId:", userId);
                const donationsResponse = await getDonationsByUserId(userId);
                const fetchedDonations = donationsResponse.data || [];
                setDonations(fetchedDonations);
                setFilteredDonations(fetchedDonations);

                const recs = {};
                const assigned = {};
                for (const donation of fetchedDonations) {
                    console.log(`Fetching recommendations for donation: ${donation._id}`);
                    try {
                        const response = await axios.get(`${API_BASE_URL}/donation/donation/${donation._id}/recommendations`);
                        recs[donation._id] = response.data;

                        // Initialize assigned requests for this donation
                        assigned[donation._id] = new Set(donation.linkedRequests || []);
                    } catch (error) {
                        console.error(`Error fetching recommendations for donation ${donation._id}:`, error.message);
                        recs[donation._id] = [];
                        assigned[donation._id] = new Set();
                    }
                }
                setRecommendations(recs);
                setAssignedRequests(assigned);
            } catch (error) {
                console.error("Error fetching data:", error.message);
                showAlert("error", "Failed to load your donations and recommendations: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authUser, navigate, showAlert]);

    // Handle Search and Filters
    useEffect(() => {
        let filtered = donations;

        // Search by donation title
        if (searchTerm) {
            filtered = filtered.filter((donation) =>
                donation.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (categoryFilter) {
            filtered = filtered.filter((donation) => donation.category === categoryFilter);
        }

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter((donation) => donation.status === statusFilter);
        }

        // Filter by expiration date
        if (expirationFilter) {
            const now = new Date();
            if (expirationFilter === "expiring-soon") {
                filtered = filtered.filter(
                    (donation) =>
                        new Date(donation.expirationDate) < new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
                );
            } else if (expirationFilter === "valid") {
                filtered = filtered.filter(
                    (donation) =>
                        new Date(donation.expirationDate) >= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
                );
            }
        }

        setFilteredDonations(filtered);
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, statusFilter, expirationFilter, donations]);

    // Pagination Logic
    const indexOfLastDonation = currentPage * donationsPerPage;
    const indexOfFirstDonation = indexOfLastDonation - donationsPerPage;
    const currentDonations = filteredDonations.slice(indexOfFirstDonation, indexOfLastDonation);
    const totalPages = Math.ceil(filteredDonations.length / donationsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleAcceptRecommendation = async (donationId, requestId, fulfilledItems) => {
        try {
            const donation = donations.find((d) => d._id === donationId);
            if (!donation) {
                throw new Error("Donation not found");
            }

            // Prepare the request body for the UpdateAddDonationToRequest endpoint
            const requestBody = {
                donationId: donationId,
                donor: authUser._id || authUser.id, // The logged-in user is the donor
                expirationDate: donation.expirationDate,
                fulfilledItems: fulfilledItems, // Pass fulfilled items for status calculation
            };

            if (donation.category === "packaged_products") {
                // Map fulfilledItems to the format expected by UpdateAddDonationToRequest
                requestBody.products = fulfilledItems.map((item) => ({
                    product: item.product, // Assuming fulfilledItems contains product IDs
                    quantity: item.quantity,
                }));
            } else if (donation.category === "prepared_meals") {
                // Map fulfilledItems to the format expected by UpdateAddDonationToRequest
                requestBody.meals = donation.meals.map((meal) => ({
                    mealName: meal.meal?.mealName || "Unknown Meal",
                    mealDescription: meal.meal?.mealDescription || "No description",
                    mealType: meal.meal?.mealType || "Unknown Type",
                    quantity: meal.quantity,
                }));
                requestBody.numberOfMeals = fulfilledItems.reduce((total, item) => total + item.quantity, 0);
            }

            // Call the UpdateAddDonationToRequest endpoint
            const response = await axios.put(
                `${API_BASE_URL}/request/UpdateAddDonationToRequest/${requestId}/donations`,
                requestBody
            );

            // Update the assignedRequests state to mark this request as assigned for the donation
            setAssignedRequests((prev) => {
                const updated = { ...prev };
                if (!updated[donationId]) {
                    updated[donationId] = new Set();
                }
                updated[donationId].add(requestId);
                return updated;
            });

            showAlert("success", "Donation assigned to request successfully!");

            // Refresh donations to reflect the updated donation
            const donationsResponse = await getDonationsByUserId(authUser._id || authUser.id);
            setDonations(donationsResponse.data || []);

            // Refresh recommendations for the current donation
            const recResponse = await axios.get(`${API_BASE_URL}/donation/donation/${donationId}/recommendations`);
            setRecommendations((prev) => ({ ...prev, [donationId]: recResponse.data }));
        } catch (error) {
            console.error("Error assigning donation:", error.message);
            showAlert("error", "Failed to assign donation to request: " + error.message);
        }
    };

    return (
        <>
            <GlobalStyle />
            <Navbar />
            <Container>
                <Title>Donation Matching Recommendations</Title>

                {/* Search Bar and Add Donation Button */}
                <TopControls>
                    <AddDonationButton to="/AddDonation">
                        ✚ Add New Donation
                    </AddDonationButton>
                    <SearchContainer>
                        <SearchIcon />
                        <SearchInput
                            type="text"
                            placeholder="Search donations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </SearchContainer>
                </TopControls>

                {/* Filters */}
                <Controls>
                    <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">📦 All Categories</option>
                        <option value="packaged_products">🛒 Packaged Products</option>
                        <option value="prepared_meals">🍽️ Prepared Meals</option>
                    </Select>

                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">🟢 All Statuses</option>
                        <option value="pending">🕒 Pending</option>
                        <option value="partially_fulfilled">🔄 Partially Fulfilled</option>
                        <option value="fulfilled">✅ Fulfilled</option>
                    </Select>

                    <Select value={expirationFilter} onChange={(e) => setExpirationFilter(e.target.value)}>
                        <option value="">📅 All Expiration Dates</option>
                        <option value="expiring-soon">⏳ Expiring Soon (within 3 days)</option>
                        <option value="valid">✅ Valid (more than 3 days)</option>
                    </Select>
                </Controls>

                {/* Donations List */}
                {loading ? (
                    <LoadingMessage>Loading...</LoadingMessage>
                ) : currentDonations.length > 0 ? (
                    <>
                        {currentDonations.map((donation) => (
                            <DonationSection key={donation._id}>
                                <h2>Donation Title: {donation.title}</h2>
                                <p>
                                    Category:{" "}
                                    {donation.category === "packaged_products"
                                        ? "Packaged Products"
                                        : "Prepared Meals"}
                                </p>
                                <p>Status: {donation.status}</p>
                                <p>
                                    Expiration Date: {new Date(donation.expirationDate).toLocaleDateString()}
                                </p>
                                {donation.expirationDate &&
                                    new Date(donation.expirationDate) <
                                        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                                        <Warning>Expiring Soon!</Warning>
                                    )}
                                <h3>Items:</h3>
                                <DonationTable>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Quantity</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donation.category === "packaged_products" ? (
                                            donation.products?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.product?.name || "N/A"}</td>
                                                    <td>{item.product?.productDescription || "N/A"}</td>
                                                    <td>{item.quantity || "N/A"}</td>
                                                    <td>{item.product?.productType || "N/A"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            donation.meals?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.meal?.mealName || "N/A"}</td>
                                                    <td>{item.meal?.mealDescription || "N/A"}</td>
                                                    <td>{item.quantity || "N/A"}</td>
                                                    <td>{item.meal?.mealType || "N/A"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </DonationTable>

                                <h3>Recommended Requests:</h3>
                                {recommendations[donation._id]?.length > 0 ? (
                                    <RecommendationTable>
                                        <thead>
                                            <tr>
                                                <th>Recipient Name</th>
                                                <th>Recipient Type</th>
                                                <th>Request Title</th>
                                                <th>Meals Fulfilled</th>
                                                <th>Match Score</th>
                                                <th>Action</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recommendations[donation._id].map(
                                                ({ request, fulfilledItems, matchScore }) => {
                                                    const isAssigned = assignedRequests[donation._id]?.has(request._id);
                                                    return (
                                                        <tr key={request._id}>
                                                            <td>{request.recipient?.name || "N/A"}</td>
                                                            <td>{request.recipient?.type || "N/A"}</td>
                                                            <td>{request.title || "N/A"}</td>
                                                            <td>
                                                                {fulfilledItems.reduce(
                                                                    (total, item) => total + item.quantity,
                                                                    0
                                                                )}{" "}
                                                                / {request.numberOfMeals || 0}
                                                            </td>
                                                            <td>{matchScore || "N/A"}</td>
                                                            <td>
                                                                <ActionButton
                                                                    onClick={() =>
                                                                        handleAcceptRecommendation(
                                                                            donation._id,
                                                                            request._id,
                                                                            fulfilledItems
                                                                        )
                                                                    }
                                                                    disabled={donation.status !== "pending" || isAssigned}
                                                                >
                                                                    {donation.status === "pending" && !isAssigned
                                                                        ? "Assign"
                                                                        : "Assigned"}
                                                                </ActionButton>
                                                            </td>
                                                            <td>
                                                                {isAssigned && (
                                                                    <AssignedNote>Already Assigned</AssignedNote>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </RecommendationTable>
                                ) : (
                                    <p>No matching requests found for this donation.</p>
                                )}
                            </DonationSection>
                        ))}

                        {/* Pagination Controls */}
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
                    </>
                ) : (
                    <NoDonations>
                        No donations found. <Link to="/AddDonation">Add a donation now</Link> to get started!
                    </NoDonations>
                )}
            </Container>
            <Footer />
        </>
    );
};

export default DonationRecommendations;