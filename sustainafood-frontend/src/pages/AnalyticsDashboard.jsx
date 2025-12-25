import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from '../assets/images/logooo.png';
import styled, { keyframes } from 'styled-components';
import patternBg from "../assets/images/bg.png";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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

// Styled components
const AnalyticsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f8f0;
  padding: 40px 20px;
  font-family: 'Poppins', sans-serif;
`;

const AnalyticsCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 800px;
  width: 100%;
  margin: 20px;
  position: relative;
  animation: ${fadeIn} 0.8s ease-out forwards;
  z-index: 2;
  background: 
    linear-gradient(135deg, rgba(230, 242, 230, 0.9), rgba(220, 240, 220, 0.85)),
    url(${patternBg}) repeat center center;
  background-size: 200px 200px;

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

const Titlee = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a7a1a;
  text-align: center;
  margin-bottom: 30px;
  position: relative;

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
`;

const AnalyticsText = styled.p`
  font-size: 1.1rem;
  color: #3a5a3a;
  margin: 10px 0;
  line-height: 1.6;

  strong {
    color: #1a7a1a;
    font-weight: 600;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const DownloadButton = styled.button`
  display: block;
  margin: 30px auto;
  padding: 12px 30px;
  background: linear-gradient(135deg, #228b22, #56ab2f);
  color: white;
  border: none;
  border-radius: 30px;
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(34, 139, 34, 0.2);
  position: relative;
  overflow: hidden;
  animation: ${float} 6s ease-in-out infinite;

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
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: #e63946;
  text-align: center;
  margin: 20px 0;
`;

const LoadingMessage = styled.p`
  font-size: 1.2rem;
  color: #3a5a3a;
  text-align: center;
  margin: 20px 0;
`;

const AnalyticsDashboard = () => {
  const { authUser } = useAuth();
  const user = JSON.parse(localStorage.getItem("user"));
  const [userId, setuserId] = useState("");
  const isDonor = user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor";
  const isRecipient = user?.role === "ong" || user?.role === "student";

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Analytics Dashboard";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    if (authUser && (authUser._id || authUser.id)) {
      setuserId(authUser._id || authUser.id);
      console.log("userId depuis authUser :", authUser._id || authUser.id);
    } else if (user) {
      setuserId(user._id || user.id || "");
      console.log("userId depuis localStorage :", user._id || user.id);
    }
  }, [authUser]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) {
        setError("User ID is not available.");
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
        const endpoint = isDonor
          ? `http://localhost:3000/donation/api/analytics/donor/${userId}`
          : `http://localhost:3000/donation/api/analytics/recipient/${userId}`;
        console.log("Fetching from:", endpoint);
        const response = await fetch(endpoint);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to fetch analytics: ${response.status} - ${text}`);
        }
        const data = await response.json();
        console.log("Données de l'API :", data);
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    if (userId && (isDonor || isRecipient)) fetchAnalytics();
  }, [userId, isDonor, isRecipient]);

  const chartData = analyticsData?.weeklyTrends && analyticsData.weeklyTrends.length > 0
    ? {
        labels: analyticsData.weeklyTrends.map((t) => `Week ${t._id}`),
        datasets: [
          {
            label: isDonor ? "Donations per Week" : "Requests per Week",
            data: analyticsData.weeklyTrends.map((t) => t.count),
            backgroundColor: "#56ab2f",
            borderColor: "#228b22",
            borderWidth: 1,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 14,
          },
          color: "#3a5a3a",
        },
      },
      title: {
        display: true,
        text: "Weekly Activity",
        font: {
          family: "'Poppins', sans-serif",
          size: 20,
          weight: "600",
        },
        color: "#1a7a1a",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
          color: "#3a5a3a",
        },
      },
      x: {
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
          color: "#3a5a3a",
        },
      },
    },
  };

  const downloadReport = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const addHeader = () => {
      doc.setFillColor(240, 248, 240);
      doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");
      const imgWidth = 25, imgHeight = 25;
      doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(1.5);
      doc.line(0, 30, doc.internal.pageSize.width, 30);
      doc.setFontSize(20);
      doc.setTextColor(26, 122, 26);
      doc.setFont("helvetica", "bold");
      doc.text(isDonor ? "Donor Analytics Report" : "Recipient Analytics Report", doc.internal.pageSize.width / 2, 15, { align: "center" });
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.setFontSize(10);
      doc.setTextColor(58, 90, 58);
      doc.text(`Generated: ${today}`, doc.internal.pageSize.width - 50, 25);
    };

    const addFooter = (page, pageCount) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
      doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
    };

    addHeader();

    let position = 40;
    doc.setFontSize(12);
    doc.setTextColor(26, 122, 26);
    doc.setFont("helvetica", "bold");
    doc.text("Analytics Summary", 10, position);
    position += 10;

    doc.setFontSize(10);
    doc.setTextColor(58, 90, 58);
    doc.setFont("helvetica", "normal");
    if (isDonor) {
      doc.text(`Total Donations: ${analyticsData.totalDonations}`, 10, position);
      position += 5;
      doc.text(`Total Items Donated: ${analyticsData.totalItems}`, 10, position);
      position += 5;
      doc.text(`Categories Donated: ${analyticsData.categories.join(", ")}`, 10, position);
    } else {
      doc.text(`Total Requests: ${analyticsData.totalRequests}`, 10, position);
      position += 5;
      doc.text(`Fulfilled Requests: ${analyticsData.fulfilledRequests}`, 10, position);
      position += 5;
      doc.text(`Total Fulfilled Items: ${analyticsData.totalFulfilledItems}`, 10, position);
      position += 5;
      doc.text(`Categories Requested: ${analyticsData.categories.join(", ")}`, 10, position);
    }
    position += 10;

    if (chartData) {
      const chartCanvas = chartRef.current.querySelector("canvas");
      html2canvas(chartCanvas, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 190;
        const chartImgHeight = (canvas.height * imgWidth) / canvas.width;

        if (position + chartImgHeight > 250) {
          doc.addPage();
          addHeader();
          position = 40;
        }

        doc.addImage(imgData, "PNG", 10, position, imgWidth, chartImgHeight);
        position += chartImgHeight + 10;

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          addFooter(i, pageCount);
        }

        const today = new Date();
        doc.save(`${isDonor ? "Donor" : "Recipient"}_Analytics_Report_${today.toISOString().split("T")[0]}.pdf`);
      });
    } else {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(i, pageCount);
      }
      const today = new Date();
      doc.save(`${isDonor ? "Donor" : "Recipient"}_Analytics_Report_${today.toISOString().split("T")[0]}.pdf`);
    }
  };

  if (loading) return <AnalyticsContainer><LoadingMessage>Loading analytics...</LoadingMessage></AnalyticsContainer>;
  if (error) return <AnalyticsContainer><ErrorMessage>{error}</ErrorMessage></AnalyticsContainer>;
  if (!isDonor && !isRecipient) return <AnalyticsContainer><ErrorMessage>Access denied.</ErrorMessage></AnalyticsContainer>;

  console.log("chartData avant rendu :", chartData);

  return (
    <>
      <Navbar />
      <AnalyticsContainer>
        <AnalyticsCard>
          <Titlee>{isDonor ? "Donor Analytics" : "Recipient Analytics"}</Titlee>
          {isDonor ? (
            <>
              <AnalyticsText><strong>Total Donations:</strong> {analyticsData?.totalDonations}</AnalyticsText>
              <AnalyticsText><strong>Total Items Donated:</strong> {analyticsData?.totalItems}</AnalyticsText>
              <AnalyticsText><strong>Categories Donated:</strong> {analyticsData?.categories?.join(", ")}</AnalyticsText>
            </>
          ) : (
            <>
              <AnalyticsText><strong>Total Requests:</strong> {analyticsData?.totalRequests}</AnalyticsText>
              <AnalyticsText><strong>Fulfilled Requests:</strong> {analyticsData?.fulfilledRequests}</AnalyticsText>
              <AnalyticsText><strong>Total Fulfilled Items:</strong> {analyticsData?.totalFulfilledItems}</AnalyticsText>
              <AnalyticsText><strong>Categories Requested:</strong> {analyticsData?.categories?.join(", ")}</AnalyticsText>
            </>
          )}
          {chartData && (
            <ChartContainer ref={chartRef}>
              <Bar data={chartData} options={chartOptions} />
            </ChartContainer>
          )}
          <DownloadButton onClick={downloadReport}>
            Download Report as PDF
          </DownloadButton>
        </AnalyticsCard>
      </AnalyticsContainer>
      <Footer />
    </>
  );
};

export default AnalyticsDashboard;