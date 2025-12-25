import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from "../../components/backoffcom/Sidebar";
import Navbar from "../../components/backoffcom/Navbar";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaFilePdf } from "react-icons/fa";
import '../../assets/styles/backoffcss/PredictionsDashboard.css';
import logo from '../../assets/images/logooo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FoodWasteDashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    document.title = "SustainaFood - Food Waste Dashboard";
    return () => { document.title = "SustainaFood"; };
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const events = [
          { eventId: 1, eventType: "Corporate", numberOfGuests: 300, typeOfFood: "Meat", storageConditions: "Refrigerated" },
          { eventId: 2, eventType: "Wedding", numberOfGuests: 150, typeOfFood: "Vegetables", storageConditions: "Room Temperature" },
        ];
        const predictions = await Promise.all(
          events.map(async (event) => {
            const response = await axios.post('http://localhost:5001/predict_food_waste', {
              'Number of Guests': event.numberOfGuests,
              'Quantity of Food': 100,
              'Type of Food': event.typeOfFood,
              'Event Type': event.eventType,
              'Storage Conditions': event.storageConditions,
              'Purchase History': 'Regular',
              'Seasonality': 'All Seasons',
              'Preparation Method': 'Buffet',
              'Geographical Location': 'Urban',
              'Pricing': 'Moderate'
            });
            return { ...event, predictedWaste: response.data.predictedWaste };
          })
        );
        setPredictions(predictions);
        setLoading(false);
      } catch (err) {
        console.error('Prediction Fetch Error:', err);
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

  const chartData = {
    labels: predictions.map(p => `Event ${p.eventId}`),
    datasets: [{
      label: 'Predicted Waste (kg)',
      data: predictions.map(p => p.predictedWaste),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Food Waste Predictions' } },
  };

  const generateReport = () => {
    let report = '<div class="report-container" style="font-family: Poppins, sans-serif; color: #333;">';
    report += '<h1 style="font-size: 26px; text-align: center; font-weight: bold;">Food Waste Prediction Report</h1>';
    predictions.forEach(p => {
      report += `<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
      report += `<h4 style="font-size: 20px; color: #444;">Event ${p.eventId}</h4>`;
      report += `<p style="font-size: 14px;">Event Type: ${p.eventType}</p>`;
      report += `<p style="font-size: 14px;">Number of Guests: ${p.numberOfGuests}</p>`;
      report += `<p style="font-size: 14px;">Type of Food: ${p.typeOfFood}</p>`;
      report += `<p style="font-size: 14px;">Storage Conditions: ${p.storageConditions}</p>`;
      report += `<p style="font-size: 14px; font-weight: bold;">Predicted Waste: ${p.predictedWaste.toFixed(2)} kg</p>`;
      report += `<p style="font-size: 14px;">Action: Consider redistributing surplus if waste > 20 kg.</p>`;
      report += `</div>`;
    });
    report += `</div>`;
    return report;
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const addHeader = () => {
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
      doc.setDrawColor(144, 196, 60);
      doc.line(0, 40, doc.internal.pageSize.width, 40);
      const imgWidth = 30, imgHeight = 30;
      doc.addImage(logo, "PNG", 5, 5, imgWidth, imgHeight);
      doc.setFontSize(28);
      doc.setTextColor(50, 62, 72);
      doc.setFont("helvetica", "bold");
      doc.text("Food Waste Report", doc.internal.pageSize.width / 2, 20, { align: "center" });
      const today = new Date();
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated: ${today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, doc.internal.pageSize.width - 50, 38);
    };
    const addFooter = (page, pageCount) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(15, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 15, doc.internal.pageSize.height - 20);
      doc.setFillColor(144, 196, 60);
      doc.roundedRect(doc.internal.pageSize.width / 2 - 15, doc.internal.pageSize.height - 18, 30, 12, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Page ${page} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
      doc.setTextColor(120, 120, 120);
      doc.text("© SustainaFood", doc.internal.pageSize.width - 45, doc.internal.pageSize.height - 10);
    };

    addHeader();
    const chartCanvas = chartRef.current.querySelector('canvas');
    html2canvas(chartCanvas, { scale: 2 }).then(chartCanvas => {
      const chartImgData = chartCanvas.toDataURL('image/png');
      const imgWidth = 190;
      const chartImgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
      doc.addImage(chartImgData, 'PNG', 10, 50, imgWidth, chartImgHeight);
      doc.setFontSize(16);
      doc.setTextColor(50, 62, 72);
      doc.text("Prediction Details", 10, 70 + chartImgHeight);
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      let position = 80 + chartImgHeight;
      predictions.forEach(p => {
        if (position > 250) { doc.addPage(); addHeader(); position = 50; }
        doc.text(`Event ${p.eventId} - Predicted Waste: ${p.predictedWaste.toFixed(2)} kg`, 10, position);
        position += 10;
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) { doc.setPage(i); addFooter(i, pageCount); }
      doc.save(`Food_Waste_Report_${today.toISOString().split("T")[0]}.pdf`);
    });
  };

  return (
    <div className="prdd-admin-dashboard">
      <Sidebar />
      <div className="prdd-profile-container">
        <Navbar />
        <div className="prdd-chart-container">
          <h1 style={{ marginTop: '0px', color: '#28a745' }}>Food Waste Predictions</h1>
          <button className="prdd-download-button" onClick={downloadPDF}><FaFilePdf /> Export to PDF</button>
          <div ref={chartRef}><Bar data={chartData} options={options} /></div>
        </div>
        <div className="prdd-week-section" dangerouslySetInnerHTML={{ __html: generateReport() }} />
      </div>
    </div>
  );
};

export default FoodWasteDashboard;