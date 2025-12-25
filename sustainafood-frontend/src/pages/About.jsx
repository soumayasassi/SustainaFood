"use client"

import {
  FaUtensils,
  FaLink,
  FaBox,
  FaGlobe,
  FaChartLine,
  FaHandsHelping,
  FaRocket,
  FaUsers,
  FaLeaf,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/styles/About.css";
import fooddist from "../assets/images/fooddist.png";
import solution from "../assets/images/solution.jpg";
import React, { useState, useEffect, useRef } from 'react';
import SpeechButton from "../components/SpeechButton";

const About = () => {
  const [pageText, setPageText] = useState("");
  const contentRef = useRef(null);

  useEffect(() => {
    document.title = "SustainaFood - About";
    return () => {
      document.title = "SustainaFood";
    };
  }, []);

  useEffect(() => {
    const collectText = () => {
      const wrapper = contentRef.current;
      if (!wrapper) return;

      const textNodes = [];
      const walk = document.createTreeWalker(
        wrapper,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (
              node.parentElement.tagName === "SCRIPT" ||
              node.parentElement.tagName === "STYLE" ||
              node.parentElement.classList.contains("about-leaf") ||
              node.parentElement.classList.contains("about-divider-icon") ||
              node.parentElement.tagName === "IMG" ||
              node.parentElement.classList.contains("about-stat-number")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let node;
      while ((node = walk.nextNode())) {
        let text = node.textContent.trim();
        if (!text) continue;
        text = text
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Remove emojis
          .replace(/[^\w\s.,!?]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove invisible characters
          .replace(/\.+/g, '.') // Normalize periods
          .replace(/\s*\.\s*/g, '. ') // Ensure single space after period
        if (text) textNodes.push(text);
      }

      const finalText = textNodes.join('. ');
      console.log("Collected text (length:", finalText.length, "):", finalText.substring(0, 200) + "...");
      setPageText(finalText);
    };

    collectText();
  }, []);

  return (
    <>
      <Navbar />
      <div className="about-container" ref={contentRef}>
        <div className="about-leaf about-leaf-1">
          <svg className="about-leaf-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20a4,4,0,0,0,4-4,4,4,0,0,0-4-4,4.12,4.12,0,0,0-1,.14l2.9-2.9A7,7,0,0,1,17,8Z" />
          </svg>
        </div>
        <div className="about-leaf about-leaf-2">
          <svg className="about-leaf-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20a4,4,0,0,0,4-4,4,4,0,0,0-4-4,4.12,4.12,0,0,0-1,.14l2.9-2.9A7,7,0,0,1,17,8Z" />
          </svg>
        </div>

        <div className="about-wrapper">
          <div className="about-hero">
            <div className="about-hero-content about-animate">
              <h1 className="about-title">
                Welcome to <span>SustainaFood</span>
              </h1>
              <p className="about-description">
                Connecting donors, recipients, and transporters to minimize food waste and optimize distribution.
                Together, we're building a more sustainable future where no food goes to waste and no one goes hungry.
              </p>
            </div>
            <div className="about-hero-image about-animate about-delay-1">
              <img src={fooddist} alt="Food donation and distribution" />
            </div>
          </div>

          <div className="about-mission-vision">
            <div className="about-card about-animate about-delay-1">
              <div className="about-card-content">
                <div className="about-card-icon">🌍</div>
                <h2 className="about-card-title">Our Vision</h2>
                <p className="about-card-text">
                  To build a world where food surplus is efficiently redistributed, minimizing waste and ensuring that
                  quality food reaches those who need it most. We envision communities where no edible food goes to
                  waste while people go hungry.
                </p>
              </div>
            </div>

            <div className="about-card about-animate about-delay-2">
              <div className="about-card-content">
                <div className="about-card-icon">🚀</div>
                <h2 className="about-card-title">Our Mission</h2>
                <p className="about-card-text">
                  To provide an intelligent platform that optimizes food distribution, fosters community engagement, and
                  promotes environmental sustainability. We connect donors with recipients through efficient
                  transportation networks, creating a seamless ecosystem for food redistribution.
                </p>
              </div>
            </div>
          </div>

          <div className="about-divider">
            <div className="about-divider-line"></div>
            <div className="about-divider-icon">
              <FaLeaf />
            </div>
            <div className="about-divider-line"></div>
          </div>

          <div className="about-values">
            <div className="about-values-bg"></div>
            <h2 className="about-section-title about-animate">Our Core Values</h2>
            <div className="about-values-grid">
              <div className="about-value about-animate about-delay-1">
                <FaUtensils className="about-value-icon" />
                <h3 className="about-value-title">Less Waste</h3>
                <p className="about-value-text">
                  We're committed to reducing food waste by creating efficient redistribution channels.
                </p>
              </div>

              <div className="about-value about-animate about-delay-2">
                <FaLink className="about-value-icon" />
                <h3 className="about-value-title">Stronger Links</h3>
                <p className="about-value-text">
                  Building robust connections between donors, transporters, and recipients.
                </p>
              </div>

              <div className="about-value about-animate about-delay-3">
                <FaBox className="about-value-icon" />
                <h3 className="about-value-title">Smart Sharing</h3>
                <p className="about-value-text">
                  Using technology to optimize the distribution of surplus food resources.
                </p>
              </div>

              <div className="about-value about-animate about-delay-4">
                <FaGlobe className="about-value-icon" />
                <h3 className="about-value-title">Green Future</h3>
                <p className="about-value-text">Contributing to environmental sustainability by reducing food waste.</p>
              </div>
            </div>
          </div>

          <div className="about-divider">
            <div className="about-divider-line"></div>
            <div className="about-divider-icon">
              <FaLeaf />
            </div>
            <div className="about-divider-line"></div>
          </div>

          <div className="about-solution">
            <div className="about-solution-content about-animate">
              <h2 className="about-solution-title">Our Proposed Solution</h2>
              <div className="about-features">
                <div className="about-feature about-animate about-delay-1">
                  <div className="about-feature-icon-wrapper">
                    <FaChartLine className="about-feature-icon" />
                  </div>
                  <div className="about-feature-content">
                    <h3 className="about-feature-title">Real-time Analytics</h3>
                    <p className="about-feature-text">
                      Track the impact of actions and adjust strategies as needed with our comprehensive analytics
                      dashboard.
                    </p>
                  </div>
                </div>

                <div className="about-feature about-animate about-delay-2">
                  <div className="about-feature-icon-wrapper">
                    <FaHandsHelping className="about-feature-icon" />
                  </div>
                  <div className="about-feature-content">
                    <h3 className="about-feature-title">Free Services</h3>
                    <p className="about-feature-text">
                      Completely free services for NGOs, partner companies, and all other stakeholders in our ecosystem.
                    </p>
                  </div>
                </div>

                <div className="about-feature about-animate about-delay-3">
                  <div className="about-feature-icon-wrapper">
                    <FaRocket className="about-feature-icon" />
                  </div>
                  <div className="about-feature-content">
                    <h3 className="about-feature-title">Artificial Intelligence</h3>
                    <p className="about-feature-text">
                      Optimize routes and stock management to reduce logistics costs and improve overall efficiency.
                    </p>
                  </div>
                </div>

                <div className="about-feature about-animate about-delay-4">
                  <div className="about-feature-icon-wrapper">
                    <FaUsers className="about-feature-icon" />
                  </div>
                  <div className="about-feature-content">
                    <h3 className="about-feature-title">Awareness Campaign</h3>
                    <p className="about-feature-text">
                      Collaborate with local associations to expand the partner network and maximize national impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-solution-image about-animate about-delay-2">
              <img src={solution} alt="Our Solution" />
            </div>
          </div>

          <div className="about-impact about-animate about-delay-1">
            <h2 className="about-impact-title">Our Impact</h2>
            <div className="about-stats">
              <div className="about-stat about-animate about-delay-2">
                <div className="about-stat-number">500+</div>
                <div className="about-stat-label">Food Donors</div>
              </div>
              <div className="about-stat about-animate about-delay-3">
                <div className="about-stat-number">1,200+</div>
                <div className="about-stat-label">Recipients Served</div>
              </div>
              <div className="about-stat about-animate about-delay-4">
                <div className="about-stat-number">8,500+</div>
                <div className="about-stat-label">Meals Delivered</div>
              </div>
              <div className="about-stat about-animate about-delay-5">
                <div className="about-stat-number">120+</div>
                <div className="about-stat-label">Volunteer Transporters</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SpeechButton textToRead={pageText} position="right" />
      <Footer />
    </>
  );
};

export default About;