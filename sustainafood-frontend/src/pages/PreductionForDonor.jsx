import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from '../assets/images/logooo.png';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import styled, { keyframes } from 'styled-components';
import patternBg from "../assets/images/bg.png";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

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
const ForecastContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f8f0;
  padding: 40px 20px;
  font-family: 'Poppins', sans-serif;
`;

const ForecastCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 1300px;
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

const Subtitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  color: #3a5a3a;
  margin-bottom: 20px;
  text-align: center;
`;

const DetailsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a7a1a;
  margin-top: 40px;
  margin-bottom: 20px;
  text-align: center;
`;

const ChartWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 500px;
  margin: 0 auto 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
`;

const ForecastList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ForecastListItem = styled.li`
  background: #f9f9f9;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  color: #3a5a3a;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  border-left: 3px solid #228b22;

  &:hover {
    transform: translateX(5px);
  }
`;

const ForecastDate = styled.span`
  font-weight: 600;
  color: #1a7a1a;
  margin-right: 10px;
`;

const ForecastValue = styled.span`
  font-weight: 600;
  color: #56ab2f;
  margin: 0 5px;
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

const LoadingMessage = styled.p`
  font-size: 1.2rem;
  color: #3a5a3a;
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: #e63946;
  text-align: center;
`;

const PredictionForDonor = () => {
  const { authUser, user } = useAuth();
  const [userId, setuserId] = useState("");
  const [donationForecast, setDonationForecast] = useState([]);
  const [requestForecast, setRequestForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartContainerRef = useRef(null);
  const isDonor = user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor";
  const isRecipient = user?.role === "ong" || user?.role === "student";
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood -  Predictions";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    if (authUser && (authUser._id || authUser.id)) {
      setuserId(authUser._id || authUser.id);
      console.log("userId from authUser:", authUser._id || authUser.id);
    } else if (user) {
      setuserId(user._id || user.id || "");
      console.log("userId from localStorage:", user._id || user.id);
    }
  }, [authUser]);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        setLoading(true);
        const donationResponse = await axios.get('http://localhost:3000/api/api/forecast/donations?days=7');
        const requestResponse = await axios.get('http://localhost:3000/api/api/forecast/requests?days=7');
        setDonationForecast(donationResponse.data);
        setRequestForecast(requestResponse.data);
        setError(null);
      } catch (err) {
        setError('Error fetching forecasts: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecasts();
  }, []);

  const chartData = isDonor ? {
    labels: requestForecast.map(entry => entry.ds),
    datasets: [
      {
        label: 'Request Forecast',
        data: requestForecast.map(entry => entry.yhat),
        borderColor: '#228b22',
        backgroundColor: 'rgba(34, 139, 34, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#228b22',
        pointBorderColor: '#228b22',
        pointRadius: 5,
      },
    ],
  } : {
    labels: donationForecast.map(entry => entry.ds),
    datasets: [
      {
        label: 'Donation Forecast',
        data: donationForecast.map(entry => entry.yhat),
        borderColor: '#228b22',
        backgroundColor: 'rgba(34, 139, 34, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#228b22',
        pointBorderColor: '#228b22',
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Poppins', sans-serif",
          },
          color: '#3a5a3a',
        },
      },
      title: {
        display: true,
        text: isDonor ? 'Request Forecast (Next 7 Days)' : 'Donation Forecast (Next 7 Days)',
        font: {
          size: 20,
          family: "'Poppins', sans-serif",
          weight: '600',
        },
        color: '#1a7a1a',
        padding: {
          top: 20,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#3a5a3a',
        bodyColor: '#3a5a3a',
        borderColor: '#228b22',
        borderWidth: 1,
        titleFont: {
          family: "'Poppins', sans-serif",
          size: 14,
        },
        bodyFont: {
          family: "'Poppins', sans-serif",
          size: 12,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Predicted Count',
          font: {
            size: 16,
            family: "'Poppins', sans-serif",
            weight: '500',
          },
          color: '#3a5a3a',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
          },
          color: '#3a5a3a',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 16,
            family: "'Poppins', sans-serif",
            weight: '500',
          },
          color: '#3a5a3a',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
          },
          color: '#3a5a3a',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header setup
    const addHeader = () => {
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
      doc.setDrawColor(144, 196, 60);
      doc.setLineWidth(1.5);
      doc.line(0, 40, doc.internal.pageSize.width, 40);
      doc.addImage(logo, "PNG", 10, 5, 30, 30);
      doc.setFontSize(18);
      doc.setTextColor(34, 139, 34);
      doc.setFont("helvetica", "bold");
      doc.text(isDonor ? "Request Forecast Report" : "Donation Forecast Report", doc.internal.pageSize.width / 2, 20, { align: "center" });
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 35);
    };

    // Footer setup
    const addFooter = (page, pageCount) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);
      doc.setFillColor(144, 196, 60);
      doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Confidential - For internal use only", 15, doc.internal.pageSize.height - 10);
      doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
    };

    // Add header to the first page
    addHeader();

    // Capture the chart
    setTimeout(() => {
      if (chartContainerRef.current) {
        const canvas = chartContainerRef.current.querySelector('canvas');
        if (canvas) {
          html2canvas(canvas, { scale: 2 }).then((capturedCanvas) => {
            const chartImgData = capturedCanvas.toDataURL('image/png');
            const imgWidth = 190;
            const chartImgHeight = (capturedCanvas.height * imgWidth) / capturedCanvas.width;

            // Add chart to PDF
            let yPosition = 50;
            doc.addImage(chartImgData, 'PNG', 10, yPosition, imgWidth, chartImgHeight);
            yPosition += chartImgHeight + 20;

            // Add forecast details
            doc.setFontSize(14);
            doc.setTextColor(34, 139, 34);
            doc.setFont("helvetica", "bold");
            doc.text(isDonor ? "Request Forecast Details" : "Donation Forecast Details", 10, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            const forecastData = isDonor ? requestForecast : donationForecast;
            forecastData.forEach((entry) => {
              if (yPosition > 250) {
                doc.addPage();
                addHeader();
                yPosition = 50;
              }
              doc.text(
                `${entry.ds}: ${entry.yhat.toFixed(2)} (Range: ${entry.yhat_lower.toFixed(2)} - ${entry.yhat_upper.toFixed(2)})`,
                10,
                yPosition
              );
              yPosition += 8;
            });

            // Add footer to all pages
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              addFooter(i, pageCount);
            }

            // Save the PDF
            doc.save(isDonor ? "request_forecast.pdf" : "donation_forecast.pdf");
          }).catch((err) => {
            console.error("Error capturing chart:", err);
            alert("Failed to capture chart for PDF. Please try again.");
          });
        } else {
          console.error("Canvas not found in chart container");
          alert("Chart canvas not found. Please ensure the chart is rendered before exporting.");
        }
      } else {
        console.error("Chart container reference not found");
        alert("Chart container not found. Please try again.");
      }
    }, 1000); // Increased delay to ensure chart rendering
  };

  if (loading) return <ForecastContainer><LoadingMessage>Loading analytics...</LoadingMessage></ForecastContainer>;
  if (error) return <ForecastContainer><ErrorMessage>{error}</ErrorMessage></ForecastContainer>;
  if (!isDonor && !isRecipient) return <ForecastContainer><ErrorMessage>Access denied.</ErrorMessage></ForecastContainer>;

  return (
    <>
      <Navbar />
      <ForecastContainer>
        <ForecastCard>
          <Titlee>{isDonor ? "Donor Analytics" : "Recipient Analytics"}</Titlee>
          {isDonor ? (
            <>
              <div>
                <Subtitle>Request Forecast</Subtitle>
                <ChartWrapper ref={chartContainerRef}>
                  <Line data={chartData} options={chartOptions} />
                </ChartWrapper>
                <DownloadButton onClick={downloadPDF}>
                  Download PDF Report
                </DownloadButton>
                <DetailsTitle>Request Forecast Details</DetailsTitle>
                <ForecastList>
                  {requestForecast.map((entry, index) => (
                    <ForecastListItem key={index}>
                      <ForecastDate>{entry.ds}</ForecastDate>: Predicted Requests: <ForecastValue>{entry.yhat.toFixed(2)}</ForecastValue> (Range: {entry.yhat_lower.toFixed(2)} - {entry.yhat_upper.toFixed(2)})
                    </ForecastListItem>
                  ))}
                </ForecastList>
              </div>
            </>
          ) : (
            <>
              <div>
                <Subtitle>Donation Forecast</Subtitle>
                <ChartWrapper ref={chartContainerRef}>
                  <Line data={chartData} options={chartOptions} />
                </ChartWrapper>
                <DownloadButton onClick={downloadPDF}>
                  Download PDF Report
                </DownloadButton>
                <DetailsTitle>Donation Forecast Details</DetailsTitle>
                <ForecastList>
                  {donationForecast.map((entry, index) => (
                    <ForecastListItem key={index}>
                      <ForecastDate>{entry.ds}</ForecastDate>: Predicted Donations: <ForecastValue>{entry.yhat.toFixed(2)}</ForecastValue> (Range: {entry.yhat_lower.toFixed(2)} - {entry.yhat_upper.toFixed(2)})
                    </ForecastListItem>
                  ))}
                </ForecastList>
              </div>
            </>
          )}
        </ForecastCard>
      </ForecastContainer>
      <Footer />
    </>
  );
};

export default PredictionForDonor;