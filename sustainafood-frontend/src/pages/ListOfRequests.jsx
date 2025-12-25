"use client"

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import donation1 from '../assets/images/home1.png';
import donation2 from '../assets/images/home2.png';
import donation3 from '../assets/images/home3.png';
import Composantrequest from "../components/Composantrequest";
import { getrequests } from "../api/requestNeedsService";
import patternBg from '../assets/images/bg.png';
import { FaSearch, FaFilter } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { getUserById } from "../api/userService";

// Global styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background: #f0f8f0;
    box-sizing: border-box;
    overflow-x: hidden;
  }
`;

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;
const fadeSlide = keyframes`
  0% { opacity: 0; transform: scale(1.05); }
  8% { opacity: 1; transform: scale(1); }
  33% { opacity: 1; transform: scale(1); }
  41% { opacity: 0; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.05); }
`;
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;
const skeletonLoading = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// Main container
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
  & > section {
    opacity: 0;
    animation: ${fadeIn} 0.8s ease-out forwards;
  }
  & > section:nth-child(2) {
    animation-delay: 0.2s;
  }
`;

// Hero section
const HeroSection = styled.section`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 80px 80px 120px;
  gap: 40px;
  background: linear-gradient(135deg, rgba(230, 242, 230, 0.9), rgba(220, 240, 220, 0.85)), url(${patternBg}) repeat center center;
  background-size: 200px 200px;
  overflow: hidden;
  &::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; border-radius: 50%; background: rgba(34, 139, 34, 0.1); z-index: 1; }
  &::after { content: ''; position: absolute; bottom: -30px; left: 15%; width: 120px; height: 120px; border-radius: 50%; background: rgba(34, 139, 34, 0.08); z-index: 1; }
`;

// Hero text
const HeroText = styled.div`
  flex: 1 1 500px;
  z-index: 2;
  h1 { font-size: 52px; font-weight: 800; color: #1a7a1a; margin-bottom: 20px; position: relative; &::after { content: ''; position: absolute; bottom: -10px; left: 0; width: 80px; height: 4px; background: linear-gradient(90deg, #228b22, #56ab2f); border-radius: 2px; } }
  p { font-size: 20px; color: #3a5a3a; margin-bottom: 35px; line-height: 1.6; max-width: 90%; }
`;

// Call to action button
const CallToAction = styled.a`
  display: inline-block;
  padding: 16px 36px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #228b22, #56ab2f);
  color: white;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(34, 139, 34, 0.2);
  position: relative;
  overflow: hidden;
  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(34, 139, 34, 0.3); }
  &::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%); transform: rotate(30deg); animation: ${shimmer} 3s infinite; pointer-events: none; }
`;

// Slider container
const SliderContainer = styled.div`
  position: relative;
  flex: 1 1 500px;
  width: 100%;
  height: 420px;
  overflow: hidden;
  z-index: 2;
  transform-style: preserve-3d;
  perspective: 1000px;
  animation: ${float} 6s ease-in-out infinite;
`;
const SlideImage = styled.img`
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 20px; opacity: 0; animation: ${fadeSlide} 12s infinite; animation-fill-mode: forwards; filter: brightness(1.05) contrast(1.05);
`;
const Slide1 = styled(SlideImage)`animation-delay: 0s;`;
const Slide2 = styled(SlideImage)`animation-delay: 4s;`;
const Slide3 = styled(SlideImage)`animation-delay: 8s;`;

// Wave shape
const Wave = styled.svg`
  position: absolute; bottom: 0; left: 0; width: 100%; height: auto; z-index: 1; filter: drop-shadow(0 -5px 5px rgba(0, 0, 0, 0.03));
`;

// Section wrapper
const SectionWrapper = styled.section`
  padding: 80px;
  background: #fff;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::before { content: ''; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; border-radius: 50%; background: rgba(34, 139, 34, 0.05); z-index: 0; }
  &::after { content: ''; position: absolute; bottom: -80px; left: -80px; width: 250px; height: 250px; border-radius: 50%; background: rgba(34, 139, 34, 0.05); z-index: 0; }
`;

// Container
const Container = styled.div`
  padding: 0;
  text-align: center;
  position: relative;
  z-index: 1;
`;

// Title
const Title = styled.h2`
  font-size: 40px;
  font-weight: 700;
  color: #1a7a1a;
  margin-bottom: 50px;
  position: relative;
  display: inline-block;
  z-index: 1;
  &::after { content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 80px; height: 4px; background: linear-gradient(90deg, #228b22, #56ab2f); border-radius: 2px; }
`;

// Search container
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 12px 20px;
  border-radius: 30px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  width: 320px;
  margin: 0 auto 40px;
  transition: all 0.3s ease;
  z-index: 2;
  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); }
`;

// Search icon
const SearchIcon = styled(FaSearch)`color: #3a5a3a; margin-right: 10px;`;

// Search input
const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 16px;
  width: 100%;
  background: transparent;
  color: #3a5a3a;
`;

// Controls
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  z-index: 2;
  @media (max-width: 768px) { flex-direction: column; align-items: center; }
`;

// Filter icon
const FilterIcon = styled(FaFilter)`margin-right: 8px; color: #3a5a3a;`;

// Select
const Select = styled.select`
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 30px;
  border: none;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
  color: #3a5a3a;
  font-weight: 600;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233a5a3a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 40px;
  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(34, 139, 34, 0.2); }
  @media (max-width: 768px) { width: 100%; max-width: 320px; }
`;

// Content list
const ContentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  z-index: 2;
  & > * { flex: 0 0 calc(33.333% - 20px); max-width: calc(33.333% - 20px); box-sizing: border-box; }
`;

// Skeleton loading components
const SkeletonCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  padding: 20px;
  height: 350px;
  display: flex;
  flex-direction: column;
`;
const SkeletonImage = styled.div`
  width: 100%;
  height: 180px;
  margin-bottom: 15px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${skeletonLoading} 1.5s infinite;
`;
const SkeletonTitle = styled.div`
  height: 30px;
  width: 70%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${skeletonLoading} 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 10px;
`;
const SkeletonText = styled.div`
  height: 15px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${skeletonLoading} 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 10px;
`;
const SkeletonButton = styled.div`
  height: 40px;
  width: 100%;
  margin-top: 15px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${skeletonLoading} 1.5s infinite;
  border-radius: 8px;
`;

// Empty state
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin: 40px auto;
  max-width: 600px;
  h3 { font-size: 24px; color: #1a7a1a; margin-bottom: 20px; }
  p { font-size: 16px; color: #3a5a3a; margin-bottom: 30px; }
`;

// Pagination controls
const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  gap: 15px;
  z-index: 2;
  button {
    padding: 12px 24px;
    font-size: 16px;
    background: linear-gradient(135deg, #228b22, #56ab2f);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 15px rgba(34, 139, 34, 0.2);
    &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(34, 139, 34, 0.3); }
    &:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; transform: none; }
  }
  span { font-size: 16px; color: #3a5a3a; font-weight: 500; }
`;

const ListOfRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const { user: authUser, token, logout } = useAuth();

  const [user, setUser] = useState(authUser);
   // Set the page title dynamically
   useEffect(() => {
    document.title = "SustainaFood -  List Of Requests";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof authUser.id === "number") {
        if (!authUser || !authUser._id) return;
        try {
          const response = await getUserById(authUser._id);
          setUser(response.data);
        } catch (error) {
          console.error("Backend Error:", error);
        }
      }
      else if (typeof authUser.id === "string") {
        if (!authUser || !authUser.id) return;
        try {
          const response = await getUserById(authUser.id);
          setUser(response.data);
        } catch (error) {
          console.error("Backend Error:", error);
        }
      }
    };

    if (authUser && (authUser._id || authUser.id)) {
      fetchUser();
    }
  }, [authUser]);

  const isDonner = user?.role === "restaurant" || user?.role === "supermarket";
  const isRecipient = user?.role === "ong" || user?.role === "student";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getrequests();
        setRequests(response.data);
        setFilteredRequests(response.data);
        setLoading(false);
        console.log("Requests fetched:", response.data);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    let updatedRequests = [...requests];

    if (searchQuery) {
      updatedRequests = updatedRequests.filter((request) =>
        request.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      updatedRequests = updatedRequests.filter((request) => request.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      updatedRequests = updatedRequests.filter((request) => request.category === categoryFilter);
    }

    updatedRequests.sort((a, b) => {
      if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortOption === "status") {
        return a.status.localeCompare(b.status);
      } else {
        return new Date(a.expirationDate) - new Date(b.expirationDate);
      }
    });

    setFilteredRequests(updatedRequests);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchQuery, sortOption, statusFilter, categoryFilter, requests]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <>
      <GlobalStyle />
      <Navbar />
      <HomeContainer>
        <HeroSection>
          <HeroText>
            <h1>List Of Requests in SustainaFood</h1>
            <p>
              Give if you can, receive if you need—together, we reduce food waste and spread hope!
            </p>
            {isRecipient && <CallToAction href="/AddDonation">Add Your Request</CallToAction>}
          </HeroText>
          <SliderContainer>
            <Slide1 src={donation2} alt="Request 1" />
            <Slide2 src={donation3} alt="Request 2" />
            <Slide3 src={donation1} alt="Request 3" />
          </SliderContainer>
          <Wave viewBox="0 0 1440 320">
            <path
              fill="#f0f8f0"
              fillOpacity="1"
              d="M0,96L30,90C60,85,120,75,180,64C240,53,300,43,360,64C420,85,480,139,540,170.7C600,203,660,213,720,224C780,235,840,245,900,240C960,235,1020,213,1080,181.3C1140,149,1200,107,1260,112C1320,117,1380,171,1410,197.3L1440,224L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"
            />
          </Wave>
        </HeroSection>
        <SectionWrapper>
          <Container>
            <Title>List Of Requests</Title>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>
            <Controls>
              <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="date">📆 Sort by Expiration Date</option>
                <option value="title">🔠 Sort by Title</option>
                <option value="status">🔄 Sort by Status</option>
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">🟢 All Statuses</option>
                <option value="pending">🕒 Pending</option>
                <option value="fulfilled">✅ Fulfilled</option>
                <option value="partially_fulfilled">❌ Partially fulfilled</option>
              </Select>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">📦 All Categories</option>
                <option value="prepared_meals">🍽️ Prepared Meals</option>
                <option value="packaged_products">🛒 Packaged Products</option>
              </Select>
            </Controls>
            <ContentList>
              {loading ? (
                <>
                  <SkeletonCard>
                    <SkeletonImage />
                    <SkeletonTitle />
                    <SkeletonText />
                    <SkeletonText />
                    <SkeletonButton />
                  </SkeletonCard>
                  <SkeletonCard>
                    <SkeletonImage />
                    <SkeletonTitle />
                    <SkeletonText />
                    <SkeletonText />
                    <SkeletonButton />
                  </SkeletonCard>
                  <SkeletonCard>
                    <SkeletonImage />
                    <SkeletonTitle />
                    <SkeletonText />
                    <SkeletonText />
                    <SkeletonButton />
                  </SkeletonCard>
                </>
              ) : currentRequests.length > 0 ? (
                currentRequests.map((requestItem) => (
                  <Composantrequest key={requestItem._id} request={requestItem} />
                ))
              ) : (
                <EmptyState>
                  <h3>No Requests Found</h3>
                  <p>No matching requests found. Try adjusting your filters or check back later.</p>
                </EmptyState>
              )}
            </ContentList>
            <PaginationControls>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </button>
            </PaginationControls>
          </Container>
        </SectionWrapper>
      </HomeContainer>
      <Footer />
    </>
  );
};

export default ListOfRequests;