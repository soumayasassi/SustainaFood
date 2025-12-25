import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaFilePdf } from "react-icons/fa";
import '../../assets/styles/backoffcss/PredictionsDashboard.css';
import logo from '../../assets/images/logooo.png';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PredictionsDashboard = () => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Predictions Dashboard";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get('http://localhost:3000/donation/donations/predict-supply-demand?period=week');
        console.log('API Response:', response.data);
        setPredictions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Prediction Fetch Error:', err.response || err.message);
        setError('Failed to load predictions: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="profile-container">
          <Navbar />
          <div>Loading predictions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="profile-container">
          <Navbar />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const hasValidData = predictions && predictions.supply && predictions.demand && 
    Object.keys(predictions.supply).length > 0 && Object.keys(predictions.demand).length > 0;

  if (!hasValidData) {
    console.log('Predictions State:', predictions);
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="profile-container">
          <Navbar />
          <div>No prediction data available</div>
        </div>
      </div>
    );
  }

  const allWeeks = [...new Set([...Object.keys(predictions.supply), ...Object.keys(predictions.demand)])].sort();

  const chartData = {
    labels: allWeeks,
    datasets: [
      {
        label: 'Supply (Products)',
        data: allWeeks.map(week => predictions.supply[week]?.products || 0),
        borderColor: 'blue',
        fill: false,
      },
      {
        label: 'Supply (Meals)',
        data: allWeeks.map(week => predictions.supply[week]?.meals || 0),
        borderColor: 'green',
        fill: false,
      },
      {
        label: 'Demand (Products)',
        data: allWeeks.map(week => predictions.demand[week]?.products || 0),
        borderColor: 'red',
        fill: false,
      },
      {
        label: 'Demand (Meals)',
        data: allWeeks.map(week => predictions.demand[week]?.meals || 0),
        borderColor: 'orange',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weekly Supply and Demand Predictions (Next Two Weeks)' },
    },
  };

  const generateReport = () => {
    let report = '<div class="report-container" style="font-family: Poppins, sans-serif; color: #333;">';
    report += '<h1 style="font-size: 26px; text-align: center; font-weight: bold;">Prediction Analysis Report</h1>';
  
    allWeeks.forEach(week => {
      report += `<div class="week-section" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
      report += `<h4 style="font-size: 20px; color: #444; border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 15px;">Week ${week}</h4>`;
      report += `<p style="font-size: 14px;"><strong>Predicted Supply:</strong> ${predictions.supply[week]?.products || 0} products, ${predictions.supply[week]?.meals || 0} meals</p>`;
      report += `<p style="font-size: 14px;"><strong>Predicted Demand:</strong> ${predictions.demand[week]?.products || 0} products, ${predictions.demand[week]?.meals || 0} meals</p>`;
      
      report += `<p style="font-size: 14px; font-weight: bold;"><strong>Balance Analysis:</strong></p><ul class="ul-predactions" style="padding-left: 0; margin: 10px 0; list-style: none;">`;
      const productBalance = (predictions.supply[week]?.products || 0) - (predictions.demand[week]?.products || 0);
      const mealBalance = (predictions.supply[week]?.meals || 0) - (predictions.demand[week]?.meals || 0);
  
      if (productBalance > 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">✅ Surplus of ${productBalance} products. Supply exceeds demand.</li>`;
      } else if (productBalance < 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">⚠️ Shortage of ${Math.abs(productBalance)} products. Demand exceeds supply.</li>`;
      } else {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">⚖️ Products: Balanced.</li>`;
      }
  
      if (mealBalance > 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">✅ Surplus of ${mealBalance} meals. Supply exceeds demand.</li>`;
      } else if (mealBalance < 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">⚠️ Shortage of ${Math.abs(mealBalance)} meals. Demand exceeds supply.</li>`;
      } else {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">⚖️ Meals: Balanced.</li>`;
      }
  
      report += `</ul></div>`;
    });
  
    report += `<div class="resolution-section" style="padding: 15px; background: #eafbea; border-left: 5px solid #28a745; border-radius: 8px; margin-top: 20px;"><h4 style="font-size: 20px; color: #444; border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 15px;">Resolution</h4><p style="font-size: 14px;">Recommended actions to address supply-demand balance:</p><ul class="ul-predactions" style="padding-left: 0; margin: 10px 0; list-style: none;">`;
  
    allWeeks.forEach(week => {
      const productBalance = (predictions.supply[week]?.products || 0) - (predictions.demand[week]?.products || 0);
      const mealBalance = (predictions.supply[week]?.meals || 0) - (predictions.demand[week]?.meals || 0);
  
      if (productBalance > 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">📦 For ${week} (Products): Surplus of ${productBalance}. Redistribute excess products.</li>`;
      } else if (productBalance < 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">🛒 For ${week} (Products): Shortage of ${Math.abs(productBalance)}. Increase donations.</li>`;
      }
  
      if (mealBalance > 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">🍽️ For ${week} (Meals): Surplus of ${mealBalance}. Coordinate distribution.</li>`;
      } else if (mealBalance < 0) {
        report += `<li class="li-predactions" style="display: flex; align-items: center; padding: 8px 12px; margin: 5px 0; background: rgba(40, 167, 69, 0.1); border-left: 5px solid #28a745; border-radius: 5px; font-size: 14px; line-height: 1.5;">🍽️ For ${week} (Meals): Shortage of ${Math.abs(mealBalance)}. Encourage donations.</li>`;
      }
    });
  
    report += `</ul></div>`;
    report += `</div>`;
  
    return report;
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
      const imgWidth = 30, imgHeight = 30;
      doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);
      const title = "Supply and Demand Predictions";
      doc.setFontSize(28);
      doc.setTextColor(50, 62, 72);
      doc.setFont("helvetica", "bold");
      doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });
      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 50, 38);
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
  
    // Add the first page header
    addHeader();
  
    // Capture the chart as an image
    const chartCanvas = chartRef.current.querySelector('canvas');
    html2canvas(chartCanvas, { scale: 2 }).then(chartCanvas => {
      const chartImgData = chartCanvas.toDataURL('image/png');
      const imgWidth = 190;
      const chartImgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
  
      // Add the chart to the PDF
      let position = 50;
      doc.addImage(chartImgData, 'PNG', 10, position, imgWidth, chartImgHeight);
  
      // Add the report as text
      position += chartImgHeight + 10; // Space after the chart
  
      // Report content
      doc.setFontSize(16);
      doc.setTextColor(50, 62, 72);
      doc.setFont("helvetica", "bold");
      doc.text("Prediction Analysis Report", 10, position);
      position += 10;
  
      allWeeks.forEach(week => {
        // Check if we need a new page
        if (position > 250) { // Leave space for footer
          doc.addPage();
          addHeader();
          position = 50;
        }
  
        doc.setFontSize(12);
        doc.setTextColor(50, 62, 72);
        doc.setFont("helvetica", "bold");
        doc.text(`Week ${week}`, 10, position);
        position += 7;
  
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        doc.text(`Predicted Supply: ${predictions.supply[week]?.products || 0} products, ${predictions.supply[week]?.meals || 0} meals`, 10, position);
        position += 5;
        doc.text(`Predicted Demand: ${predictions.demand[week]?.products || 0} products, ${predictions.demand[week]?.meals || 0} meals`, 10, position);
        position += 7;
  
        doc.setFont("helvetica", "bold");
        doc.text("Balance Analysis:", 10, position);
        position += 5;
  
        const productBalance = (predictions.supply[week]?.products || 0) - (predictions.demand[week]?.products || 0);
        const mealBalance = (predictions.supply[week]?.meals || 0) - (predictions.demand[week]?.meals || 0);
  
        doc.setFont("helvetica", "normal");
        // Add bullet point for product balance
        doc.text("•", 15, position); // Custom bullet
        if (productBalance > 0) {
          doc.text(`Surplus of ${productBalance} products. Supply exceeds demand.`, 20, position);
        } else if (productBalance < 0) {
          doc.text(`Shortage of ${Math.abs(productBalance)} products. Demand exceeds supply.`, 20, position);
        } else {
          doc.text(`Products: Balanced.`, 20, position);
        }
        position += 5;
  
        // Add bullet point for meal balance
        doc.text("•", 15, position); // Custom bullet
        if (mealBalance > 0) {
          doc.text(`Surplus of ${mealBalance} meals. Supply exceeds demand.`, 20, position);
        } else if (mealBalance < 0) {
          doc.text(`Shortage of ${Math.abs(mealBalance)} meals. Demand exceeds supply.`, 20, position);
        } else {
          doc.text(`Meals: Balanced.`, 20, position);
        }
        position += 10;
      });
  
      // Resolution section
      if (position > 250) {
        doc.addPage();
        addHeader();
        position = 50;
      }
  
      doc.setFontSize(12);
      doc.setTextColor(50, 62, 72);
      doc.setFont("helvetica", "bold");
      doc.text("Resolution", 10, position);
      position += 5;
  
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Recommended actions to address supply-demand balance:", 10, position);
      position += 7;
  
      allWeeks.forEach(week => {
        const productBalance = (predictions.supply[week]?.products || 0) - (predictions.demand[week]?.products || 0);
        const mealBalance = (predictions.supply[week]?.meals || 0) - (predictions.demand[week]?.meals || 0);
  
        if (productBalance > 0) {
          if (position > 250) {
            doc.addPage();
            addHeader();
            position = 50;
          }
          doc.text("•", 15, position); // Custom bullet
          doc.text(`For ${week} (Products): Surplus of ${productBalance}. Redistribute excess products.`, 20, position);
          position += 5;
        } else if (productBalance < 0) {
          if (position > 250) {
            doc.addPage();
            addHeader();
            position = 50;
          }
          doc.text("•", 15, position); // Custom bullet
          doc.text(`For ${week} (Products): Shortage of ${Math.abs(productBalance)}. Increase donations.`, 20, position);
          position += 5;
        }
  
        if (mealBalance > 0) {
          if (position > 250) {
            doc.addPage();
            addHeader();
            position = 50;
          }
          doc.text("•", 15, position); // Custom bullet
          doc.text(`For ${week} (Meals): Surplus of ${mealBalance}. Coordinate distribution.`, 20, position);
          position += 5;
        } else if (mealBalance < 0) {
          if (position > 250) {
            doc.addPage();
            addHeader();
            position = 50;
          }
          doc.text("•", 15, position); // Custom bullet
          doc.text(`For ${week} (Meals): Shortage of ${Math.abs(mealBalance)}. Encourage donations.`, 20, position);
          position += 5;
        }
      });
  
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(i, pageCount);
      }
  
      const today = new Date();
      doc.save(`Supply_Demand_Predictions_${today.toISOString().split("T")[0]}.pdf`);
    });
  };

  return (
    <div className="prdd-admin-dashboard">
      <Sidebar />
      <div className="prdd-profile-container">
        <Navbar />
        <div className="prdd-chart-container">
          <h1 style={{ marginTop: '0px', color: '#28a745' }}>
            Weekly Supply and Demand Predictions (Next Two Weeks)
          </h1>
          <button className="prdd-download-button" onClick={downloadPDF}>
            <FaFilePdf /> Export to PDF
          </button>
          <div ref={chartRef}>
            <Line data={chartData} options={options} />
          </div>
        </div>
  
        <div className="prdd-week-section">
          <h4>Prediction Details</h4>
          <div dangerouslySetInnerHTML={{ __html: generateReport() }} />
        </div>
      </div>
    </div>
  );
  
};

export default PredictionsDashboard;