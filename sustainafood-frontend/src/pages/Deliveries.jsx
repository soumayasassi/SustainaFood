import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import donation1 from "../assets/images/home1.png";
import donation2 from "../assets/images/home2.png";
import donation3 from "../assets/images/home3.png";
import patternBg from '../assets/images/bg.png';
import { FaSearch, FaFilter } from "react-icons/fa";
import { getUserById } from "../api/userService";
import { getDeliveriesByDonorId, getDeliveriesByRecipientId, getDeliveriesByTransporter } from "../api/deliveryService";
import { createFeedback } from '../api/feedbackService';
import imgmouna from '../assets/images/imgmouna.png';
import StarRating from '../components/StarRating';

// Global styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background: #f0f8f0;
    box-sizing: border-box;
  }
`;

// Animations
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

// Layout components
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const HeroSection = styled.section`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 80px 80px 120px;
  gap: 40px;
  background: 
    linear-gradient(135deg, rgba(230, 242, 230, 0.9), rgba(220, 240, 220, 0.85)),
    url(${patternBg}) repeat center center;
  background-size: 200px 200px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(34, 139, 34, 0.1);
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: 15%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(34, 139, 34, 0.08);
    z-index: 1;
  }
`;

const HeroText = styled.div`
  flex: 1 1 500px;
  z-index: 2;

  h1 {
    font-size: 52px;
    font-weight: 800;
    color: #1a7a1a;
    margin-bottom: 20px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #228b22, #56ab2f);
      border-radius: 2px;
    }
  }

  p {
    font-size: 20px;
    color: #3a5a3a;
    margin-bottom: 35px;
    line-height: 1.6;
    max-width: 90%;
  }
`;

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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
  opacity: 0;
  animation: ${fadeSlide} 12s infinite;
  animation-fill-mode: forwards;
  filter: brightness(1.05) contrast(1.05);
`;

const Slide1 = styled(SlideImage)`
  animation-delay: 0s;
`;
const Slide2 = styled(SlideImage)`
  animation-delay: 4s;
`;
const Slide3 = styled(SlideImage)`
  animation-delay: 8s;
`;

const Wave = styled.svg`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  z-index: 1;
  filter: drop-shadow(0 -5px 5px rgba(0, 0, 0, 0.03));
`;

const SectionWrapper = styled.section`
  padding: 60px 80px;
  text-align: left;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: -60px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: #ffffff;
    z-index: 0;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 30px;
    right: -50px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #ffffff;
    z-index: 0;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }
`;

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: left;
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
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
  margin: 0 auto 20px auto;
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
  text-align: left;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
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
  text-align: left;
  
  &:hover {
    border-color: #228b22;
    transform: scale(1.05);
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

// Animation keyframes
const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(34, 139, 34, 0.2); }
  50% { box-shadow: 0 0 20px rgba(34, 139, 34, 0.4); }
  100% { box-shadow: 0 0 5px rgba(34, 139, 34, 0.2); }
`;
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Content list (container for cards)
const ContentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  padding: 30px;
  background: linear-gradient(145deg, #f0f8f0, #e6f2e6);
  border-radius: 20px;
  margin: 20px 0;
  justify-content: center;
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 15px;
  }
`;

// Loading message
const LoadingMessage = styled.div`
  text-align: center;
  font-size: 20px;
  color: #228b22;
  padding: 50px;
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  font-weight: 500;
  letter-spacing: 0.5px;
`;

// No deliveries message (empty state)
const NoDeliveries = styled.div`
  text-align: center;
  padding: 80px 30px;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  margin: 40px auto;
  max-width: 700px;
  font-size: 20px;
  color: #3a5a3a;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  &::before {
    content: '🌱';
    position: absolute;
    top: -30px;
    right: -30px;
    font-size: 100px;
    opacity: 0.1;
    transform: rotate(20deg);
  }
`;

// Delivery card
const DeliveryCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.6s ease-out forwards;
  border: 1px solid rgba(34, 139, 34, 0.1);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  width: 100%;
  max-width: 1158px;
  flex-direction: row;
  gap: 30px;
  flex-wrap: wrap;
  align-items: flex-start;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #228b22, #56ab2f);
    border-radius: 20px 20px 0 0;
  }
  &:hover {
    transform: translateY(-8px);
    animation: ${glow} 2s infinite;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 20px;
    max-width: 100%;
  }
`;

// Profile info section (donor, transporter, recipient)
const ProfileInfo = styled.div`
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #e6f2e6, #f0f8f0);
  border-radius: 10px;
  border-left: 4px solid #56ab2f;
  transition: transform 0.3s ease, background 0.3s ease;
  &:hover {
    transform: translateX(5px);
    background: linear-gradient(135deg, #f0f8f0, #e6f2e6);
  }
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    min-width: 100%;
  }
`;

// Profile image
const ProfileImg = styled.img`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #228b22;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(34, 139, 34, 0.3);
  }
`;

// Profile text
const ProfileText = styled.p`
  margin: 0;
  font-size: 15px;
  color: #2e4a2e;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.3s ease;
  &:hover {
    color: #228b22;
  }
  &::before {
    font-size: 14px;
  }
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

// Delivery details section
const DeliveryDetails = styled.div`
  flex: 2;
  min-width: 300px;
  padding: 15px;
  background: linear-gradient(145deg, #fafafa, #f5f5f5);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 15px;
  @media (max-width: 768px) {
    flex-direction: column;
    min-width: 100%;
  }
`;

// Delivery detail
const DeliveryDetail = styled.p`
  font-size: 14px;
  color: #3a5a3a;
  margin: 8px 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, background 0.3s ease;
  flex: 1;
  min-width: 200px;
  &:hover {
    transform: scale(1.02);
    background: #f0f8f0;
  }
  strong {
    color: #1a7a1a;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    &::before {
      content: '📌';
      font-size: 14px;
    }
  }
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

// Delivery status badge
const DeliveryStatus = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  &.pending {
    background: linear-gradient(90deg, #fff3cd, #ffeeba);
    color: #856404;
  }
  &.in_transit {
    background: linear-gradient(90deg, #cce5ff, #b8daff);
    color: #004085;
  }
  &.delivered {
    background: linear-gradient(90deg, #d4edda, #c3e6cb);
    color: #155724;
  }
  &.cancelled {
    background: linear-gradient(90deg, #f8d7da, #f5c6cb);
    color: #721c24;
  }
  &::before {
    content: '🚛';
    margin-right: 5px;
    font-size: 14px;
  }
`;

// Item section
const ItemSection = styled.div`
  flex: 1;
  min-width: 250px;
  padding: 15px;
  background: #f0f8f0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  @media (max-width: 768px) {
    min-width: 100%;
  }
  &::before {
    content: '🍴';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 30px;
    opacity: 0.1;
  }
`;

// Items title
const ItemsTitle = styled.h4`
  font-size: 17px;
  color: #228b22;
  margin: 0 0 15px;
  font-weight: 600;
  position: relative;
  display: inline-block;
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 50%;
    height: 2px;
    background: linear-gradient(90deg, #228b22, #56ab2f);
    border-radius: 2px;
  }
`;

// Item list
const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Item
const Item = styled.li`
  background: #ffffff;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, background 0.3s ease;
  border-left: 3px solid #56ab2f;
  &:hover {
    transform: translateX(5px);
    background: #e6f2e6;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

// Item details
const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  span {
    font-size: 15px;
    color: #3a5a3a;
    strong {
      color: #228b22;
      font-weight: 600;
    }
  }
`;

// Item quantity
const ItemQuantity = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #d9534f;
  padding: 5px 10px;
  border-radius: 15px;
  background: rgba(217, 83, 79, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  &::before {
    content: '📦';
    font-size: 14px;
  }
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

// Feedback buttons container
const FeedbackButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  width: 100%;
`;

// Feedback button
const FeedbackButton = styled.button`
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #228b22, #56ab2f);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(34, 139, 34, 0.2);
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(34, 139, 34, 0.3);
    background: linear-gradient(135deg, #56ab2f, #228b22);
  }
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    box-shadow: none;
  }
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
    transform: rotate(30deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 20px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #333;
`;

const FeedbackForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: bold;
`;

const FeedbackTextarea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  min-height: 80px;
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  background: #228b22;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;

  &:hover:not(:disabled) {
    background: #56ab2f;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const FeedbackMessage = styled.p`
  font-size: 14px;
  color: ${props => (props.error ? '#721c24' : '#155724')};
  margin: 5px 0;
`;

const Deliveries = () => {
  const [user, setUser] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const itemsPerPage = 3;

   // Set the page title dynamically
   useEffect(() => {
    document.title = "SustainaFood - Deliveries";
    return () => {
      document.title = "SustainaFood"; // Reset to default on unmount
    };
  }, []);

  const initializeFeedbackState = (deliveryId, targetRole) => ({
    rating: 0,
    comment: '',
    submitted: false,
    error: '',
    success: '',
  });

  const handleFeedbackChange = (deliveryId, targetRole, field, value) => {
    setFeedbackState(prev => ({
      ...prev,
      [deliveryId]: {
        ...prev[deliveryId],
        [targetRole]: {
          ...prev[deliveryId][targetRole],
          [field]: value,
        },
      },
    }));
  };

  const handleFeedbackSubmit = async (deliveryId, targetRole, recipientId) => {
    const feedback = feedbackState[deliveryId]?.[targetRole];
    if (!feedback) return;

    if (feedback.rating < 1 || feedback.rating > 5) {
      setFeedbackState(prev => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: 'Please select a rating between 1 and 5 stars',
            success: '',
          },
        },
      }));
      return;
    }

    if (!feedback.comment.trim()) {
      setFeedbackState(prev => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: 'Please enter a comment',
            success: '',
          },
        },
      }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await createFeedback(
        recipientId,
        feedback.rating,
        feedback.comment,
        user._id,
        token
      );
      setFeedbackState(prev => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            submitted: true,
            error: '',
            success: 'Feedback submitted successfully!',
          },
        },
      }));
    } catch (error) {
      setFeedbackState(prev => ({
        ...prev,
        [deliveryId]: {
          ...prev[deliveryId],
          [targetRole]: {
            ...prev[deliveryId][targetRole],
            error: error.message || 'Failed to submit feedback',
            success: '',
          },
        },
      }));
    }
  };

  const openFeedbackModal = (deliveryId, targetRole, targetId, targetName) => {
    setFeedbackModal({ deliveryId, targetRole, targetId, targetName });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal(null);
  };

  useEffect(() => {
    const fetchUserAndDeliveries = async () => {
      try {
        setLoading(true);
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        const userResponse = await getUserById(storedUser._id || storedUser.id, token);
        setUser(userResponse.data);

        let deliveryResponse;
        if (userResponse.data.role === 'transporter') {
          deliveryResponse = await getDeliveriesByTransporter(userResponse.data._id || userResponse.data.id, token);
        } else if (['restaurant', 'supermarket', 'personaldonor'].includes(userResponse.data.role)) {
          deliveryResponse = await getDeliveriesByDonorId(userResponse.data._id || userResponse.data.id, token);
        } else if (['student', 'ong'].includes(userResponse.data.role)) {
          deliveryResponse = await getDeliveriesByRecipientId(userResponse.data._id, token);
        } else {
          throw new Error('Role not supported for viewing deliveries');
        }

        const fetchedDeliveries = deliveryResponse.data.data || [];
        setDeliveries(fetchedDeliveries);
        setFilteredDeliveries(fetchedDeliveries);

        const initialFeedbackState = {};
        fetchedDeliveries.forEach(delivery => {
          if (delivery.status === 'delivered') {
            initialFeedbackState[delivery._id] = {};
            const isDonor = ['restaurant', 'supermarket', 'personaldonor'].includes(userResponse.data.role);
            const isRecipient = ['student', 'ong'].includes(userResponse.data.role);
            if (isDonor) {
              initialFeedbackState[delivery._id].recipient = initializeFeedbackState(delivery._id, 'recipient');
              initialFeedbackState[delivery._id].transporter = initializeFeedbackState(delivery._id, 'transporter');
            } else if (isRecipient) {
              initialFeedbackState[delivery._id].donor = initializeFeedbackState(delivery._id, 'donor');
              initialFeedbackState[delivery._id].transporter = initializeFeedbackState(delivery._id, 'transporter');
            }
          }
        });
        setFeedbackState(initialFeedbackState);
      } catch (error) {
        console.error('Error fetching data:', error);
        setDeliveries([]);
        setFilteredDeliveries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDeliveries();
  }, []);

  useEffect(() => {
    let updatedDeliveries = [...deliveries];

    if (searchQuery) {
      updatedDeliveries = updatedDeliveries.filter((delivery) => {
        const donationTitle = delivery.donationTransaction?.donation?.title || '';
        const pickupAddress = delivery.pickupAddress || '';
        const deliveryAddress = delivery.deliveryAddress || '';
        const transporterName = delivery.transporter?.name || '';
        const donorName = delivery.donationTransaction?.donation?.donor?.name || '';
        const recipientName = delivery.donationTransaction?.requestNeed?.recipient?.name || '';
        return (
          donationTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipientName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      updatedDeliveries = updatedDeliveries.filter(
        (delivery) => delivery.status === statusFilter
      );
    }

    updatedDeliveries.sort((a, b) => {
      if (sortOption === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOption === 'title') {
        const titleA = a.donationTransaction?.donation?.title || '';
        const titleB = b.donationTransaction?.donation?.title || '';
        return titleA.localeCompare(titleB);
      } else if (sortOption === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    setFilteredDeliveries(updatedDeliveries);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOption, deliveries]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  return (
    <>
      <GlobalStyle />
      <Navbar />
      <HomeContainer>
        <HeroSection>
          <HeroText>
            <h1>Empowering Communities with Every Meal</h1>
            <p>
              Join SustainaFood to donate, deliver, or receive surplus food—together, we reduce waste and spread hope!
            </p>
          </HeroText>
          <SliderContainer>
            <Slide1 src={donation2} alt="Donation 1" />
            <Slide2 src={donation3} alt="Donation 2" />
            <Slide3 src={donation1} alt="Donation 3" />
          </SliderContainer>
          <Wave viewBox="0 0 1440 320">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,96L30,90C60,85,120,75,180,64C240,53,300,43,360,64C420,85,480,139,540,170.7C600,203,660,213,720,224C780,235,840,245,900,240C960,235,1020,213,1080,181.3C1140,149,1200,107,1260,112C1320,117,1380,171,1410,197.3L1440,224L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"
            />
          </Wave>
        </HeroSection>

        <SectionWrapper>
          <Container>
            <Title>List of your Deliveries</Title>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search deliveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>
            <Controls>
              <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="date">📆 Sort by Date</option>
                <option value="title">🔠 Sort by Donation Title</option>
                <option value="status">🔄 Sort by Status</option>
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">🟢 All Statuses</option>
                <option value="pending">🕒 Pending</option>
                <option value="accepted">✅ Accepted</option>
                <option value="picked_up">📍 Picked Up</option>
                <option value="in_progress">🚚 In Progress</option>
                <option value="delivered">📦 Delivered</option>
                <option value="failed">❌ Failed</option>
              </Select>
            </Controls>
            
            <ContentList>
              {loading ? (
                <LoadingMessage>Loading...</LoadingMessage>
              ) : currentDeliveries.length > 0 ? (
                currentDeliveries.map((delivery) => {
                  const transporterPhoto = delivery.transporter?.photo
                    ? `http://localhost:3000/${delivery.transporter.photo}`
                    : imgmouna;
                    
                  const isDonor = ['restaurant', 'supermarket', 'personaldonor'].includes(user?.role);
                  const isRecipient = ['student', 'ong'].includes(user?.role);
                  const recipient = delivery.donationTransaction?.requestNeed?.recipient;
                  const donor = delivery.donationTransaction?.donation?.donor;
                  const donation = delivery.donationTransaction?.donation || {};
                  const allocatedProducts = delivery.donationTransaction?.allocatedProducts || [];
                  const allocatedMeals = delivery.donationTransaction?.allocatedMeals || [];

                  return (
                    <DeliveryCard key={delivery._id}>
                      {delivery.transporter ? (
                        <ProfileInfo>
                          <Link to={`/ViewProfile/${delivery.transporter?._id}`}>
                            <ProfileImg
                              src={transporterPhoto}
                              alt="Transporter Profile"
                              onError={(e) => {
                                e.target.src = imgmouna;
                                console.error(`Failed to load transporter image: ${transporterPhoto}`);
                              }}
                            />
                          </Link>
                          <Link to={`/ViewProfile/${delivery.transporter?._id}`}>
                            <ProfileText>
                              Transporter: {delivery.transporter?.name || 'Unknown Transporter'}
                            </ProfileText>
                          </Link>
                          <ProfileText>Email: {delivery.transporter?.email || 'Email Not Specified'}</ProfileText>
                          <ProfileText>Phone Number: {delivery.transporter?.phone || 'Phone Not Specified'}</ProfileText>
                        </ProfileInfo>
                      ) : (
                        <ProfileInfo>
                          <ProfileText>No transporter assigned</ProfileText>
                        </ProfileInfo>
                      )}

                      {isDonor && recipient && (
                        <ProfileInfo>
                          <Link to={`/ViewProfile/${recipient?._id}`}>
                            <ProfileText>
                              Recipient: {recipient?.name || 'Unknown Recipient'}
                            </ProfileText>
                          </Link>
                          <ProfileText>Email: {recipient?.email || 'Email Not Specified'}</ProfileText>
                        </ProfileInfo>
                      )}
                      {isRecipient && donor && (
                        <ProfileInfo>
                          <Link to={`/ViewProfile/${donor?._id}`}>
                            <ProfileText>
                              Donor: {donor?.name || 'Unknown Donor'}
                            </ProfileText>
                          </Link>
                          <ProfileText>Email: {donor?.email || 'Email Not Specified'}</ProfileText>
                        </ProfileInfo>
                      )}

                      <DeliveryDetails>
                        <DeliveryDetail>
                          <strong>Donation Title:</strong>{' '}
                          {donation.title || 'Untitled Delivery'}
                        </DeliveryDetail>
                        <DeliveryDetail>
                          <strong>Pickup Address:</strong> {delivery.pickupAddress || 'N/A'}
                        </DeliveryDetail>
                        <DeliveryDetail>
                          <strong>Delivery Address:</strong> {delivery.deliveryAddress || 'N/A'}
                        </DeliveryDetail>
                        <DeliveryDetail>
                          <strong>Status:</strong>{' '}
                          <DeliveryStatus className={delivery.status}>
                            {delivery.status ? delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace('_', ' ') : 'N/A'}
                          </DeliveryStatus>
                        </DeliveryDetail>
                        <DeliveryDetail>
                          <strong>Created:</strong>{' '}
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </DeliveryDetail>
                      </DeliveryDetails>

                      {allocatedProducts.length > 0 && (
                        <ItemSection>
                          <ItemsTitle>Allocated Products:</ItemsTitle>
                          <ItemList>
                            {allocatedProducts.map((item, index) => (
                              <Item key={index}>
                                <ItemDetails>
                                  <span><strong>Name:</strong> {item.product?.name || 'Unnamed Product'}</span>
                                </ItemDetails>
                                <ItemQuantity>
                                  {item.quantity || 0} item{item.quantity !== 1 ? 's' : ''}
                                </ItemQuantity>
                              </Item>
                            ))}
                          </ItemList>
                        </ItemSection>
                      )}

                      {allocatedMeals.length > 0 && (
                        <ItemSection>
                          <ItemsTitle>Allocated Meals:</ItemsTitle>
                          <ItemList>
                            {allocatedMeals.map((item, index) => (
                              <Item key={index}>
                                <ItemDetails>
                                  <span><strong>Name:</strong> {item.meal?.mealName || 'Unnamed Meal'}</span>
                                </ItemDetails>
                                <ItemQuantity>
                                  {item.quantity || 0} meal{item.quantity !== 1 ? 's' : ''}
                                </ItemQuantity>
                              </Item>
                            ))}
                          </ItemList>
                        </ItemSection>
                      )}

                      {allocatedProducts.length == 0 && allocatedMeals.length == 0 && (
                        <ItemSection>
                          <ItemsTitle>Items:</ItemsTitle>
                          <ItemList>
                            <Item>
                              <ItemDetails>
                                <span>No allocated products or meals</span>
                              </ItemDetails>
                            </Item>
                          </ItemList>
                        </ItemSection>
                      )}

                      {delivery.status === 'delivered' && (isDonor || isRecipient) && (
                        <FeedbackButtons>
                          {(isDonor || isRecipient) && delivery.transporter && (
                            <FeedbackButton
                              onClick={() => openFeedbackModal(
                                delivery._id,
                                'transporter',
                                delivery.transporter._id,
                                delivery.transporter.name || 'Unknown Transporter'
                              )}
                              disabled={feedbackState[delivery._id]?.transporter?.submitted}
                            >
                              {feedbackState[delivery._id]?.transporter?.submitted
                                ? 'Feedback for Transporter Submitted'
                                : 'Add Feedback for Transporter'}
                            </FeedbackButton>
                          )}
                          {isDonor && recipient && (
                            <FeedbackButton
                              onClick={() => openFeedbackModal(
                                delivery._id,
                                'recipient',
                                recipient._id,
                                recipient.name || 'Unknown Recipient'
                              )}
                              disabled={feedbackState[delivery._id]?.recipient?.submitted}
                            >
                              {feedbackState[delivery._id]?.recipient?.submitted
                                ? 'Feedback for Recipient Submitted'
                                : 'Add Feedback for Recipient'}
                            </FeedbackButton>
                          )}
                          {isRecipient && donor && (
                            <FeedbackButton
                              onClick={() => openFeedbackModal(
                                delivery._id,
                                'donor',
                                donor._id,
                                donor.name || 'Unknown Donor'
                              )}
                              disabled={feedbackState[delivery._id]?.donor?.submitted}
                            >
                              {feedbackState[delivery._id]?.donor?.submitted
                                ? 'Feedback for Donor Submitted'
                                : 'Add Feedback for Donor'}
                            </FeedbackButton>
                          )}
                        </FeedbackButtons>
                      )}
                    </DeliveryCard>
                  );
                })
              ) : (
                <NoDeliveries>No matching deliveries found.</NoDeliveries>
              )}
            </ContentList>
            {totalPages > 1 && (
              <PaginationControls>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </PaginationControls>
            )}
          </Container>
        </SectionWrapper>
      </HomeContainer>

      {feedbackModal && (
        <ModalOverlay>
          <ModalContent>
            <CloseButton onClick={closeFeedbackModal}>×</CloseButton>
            <FeedbackForm onSubmit={(e) => {
              e.preventDefault();
              handleFeedbackSubmit(
                feedbackModal.deliveryId,
                feedbackModal.targetRole,
                feedbackModal.targetId
              );
            }}>
              <FormGroup>
                <FormLabel>Feedback for {feedbackModal.targetRole.charAt(0).toUpperCase() + feedbackModal.targetRole.slice(1)} ({feedbackModal.targetName}):</FormLabel>
                <StarRating
                  rating={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.rating || 0}
                  setRating={(rating) => handleFeedbackChange(feedbackModal.deliveryId, feedbackModal.targetRole, 'rating', rating)}
                  interactive={!feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
                />
              </FormGroup>
              <FormGroup>
                <FeedbackTextarea
                  value={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.comment || ''}
                  onChange={(e) => handleFeedbackChange(feedbackModal.deliveryId, feedbackModal.targetRole, 'comment', e.target.value)}
                  placeholder={`Write your feedback for the ${feedbackModal.targetRole}...`}
                  disabled={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
                />
              </FormGroup>
              {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.error && (
                <FeedbackMessage error>{feedbackState[feedbackModal.deliveryId][feedbackModal.targetRole].error}</FeedbackMessage>
              )}
              {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.success && (
                <FeedbackMessage>{feedbackState[feedbackModal.deliveryId][feedbackModal.targetRole].success}</FeedbackMessage>
              )}
              <SubmitButton
                type="submit"
                disabled={feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted}
              >
                {feedbackState[feedbackModal.deliveryId]?.[feedbackModal.targetRole]?.submitted ? 'Feedback Submitted' : 'Submit Feedback'}
              </SubmitButton>
            </FeedbackForm>
          </ModalContent>
        </ModalOverlay>
      )}
      <Footer />
    </>
  );
};

export default Deliveries;