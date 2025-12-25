"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import styled, { createGlobalStyle, keyframes, css } from "styled-components"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SpeechButton from "../components/SpeechButton"
import donation1 from "../assets/images/home1.png"
import donation2 from "../assets/images/home2.png"
import donation3 from "../assets/images/home3.png"
import { useAuth } from "../contexts/AuthContext"
import patternBg from "../assets/images/bg.png"

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background: #f0f8f0;
    box-sizing: border-box;
    overflow-x: hidden;
  }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const fadeSlide = keyframes`
  0% { opacity: 0; transform: scale(1.05); }
  8% { opacity: 1; transform: scale(1); }
  33% { opacity: 1; transform: scale(1); }
  41% { opacity: 0; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.05); }
`

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`

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
  
  & > section:nth-child(3) {
    animation-delay: 0.4s;
  }
  & > section:nth-child(4) {
    animation-delay: 0.6s;
  }
  & > section:nth-child(5) {
    animation-delay: 0.8s;
  }
`

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
`

const SponsorText = styled.p`
  margin-top: 25px;
  font-size: 18px;
  color: #2a4a2a;
  font-weight: 500;
  padding: 12px 24px;
  background: rgba(34, 139, 34, 0.05);
  border-radius: 30px;
  display: inline-block;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(34, 139, 34, 0.08);
    transform: translateY(-2px);
  }
`

const CarouselContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  background: linear-gradient(135deg, #ffffff, #f0f8f0);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(34, 139, 34, 0.1);
  animation: ${float} 6s ease-in-out infinite;
`

const TopTransporterBadge = styled.div`
  position: absolute;
  top: -12px;
  right: -12px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #3e2723;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 24px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '★';
    font-size: 16px;
    color: #fff;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
  }

  &::after {
    content: 'Top 1';
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 5px 12px;
    gap: 6px;

    &::before {
      font-size: 14px;
    }
  }
`

const TransporterImage = styled.img`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid #228b22;
  transition: transform 0.3s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.08);
  }
`

const TransporterInfo = styled.div`
  margin-top: 20px;
  font-size: 22px;
  color: #1a7a1a;
  font-weight: 700;
`

const ThankYouMessage = styled.p`
  margin-top: 15px;
  font-size: 16px;
  color: #3a5a3a;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(255, 255, 255, 0.7);
  padding: 15px;
  border-radius: 10px;
`

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
`

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
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(34, 139, 34, 0.3);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
    transform: rotate(30deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`

const SliderContainer = styled.div`
  position: relative;
  flex: 1 1 500px;
  width: 100%;
  height: 420px;
  overflow: hidden;
  z-index: 2;
  transform-style: preserve-3d;
  perspective: 1000px;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 3px;
    mask-composite: exclude;
    z-index: 3;
    pointer-events: none;
  }
`

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
`

const Slide1 = styled(SlideImage)`
  animation-delay: 0s;
`
const Slide2 = styled(SlideImage)`
  animation-delay: 4s;
`
const Slide3 = styled(SlideImage)`
  animation-delay: 8s;
`

const Wave = styled.svg`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  z-index: 1;
  filter: drop-shadow(0 -5px 5px rgba(0, 0, 0, 0.03));
`

const SectionWrapper = styled.section`
  padding: 80px;
  background: ${(props) => props.bgColor || "#fff"};
  text-align: ${(props) => props.align || "center"};
  position: relative;
  overflow: hidden;
  
  ${(props) =>
    props.bgColor &&
    css`
    &::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: rgba(34, 139, 34, 0.05);
      z-index: 0;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -80px;
      left: -80px;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: rgba(34, 139, 34, 0.05);
      z-index: 0;
    }
  `}
`

const SectionTitle = styled.h2`
  font-size: 40px;
  font-weight: 700;
  color: #1a7a1a;
  margin-bottom: 50px;
  position: relative;
  display: inline-block;
  z-index: 1;
   
  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, #228b22, #56ab2f);
    border-radius: 2px;
  }
  
  ${(props) =>
    props.align === "left" &&
    css`
    &::after {
      left: 0;
      transform: none;
    }
  `}
`

const FeaturesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  position: relative;
  z-index: 1;
`

const FeatureCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  padding: 30px;
  flex: 1 1 250px;
  max-width: 300px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(34, 139, 34, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 0;
    background: linear-gradient(to bottom, #228b22, #56ab2f);
    transition: height 0.3s ease;
  }
  
  &:hover::before {
    height: 100%;
  }
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: #1a7a1a;
    margin-bottom: 15px;
    transition: color 0.3s ease;
  }
  
  p {
    font-size: 16px;
    color: #3a5a3a;
    line-height: 1.6;
    transition: color 0.3s ease;
  }
`

const ProposedSolutionList = styled.ul`
  list-style: none;
  margin-left: 10px;
  font-size: 18px;
  color: #3a5a3a;
  position: relative;
  z-index: 1;
  
  li {
    margin-bottom: 20px;
    line-height: 1.6;
    position: relative;
    padding-left: 35px;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translateX(5px);
    }
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #228b22, #56ab2f);
      border-radius: 50%;
      opacity: 0.2;
    }
    
    &::after {
      content: '✓';
      position: absolute;
      left: 6px;
      top: 4px;
      color: #228b22;
      font-weight: bold;
    }
    
    strong {
      color: #1a7a1a;
      font-weight: 600;
    }
  }
`

const SummaryText = styled.p`
  font-size: 18px;
  color: #3a5a3a;
  margin-top: 30px;
  line-height: 1.7;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border-left: 4px solid #228b22;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
`

const TwoColumnSection = styled.section`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  padding: 60px 80px;
  justify-content: center;
  background: linear-gradient(to bottom, #fff, #f9fdf9);
  margin: 0 20px;
`

const ColumnSection = styled.div`
  flex: 1 1 500px;
  background: linear-gradient(to bottom, #fff, #f9fdf9);
  text-align: center;
  position: relative;
  z-index: 1;
  border-radius: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.03);
  padding: 40px;
  min-width: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    right: 20px;
    width: 80px;
    height: 100px;
    border-radius: 50%;
    background: rgba(34, 139, 34, 0.05);
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(34, 139, 34, 0.05);
    z-index: 0;
  }
`

const DonorSectionTitle = styled.h2`
  font-size: 40px;
  font-weight: 700;
  color: #228b22;
  margin-bottom: 30px;
  position: relative;
  display: inline-block;
  z-index: 1;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: #228b22;
    border-radius: 2px;
  }
`

const AdCarouselContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 16px;
  background-color: #fff8e1;
  animation: ${float} 6s ease-in-out infinite;
`

const AdCarouselTrack = styled.div`
  display: flex;
  transition: transform 0.5s ease-in-out;
  height: 450px;
`

const AdSlide = styled.div`
  min-width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: ${(props) => {
    if (props.rank === 0) return "#fff8e1"
    if (props.rank === 1) return "#f5f5f5"
    if (props.rank === 2) return "#fff0e6"
    return "transparent"
  }};
  border-radius: 16px;
`

const AdImageEnhanced = styled.img`
  width: 100%;
  height: 280px;
  object-fit: contain;
  border-radius: 12px;
`

const DonorInfo = styled.div`
  text-align: center;
  position: relative;
  z-index: 1;
  border-radius: 12px;
`

const DonorName = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${(props) => {
    if (props.rank === 0) return "#d4af37"
    if (props.rank === 1) return "#717171"
    if (props.rank === 2) return "#a05a2c"
    return "#333333"
  }};
  margin-bottom: 10px;
`

const DonorRank = styled.span`
  display: inline-block;
  padding: 6px 6px;
  background: ${(props) => {
    if (props.rank === 0) return "#ffd800"
    if (props.rank === 1) return "#c0c0c0"
    if (props.rank === 2) return "#cd7f32"
    return "#4caf50"
  }};
  color: ${(props) => (props.rank === 1 ? "#333" : "white")};
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
`

const TopDonorBadge = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  background: ${(props) => {
    if (props.rank === 0) return "#ffd700"
    if (props.rank === 1) return "#c0c0c0"
    if (props.rank === 2) return "#cd7f32"
    return "#ff9800"
  }};
  color: ${(props) => (props.rank === 1 ? "#333" : "white")};
  font-weight: bold;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    background-image: ${(props) => {
      if (props.rank === 0)
        return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 8.5L9.75 13.5L4.5 14.25L8.25 18L7.25 23.25L12 20.75L16.75 23.25L15.75 18L19.5 14.25L14.25 13.5L12 8.5Z'/%3E%3Cpath d='M12 1.5C12.5 1.5 13 1.75 13.25 2.25L14.5 4.75C14.75 5.25 15.25 5.5 15.75 5.5H18.5C19 5.5 19.5 5.75 19.75 6.25C20 6.75 20 7.25 19.75 7.75L17.75 10.5C17.5 11 17.5 11.5 17.75 12L19.75 14.75C20 15.25 20 15.75 19.75 16.25C19.5 16.75 19 17 18.5 17H15.75C15.25 17 14.75 17.25 14.5 17.75L13.25 20.25C13 20.75 12.5 21 12 21C11.5 21 11 20.75 10.75 20.25L9.5 17.75C9.25 17.25 8.75 17 8.25 17H5.5C5 17 4.5 16.75 4.25 16.25C4 15.75 4 15.25 4.25 14.75L6.25 12C6.5 11.5 6.5 11 6.25 10.5L4.25 7.75C4 7.25 4 6.75 4.25 6.25C4.5 5.75 5 5.5 5.5 5.5H8.25C8.75 5.5 9.25 5.25 9.5 4.75L10.75 2.25C11 1.75 11.5 1.5 12 1.5Z'/%3E%3C/svg%3E\")"
      if (props.rank === 1)
        return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333333'%3E%3Cpath d='M12 15L7.5 18L9 12.75L5 9L10.25 8.5L12 3.5L13.75 8.5L19 9L15 12.75L16.5 18L12 15Z'/%3E%3Cpath d='M20 2H4V4L10 6L12 12L14 6L20 4V2Z'/%3E%3C/svg%3E\")"
      return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 17L6 21L8 14L2 10L9.5 9.5L12 3L14.5 9.5L22 10L16 14L18 21L12 17Z'/%3E%3C/svg%3E\")"
    }};
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }
`

const CarouselControls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  pointer-events: none;
  z-index: 5;
`

const CarouselButton = styled.button`
  background: rgba(255, 255, 255, 0.8);
  color: #228b22;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  pointer-events: auto;

  &:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
  }
`

const CarouselDots = styled.div`
  position: absolute;
  bottom: 15px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 5;
  pointer-events: auto;
`

const CarouselDot = styled.button`
  width: ${(props) => (props.isActive ? "10px" : "8px")};
  height: ${(props) => (props.isActive ? "10px" : "8px")};
  border-radius: 50%;
  background: ${(props) => (props.isActive ? "#228b22" : "#cccccc")};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: ${(props) => (props.isActive ? "#228b22" : "#999999")};
  }
`

const ErrorMessage = styled.p`
  font-size: 18px;
  color: #d32f2f;
  margin-top: 20px;
  padding: 10px 20px;
  background: rgba(211, 47, 47, 0.05);
  border-radius: 8px;
`

const DonorPromoMessage = styled.div`
  margin-top: 10px;
  padding: 12px 15px;
  background: ${(props) => {
    if (props.rank === 0) return "rgba(255, 215, 0, 0.1)"
    if (props.rank === 1) return "rgba(192, 192, 192, 0.1)"
    if (props.rank === 2) return "rgba(205, 127, 50, 0.1)"
    return "rgba(76, 175, 80, 0.1)"
  }};
  border: 1px solid ${(props) => {
    if (props.rank === 0) return "rgba(255, 215, 0, 0.3)"
    if (props.rank === 1) return "rgba(192, 192, 192, 0.3)"
    if (props.rank === 2) return "rgba(205, 127, 50, 0.3)"
    return "rgba(76, 175, 80, 0.3)"
  }};
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  text-align: center;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
`

const DonorPromoTitle = styled.p`
  font-weight: 600;
  margin-bottom: 5px;
  color: ${(props) => {
    if (props.rank === 0) return "#d4af37"
    if (props.rank === 1) return "#717171"
    if (props.rank === 2) return "#a05a2c"
    return "#1a7a1a"
  }};
`

const DonorPromoButton = styled.a`
  display: inline-block;
  margin-top: 8px;
  padding: 6px 12px;
  background: ${(props) => {
    if (props.rank === 0) return "#ffd700"
    if (props.rank === 1) return "#c0c0c0"
    if (props.rank === 2) return "#cd7f32"
    return "#4caf50"
  }};
  color: ${(props) => (props.rank === 1 ? "#333" : "white")};
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
`

const Home = () => {
  const { user: authUser, token } = useAuth()
  const [advertisements, setAdvertisements] = useState([])
  const [topTransporter, setTopTransporter] = useState(null)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [adError, setAdError] = useState("")
  const [transporterError, setTransporterError] = useState("")
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [pageText, setPageText] = useState("")
  const contentRef = useRef(null)

  useEffect(() => {
    document.title = "SustainaFood - Home"
    return () => {
      document.title = "SustainaFood"
    }
  }, [])

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const response = await fetch("http://localhost:3000/users/top-donor-ad", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (response.ok) {
          setAdvertisements(data)
          setAdError("")
        } else {
          setAdError(data.error || "Failed to fetch advertisements")
        }
      } catch (error) {
        setAdError("Failed to fetch advertisements")
      }
    }
    fetchAdvertisements()
  }, [token])

  useEffect(() => {
    const fetchTopTransporter = async () => {
      try {
        const response = await fetch("http://localhost:3000/users/top-transporter", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (response.ok) {
          setTopTransporter(data)
          setTransporterError("")
        } else {
          setTransporterError(data.error || "Failed to fetch top transporter")
        }
      } catch (error) {
        setTransporterError("Failed to fetch top transporter")
      }
    }
    fetchTopTransporter()
  }, [token])

  useEffect(() => {
    const collectText = () => {
      const wrapper = contentRef.current
      if (!wrapper) {
        console.warn("Content container not found")
        return
      }

      const textNodes = []
      const walk = document.createTreeWalker(
        wrapper,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (
              node.parentElement.tagName === "SCRIPT" ||
              node.parentElement.tagName === "STYLE" ||
              node.parentElement.tagName === "IMG" ||
              node.parentElement.classList.contains("TopTransporterBadge") ||
              node.parentElement.classList.contains("TopDonorBadge") ||
              node.parentElement.classList.contains("CarouselButton") ||
              node.parentElement.classList.contains("CarouselDot")
            ) {
              return NodeFilter.FILTER_REJECT
            }
            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let node
      while ((node = walk.nextNode())) {
        let text = node.textContent.trim()
        if (!text) continue
        text = text
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Remove emojis
          .replace(/[^\w\s.,!?]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove invisible characters
          .replace(/\.+/g, '.') // Normalize periods
          .replace(/\s*\.\s*/g, '. ') // Ensure single space after period
        if (text) textNodes.push(text)
      }

      const finalText = textNodes.join('. ')
      console.log("Collected text (length:", finalText.length, "):", finalText.substring(0, 200) + "...")
      setPageText(finalText)
    }

    const timer = setTimeout(collectText, 1000)
    return () => clearTimeout(timer)
  }, [advertisements, topTransporter, adError, transporterError])

  useEffect(() => {
    const sections = document.querySelectorAll("section")
    const revealSection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1"
        }
      })
    }
    const sectionObserver = new IntersectionObserver(revealSection, {
      root: null,
      threshold: 0.15,
    })
    sections.forEach((section) => {
      sectionObserver.observe(section)
    })
    return () => {
      sections.forEach((section) => {
        sectionObserver.unobserve(section)
      })
    }
  }, [])

  useEffect(() => {
    if (advertisements.length > 1 && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [advertisements, isAutoPlaying])

  const handlePrevAd = useCallback(() => {
    setCurrentAdIndex((prevIndex) => (prevIndex === 0 ? advertisements.length - 1 : prevIndex - 1))
  }, [advertisements])

  const handleNextAd = useCallback(() => {
    setCurrentAdIndex((prevIndex) => (prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1))
  }, [advertisements])

  const goToAd = (index) => {
    setCurrentAdIndex(index)
  }

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const difference = touchStart - touchEnd
    if (difference > 50) {
      handleNextAd()
    } else if (difference < -50) {
      handlePrevAd()
    }
  }

  const getRankText = (index) => {
    switch (index) {
      case 0: return "Top 1 Donor"
      case 1: return "Top 2 Donor"
      case 2: return "Top 3 Donor"
      default: return `${index + 1}th Donor`
    }
  }

  return (
    <>
      <GlobalStyle />
      <Navbar />
      <HomeContainer ref={contentRef}>
        <HeroSection>
          <HeroText>
            <h1>Welcome to SustainaFood</h1>
            <p>
              Connecting donors, recipients, and transporters to reduce food waste and bring help where it's needed most.
            </p>
            {!authUser && <CallToAction href="/signup">Join Us Today</CallToAction>}
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
        <TwoColumnSection>
          <ColumnSection>
            <DonorSectionTitle>Our Heartfelt Heroes</DonorSectionTitle>
            {adError ? (
              <ErrorMessage>{adError}</ErrorMessage>
            ) : advertisements.length > 0 ? (
              <div
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                style={{ position: "relative" }}
              >
                <AdCarouselContainer
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <AdCarouselTrack style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}>
                    {advertisements.map((ad) => (
                      <AdSlide key={ad._id} rank={ad.rank}>
                        <TopDonorBadge rank={ad.rank} />
                        <AdImageEnhanced
                          src={`http://localhost:3000/${ad.advertisementImage}`}
                          alt={`Advertisement by ${ad.name}`}
                        />
                        <DonorInfo>
                          <DonorName rank={ad.rank}>{ad.name}</DonorName>
                          <DonorRank rank={ad.rank}>{getRankText(ad.rank)}</DonorRank>
                        </DonorInfo>
                        <DonorPromoMessage rank={ad.rank}>
                          <DonorPromoTitle rank={ad.rank}>
                            {ad.rank === 0
                              ? "🏆 Gold Donor Spotlight"
                              : ad.rank === 1
                              ? "🥈 Silver Donor Highlight"
                              : ad.rank === 2
                              ? "🥉 Bronze Donor Feature"
                              : "✨ Featured Donor"}
                          </DonorPromoTitle>
                          <p>
                            {ad.rank === 0
                              ? "Support this top donor's business! Their generous contributions make a significant impact on our mission to reduce food waste."
                              : ad.rank === 1
                              ? "This silver-tier donor helps us connect surplus food with those who need it most. Consider supporting their business!"
                              : ad.rank === 2
                              ? "Our bronze donor plays a vital role in our community. Visit their business to show your appreciation!"
                              : "Thank you to this valued donor for supporting our cause. Your patronage of their business helps our community!"}
                          </p>
                        </DonorPromoMessage>
                      </AdSlide>
                    ))}
                  </AdCarouselTrack>
                  {advertisements.length > 1 && (
                    <>
                      <CarouselControls>
                        <CarouselButton onClick={handlePrevAd} aria-label="Previous advertisement">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </CarouselButton>
                        <CarouselButton onClick={handleNextAd} aria-label="Next advertisement">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </CarouselButton>
                      </CarouselControls>
                      <CarouselDots>
                        {advertisements.map((_, index) => (
                          <CarouselDot
                            key={index}
                            isActive={index === currentAdIndex}
                            onClick={() => goToAd(index)}
                            aria-label={`Go to advertisement ${index + 1}`}
                          />
                        ))}
                      </CarouselDots>
                    </>
                  )}
                </AdCarouselContainer>
              </div>
            ) : (
              <SponsorText>No advertisements available</SponsorText>
            )}
          </ColumnSection>
          <ColumnSection>
            <SectionTitle>Our Compassionate Courier</SectionTitle>
            {transporterError ? (
              <ErrorMessage>{transporterError}</ErrorMessage>
            ) : topTransporter ? (
              <CarouselContainer>
                <TopTransporterBadge />
                <TransporterImage
                  src={`http://localhost:3000/${topTransporter.photo}`}
                  alt={`Profile picture of ${topTransporter.name}`}
                />
                <TransporterInfo>
                  {topTransporter.name} - {topTransporter.deliveryCount} Deliveries
                </TransporterInfo>
                <ThankYouMessage>
                  Thank you, {topTransporter.name}, for your dedication in delivering food to those in need. Your efforts help reduce waste and strengthen our community!
                </ThankYouMessage>
              </CarouselContainer>
            ) : (
              <SponsorText>No top transporter data available</SponsorText>
            )}
          </ColumnSection>
        </TwoColumnSection>
        <SectionWrapper>
          <SectionTitle>Our Key Features</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <h3>User Management</h3>
              <p>Seamlessly register, authenticate, and manage your profile with our intuitive interface.</p>
            </FeatureCard>
            <FeatureCard>
              <h3>Food Donation Management</h3>
              <p>Donate, track, and manage food donations easily with real-time updates and notifications.</p>
            </FeatureCard>
            <FeatureCard>
              <h3>Logistics & AI Routing</h3>
              <p>Efficiently schedule and optimize deliveries with our advanced AI algorithms for minimal waste.</p>
            </FeatureCard>
            <FeatureCard>
              <h3>Notifications & Feedback</h3>
              <p>Stay updated with real-time notifications and provide valuable feedback to improve our services.</p>
            </FeatureCard>
          </FeaturesGrid>
        </SectionWrapper>
        <SectionWrapper bgColor="#e8f5e9" align="left">
          <SectionTitle align="left">Our Proposed Solution</SectionTitle>
          <ProposedSolutionList>
            <li>
              <strong>Real-time Analytics:</strong> Track the impact of actions and adjust strategies as needed with comprehensive dashboards and reports.
            </li>
            <li>
              <strong>Free Services for All Stakeholders:</strong> Completely free services for NGOs, partner companies, and other stakeholders to maximize participation.
            </li>
            <li>
              <strong>Artificial Intelligence:</strong> Optimize routes and stock management to reduce logistics costs and improve efficiency with cutting-edge AI technology.
            </li>
            <li>
              <strong>Gamification:</strong>
              <p>Reward both consumers and merchants to encourage active participation through points, badges, and recognition.</p>
            </li>
            <li>
              <strong>Awareness Campaign:</strong> Collaborate with local associations to expand the partner network and maximize national impact through targeted outreach.
            </li>
          </ProposedSolutionList>
          <SummaryText>
            In summary, SustainaFood offers a flexible, intelligent, and scalable solution to effectively combat food waste in Tunisia/Setif while building a stronger, more connected community.
          </SummaryText>
        </SectionWrapper>
      </HomeContainer>
      <SpeechButton textToRead={pageText} />
      <Footer />
    </>
  )
}

export default Home