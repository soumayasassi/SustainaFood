import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import React from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// Global Styles
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
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Footer container
const FooterContainer = styled.footer`
  background: linear-gradient(135deg, #56ab2f, #228b22);
  color: white;
  padding: 50px 30px 30px;
  font-family: 'Poppins', sans-serif;
  animation: ${fadeIn} 0.8s ease-in-out;
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1);
`;

// Footer content
const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 50px;
  justify-content: center;
  text-align: left;
  max-width: 1200px;
  margin: 0 auto;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Column
const Column = styled.div`
  flex: 1 1 250px;
  min-width: 250px;
`;

// Column title
const ColumnTitle = styled.h3`
  font-size: 22px;
  margin-bottom: 20px;
  color: #e6ffe6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// About text
const AboutText = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: #e6ffe6;
  opacity: 0.9;
`;

// Footer links
const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  li {
    margin-bottom: 12px;
  }
  a {
    color: #e6ffe6;
    text-decoration: none;
    font-size: 15px;
    transition: color 0.3s ease, text-decoration 0.3s ease;
    &:hover {
      color: #ffffff;
      text-decoration: underline;
    }
  }
`;

// Contact info
const ContactInfo = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #e6ffe6;
  opacity: 0.9;
  a {
    color: #e6ffe6;
    text-decoration: none;
    transition: color 0.3s ease;
    &:hover {
      color: #ffffff;
    }
  }
`;

// Social icons
const SocialIcons = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 20px;
  svg {
    color: #e6ffe6;
    font-size: 22px;
    cursor: pointer;
    transition: transform 0.3s ease, color 0.3s ease;
    &:hover {
      transform: scale(1.3);
      color: #ffffff;
    }
  }
`;

// Newsletter form
const NewsletterForm = styled.form`
  margin-top: 20px;
  display: flex;
  gap: 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px;

  input {
    padding: 10px 15px;
    border: none;
    border-radius: 15px;
    flex: 1;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 14px;
    outline: none;
    transition: background 0.3s ease;
    &::placeholder {
      color: #d4edda;
      opacity: 0.8;
    }
    &:focus {
      background: rgba(255, 255, 255, 0.3);
    }
  }
  button {
    padding: 10px 20px;
    border: none;
    border-radius: 15px;
    background: #d4edda;
    color: #228b22;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.3s ease;
    &:hover {
      background: #c1eac1;
      transform: translateY(-2px);
    }
    &:active {
      transform: translateY(0);
    }
  }
`;

// Footer bottom
const FooterBottom = styled.div`
  text-align: center;
  margin-top: 40px;
  font-size: 14px;
  color: #e6ffe6;
  opacity: 0.7;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 20px;
  a {
    color: #e6ffe6;
    text-decoration: none;
    transition: color 0.3s ease;
    &:hover {
      color: #ffffff;
      text-decoration: underline;
    }
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        {/* About Section */}
        <Column>
          <ColumnTitle>About SustainaFood</ColumnTitle>
          <AboutText>
            SustainaFood is an innovative food redistribution platform committed to reducing food waste and connecting donors, recipients, and transporters. We empower communities and promote sustainability.
          </AboutText>
        </Column>

        {/* Quick Links */}
        <Column>
          <ColumnTitle>Quick Links</ColumnTitle>
          <FooterLinks>
            <li><a href="#">About Us</a></li>
            <li><a href="/Contact">Contact</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
          </FooterLinks>
        </Column>

        {/* Contact & Social */}
        <Column>
          <ColumnTitle>Contact & Social</ColumnTitle>
          <ContactInfo>
            <p style={{color: "#e6ffe6"}}>Email: <a href="mailto:info@sustainafood.com">info@sustainafood.com</a></p>
            <p style={{color: "#e6ffe6"}}>Phone: +216 123 456 789</p>
          </ContactInfo>
          <SocialIcons>
            <FaFacebookF />
            <FaTwitter />
            <FaInstagram />
            <FaLinkedinIn />
          </SocialIcons>
          <NewsletterForm>
            <input type="email" placeholder="Subscribe to newsletter" />
            <button type="submit">Subscribe</button>
          </NewsletterForm>
        </Column>
      </FooterContent>
      <FooterBottom>
        © 2025 SustainaFood. All rights reserved.
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;