"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import styled from "styled-components"
import { getDonationTransactionById } from "../../api/donationTransactionService"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import imgmouna from "../../assets/images/imgmouna.png"

// Main layout components
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7f9;
`

const DashboardContent = styled.div`
  flex: 1;
  padding: 70px 20px 20px 20px;
`

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-top: 10px;
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
`

const TransactionDetailContainer = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`

const TransactionHeader = styled.div`
  background-color: #4caf50;
  color: white;
  padding: 20px 24px;
  position: relative;
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }
`

const TransactionContent = styled.div`
  padding: 24px;
`

// Section components
const Section = styled.div`
  margin-bottom: 28px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 18px;
    color: #333;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #eaeaea;
  }
  
  h4 {
    font-size: 16px;
    color: #444;
    margin: 16px 0 12px 0;
  }
`

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`

const ProfileImg = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4caf50;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
`

const ProfileName = styled.h3`
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
`

const ProfileRole = styled.p`
  margin: 4px 0 0 0;
  color: #666;
  font-size: 14px;
`

// Detail items
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`

const DetailItem = styled.div`
  background-color: #f9f9f9;
  padding: 12px 16px;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
  
  strong {
    display: block;
    color: #555;
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  span {
    color: #333;
    font-size: 16px;
    font-weight: 500;
  }
`

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background-color: ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "completed":
        return "#e6f7e6"
      case "pending":
        return "#fff8e6"
      case "rejected":
        return "#ffebee"
      default:
        return "#f0f0f0"
    }
  }};
  color: ${(props) => {
    switch (props.status?.toLowerCase()) {
      case "completed":
        return "#2e7d32"
      case "pending":
        return "#f57c00"
      case "rejected":
        return "#c62828"
      default:
        return "#666666"
    }
  }};
`

// Lists
const ItemsList = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
`

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eaeaea;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f0f0f0;
  }
`

const ItemName = styled.div`
  font-weight: 500;
  color: #333;
`

const ItemQuantity = styled.div`
  color: #4caf50;
  font-weight: 600;
`

// Buttons
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`

const BackButton = styled(Button)`
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  
  &:hover {
    background-color: #e0e0e0;
  }
`

const PrimaryButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  border: none;
  
  &:hover {
    background-color: #43a047;
  }
`

// Loading and error states
const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #666;
`

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 8px;
  padding: 20px;
`

const ViewDonationTransaction = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - View Donation Transaction";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true)
        const response = await getDonationTransactionById(transactionId)
        // Handle nested data structure if the API returns { data: transaction }
        const transactionData = response.data || response
        setTransaction(transactionData)
      } catch (err) {
        setError("Failed to fetch transaction details: " + (err.message || "Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionId])

  if (loading)
    return (
      <DashboardContainer>
        <Sidebar />
        <DashboardContent>
          <Navbar setSearchQuery={setSearchQuery} />
          <LoadingState>Loading transaction details...</LoadingState>
        </DashboardContent>
      </DashboardContainer>
    )

  if (error)
    return (
      <DashboardContainer>
        <Sidebar />
        <DashboardContent>
          <Navbar setSearchQuery={setSearchQuery} />
          <ErrorState>Error: {error}</ErrorState>
        </DashboardContent>
      </DashboardContainer>
    )

  if (!transaction)
    return (
      <DashboardContainer>
        <Sidebar />
        <DashboardContent>
          <Navbar setSearchQuery={setSearchQuery} />
          <ErrorState>Transaction not found</ErrorState>
        </DashboardContent>
      </DashboardContainer>
    )

  const defaultImage = imgmouna
  const donorPhoto = transaction.donor?.photo ? `http://localhost:3000/${transaction.donor.photo}` : defaultImage
  const recipientPhoto = transaction.recipient?.photo
    ? `http://localhost:3000/${transaction.recipient.photo}`
    : defaultImage

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardContainer>
      <Sidebar />
      <DashboardContent>
        <Navbar setSearchQuery={setSearchQuery} />

        <PageHeader>
          <h2>Transaction Details</h2>
        </PageHeader>

        <TransactionDetailContainer>
          <TransactionHeader>
            <h2>Donation Transaction #{transaction.id || "N/A"}</h2>
          </TransactionHeader>

          <TransactionContent>
            {/* Status and Dates Section */}
            <Section>
              <DetailGrid>
                <DetailItem>
                  <strong>Status</strong>
                  <StatusBadge status={transaction.status}>{transaction.status || "N/A"}</StatusBadge>
                </DetailItem>
                <DetailItem>
                  <strong>Created At</strong>
                  <span>{formatDate(transaction.createdAt)}</span>
                </DetailItem>
                <DetailItem>
                  <strong>Updated At</strong>
                  <span>{formatDate(transaction.updatedAt)}</span>
                </DetailItem>
                {transaction.rejectionReason && (
                  <DetailItem>
                    <strong>Rejection Reason</strong>
                    <span>{transaction.rejectionReason}</span>
                  </DetailItem>
                )}
              </DetailGrid>
            </Section>

            {/* Donor Information */}
            <Section>
              <h3>Donor Information</h3>
              <ProfileSection>
                <ProfileImg src={donorPhoto} alt="Donor" onError={(e) => (e.target.src = defaultImage)} />
                <ProfileInfo>
                  <ProfileName>{transaction.donor?.name || "Unknown Donor"}</ProfileName>
                  <ProfileRole>{transaction.donor?.role || "Role Not Specified"}</ProfileRole>
                </ProfileInfo>
              </ProfileSection>
            </Section>

            {/* Recipient Information */}
            <Section>
              <h3>Recipient Information</h3>
              <ProfileSection>
                <ProfileImg src={recipientPhoto} alt="Recipient" onError={(e) => (e.target.src = defaultImage)} />
                <ProfileInfo>
                  <ProfileName>{transaction.recipient?.name || "Unknown Recipient"}</ProfileName>
                  <ProfileRole>{transaction.recipient?.role || "Role Not Specified"}</ProfileRole>
                </ProfileInfo>
              </ProfileSection>
            </Section>

            {/* Transaction Details */}
            <Section>
              <h3>Transaction Details</h3>
              <DetailGrid>
                <DetailItem>
                  <strong>Request Need Title</strong>
                  <span>{transaction.requestNeed?.title || "N/A"}</span>
                </DetailItem>
                <DetailItem>
                  <strong>Donation Title</strong>
                  <span>{transaction.donation?.title || "N/A"}</span>
                </DetailItem>
              </DetailGrid>
            </Section>

            {/* Allocated Products */}
            <Section>
              <h3>Allocated Products</h3>
              {transaction.allocatedProducts && transaction.allocatedProducts.length > 0 ? (
                <ItemsList>
                  {transaction.allocatedProducts.map((product, index) => (
                    <ItemRow key={index}>
                      <ItemName>{product.product?.name || "N/A"}</ItemName>
                      <ItemQuantity>Qty: {product.quantity || 0}</ItemQuantity>
                    </ItemRow>
                  ))}
                </ItemsList>
              ) : (
                <p>No products allocated</p>
              )}
            </Section>

            {/* Allocated Meals */}
            <Section>
              <h3>Allocated Meals</h3>
              {transaction.allocatedMeals && transaction.allocatedMeals.length > 0 ? (
                <ItemsList>
                  {transaction.allocatedMeals.map((meal, index) => (
                    <ItemRow key={index}>
                      <ItemName>{meal.meal?.mealName || "N/A"}</ItemName>
                      <ItemQuantity>Qty: {meal.quantity || 0}</ItemQuantity>
                    </ItemRow>
                  ))}
                </ItemsList>
              ) : (
                <p>No meals allocated</p>
              )}
            </Section>

            <ButtonContainer>
              <BackButton onClick={() => navigate("/DonationTransList")}>Back to List</BackButton>
              <PrimaryButton onClick={() => window.print()}>Print Details</PrimaryButton>
            </ButtonContainer>
          </TransactionContent>
        </TransactionDetailContainer>
      </DashboardContent>
    </DashboardContainer>
  )
}

export default ViewDonationTransaction