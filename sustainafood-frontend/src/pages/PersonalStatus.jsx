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
const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f8f0;
  padding: 40px 20px;
  font-family: 'Poppins', sans-serif;
`;

const StatsCard = styled.div`
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

const StatsText = styled.p`
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

const PersonalStatus = () => {
  const { authUser } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [userId, setUserId] = useState("");
  const isDonor = user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor";
  const isRecipient = user?.role === "ong" || user?.role === "student";

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood -  Personal Statistics";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    if (authUser && (authUser._id || authUser.id)) {
      setUserId(authUser._id || authUser.id);
      console.log("userId depuis authUser:", authUser._id || authUser.id);
    } else if (user) {
      setUserId(user._id || user.id || "");
      console.log("userId depuis localStorage:", user._id || user.id);
    }
  }, [authUser]);

  useEffect(() => {
    const fetchPersonalStats = async () => {
      if (!userId) {
        setError("User ID is not available.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const endpoint = isDonor
          ? `http://localhost:3000/donation/api/personal-stats/donor/${userId}`
          : `http://localhost:3000/donation/api/personal-stats/recipient/${userId}`;
        console.log("Fetching from:", endpoint);
        const response = await fetch(endpoint);
        if (!response.ok) {
          const text = await response.text();
          console.error("Response Error:", response.status, text);
          throw new Error(`Failed to fetch personal stats: ${response.status}`);
        }
        const data = await response.json();
        console.log("Données de l'API:", data);
        setStatsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId && (isDonor || isRecipient)) fetchPersonalStats();
  }, [userId, isDonor, isRecipient]);

  const chartData = statsData && 
    (isDonor ? statsData.weeklyAcceptedTrends?.length > 0 : statsData.weeklyRequestTrends?.length > 0)
    ? {
        labels: isDonor
          ? statsData.weeklyAcceptedTrends.map((t) => `Week ${t._id}`)
          : statsData.weeklyRequestTrends.map((t) => `Week ${t._id}`),
        datasets: [
          {
            label: isDonor ? "Accepted Donations per Week" : "Requests per Week",
            data: isDonor
              ? statsData.weeklyAcceptedTrends.map((t) => t.count)
              : statsData.weeklyRequestTrends.map((t) => t.count),
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
        text: isDonor ? "Weekly Accepted Donations" : "Weekly Requests",
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

  const downloadStatusReport = () => {
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
      doc.text("Personal Status Report", doc.internal.pageSize.width / 2, 15, { align: "center" });
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
    doc.text("Your Personal Statistics", 10, position);
    position += 10;

    doc.setFontSize(10);
    doc.setTextColor(58, 90, 58);
    doc.setFont("helvetica", "normal");
    if (isDonor && statsData) {
      doc.text(`Role: Donor (${user?.role})`, 10, position);
      position += 5;
      doc.text(`Accepted Donations: ${statsData.acceptedDonations || 0}`, 10, position);
      position += 5;
      doc.text(`Requests for Your Donations: ${statsData.requestsForDonations || 0}`, 10, position);
    } else if (isRecipient && statsData) {
      doc.text(`Role: Recipient (${user?.role})`, 10, position);
      position += 5;
      doc.text(`Total Requests Made: ${statsData.totalRequests || 0}`, 10, position);
      position += 5;
      doc.text(`Accepted Donations: ${statsData.acceptedDonations || 0}`, 10, position);
    }
    position += 10;

    if (chartData) {
      const chartCanvas = chartRef.current?.querySelector("canvas");
      if (chartCanvas) {
        html2canvas(chartCanvas, { scale: 2 }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 190;
          const chartImgHeight = (canvas.height * imgWidth) / canvas.width;

          if (position + chartImgHeight > 250) {
            doc.addPage();
            addHeader();
            position = 40;
          }

          doc.setFontSize(12);
          doc.setTextColor(26, 122, 26);
          doc.setFont("helvetica", "bold");
          doc.text("Weekly Activity", 10, position);
          position += 5;
          doc.addImage(imgData, "PNG", 10, position, imgWidth, chartImgHeight);
          position += chartImgHeight + 10;

          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            addFooter(i, pageCount);
          }

          const today = new Date();
          doc.save(`Personal_Status_Report_${today.toISOString().split("T")[0]}.pdf`);
        });
      }
    } else {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(i, pageCount);
      }
      const today = new Date();
      doc.save(`Personal_Status_Report_${today.toISOString().split("T")[0]}.pdf`);
    }
  };

  if (loading) return <StatsContainer><LoadingMessage>Loading personal status...</LoadingMessage></StatsContainer>;
  if (error) return <StatsContainer><ErrorMessage>{error}</ErrorMessage></StatsContainer>;
  if (!isDonor && !isRecipient) return <StatsContainer><ErrorMessage>Access denied.</ErrorMessage></StatsContainer>;

  console.log("chartData avant rendu:", chartData);

  return (
    <>
      <Navbar />
      <StatsContainer>
        <StatsCard>
          <Titlee>{isDonor ? "Donor Personal Status" : "Recipient Personal Status"}</Titlee>
          {isDonor ? (
            <>
              <StatsText><strong>Role:</strong> Donor ({user?.role})</StatsText>
              <StatsText><strong>Accepted Donations:</strong> {statsData?.acceptedDonations || 0}</StatsText>
              <StatsText><strong>Requests for Your Donations:</strong> {statsData?.requestsForDonations || 0}</StatsText>
            </>
          ) : (
            <>
              <StatsText><strong>Role:</strong> Recipient ({user?.role})</StatsText>
              <StatsText><strong>Total Requests Made:</strong> {statsData?.totalRequests || 0}</StatsText>
              <StatsText><strong>Accepted Donations:</strong> {statsData?.acceptedDonations || 0}</StatsText>
            </>
          )}
          {chartData && (
            <ChartContainer ref={chartRef}>
              <Bar data={chartData} options={chartOptions} />
            </ChartContainer>
          )}
          <DownloadButton onClick={downloadStatusReport}>
            Download Status Report as PDF
          </DownloadButton>
        </StatsCard>
      </StatsContainer>
      <Footer />
    </>
  );
};

export default PersonalStatus;