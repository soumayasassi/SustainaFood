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

const FoodDemandDashboard = () => {
  const [formData, setFormData] = useState({
    numberOfGuests: '',
    quantityOfFood: '',
    typeOfFood: 'Meat',
    eventType: 'Corporate',
    storageConditions: 'Refrigerated',
    purchaseHistory: 'Regular',
    seasonality: 'All Seasons',
    preparationMethod: 'Buffet',
    geographicalLocation: 'Urban',
    pricing: 'Moderate',
  });
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    document.title = "SustainaFood - Prediction Dashboard";
    return () => { document.title = "SustainaFood"; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        'Number of Guests': parseInt(formData.numberOfGuests),
        'Quantity of Food': parseFloat(formData.quantityOfFood) || 100,
        'Type of Food': formData.typeOfFood,
        'Event Type': formData.eventType,
        'Storage Conditions': formData.storageConditions,
        'Purchase History': formData.purchaseHistory,
        'Seasonality': formData.seasonality,
        'Preparation Method': formData.preparationMethod,
        'Geographical Location': formData.geographicalLocation,
        'Pricing': formData.pricing,
      };

      const [wasteResponse, demandResponse] = await Promise.all([
        axios.post('http://localhost:5001/predict_food_waste', payload),
        axios.post('http://localhost:5001/forecast_food_demand', payload),
      ]);

      setPredictions([{
        eventId: 1,
        eventType: formData.eventType,
        numberOfGuests: formData.numberOfGuests,
        typeOfFood: formData.typeOfFood,
        storageConditions: formData.storageConditions,
        predictedWaste: wasteResponse.data.predictedWaste,
        predictedQuantity: demandResponse.data.predictedQuantity,
      }]);
      setLoading(false);
    } catch (err) {
      console.error('Prediction Error:', err);
      setError('Failed to load predictions: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prdd-admin-dashboard">
        <Sidebar />
        <div className="prdd-profile-container">
          <Navbar />
          <div>Loading predictions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prdd-admin-dashboard">
        <Sidebar />
        <div className="prdd-profile-container">
          <Navbar />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const wasteChartData = {
    labels: predictions.map(p => `Event ${p.eventId}`),
    datasets: [{
      label: 'Predicted Waste (kg)',
      data: predictions.map(p => p.predictedWaste),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  };

  const demandChartData = {
    labels: predictions.map(p => `Event ${p.eventId}`),
    datasets: [{
      label: 'Predicted Quantity (kg)',
      data: predictions.map(p => p.predictedQuantity),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  };

  const generateReport = () => {
    let report = '<div class="report-container" style="font-family: Poppins, sans-serif; color: #333;">';
    report += '<h1 style="font-size: 26px; text-align: center; font-weight: bold;">Food Prediction Report</h1>';
    predictions.forEach(p => {
      report += `<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
      report += `<h4 style="font-size: 20px; color: #444;">Event ${p.eventId}</h4>`;
      report += `<p style="font-size: 14px;">Event Type: ${p.eventType}</p>`;
      report += `<p style="font-size: 14px;">Number of Guests: ${p.numberOfGuests}</p>`;
      report += `<p style="font-size: 14px;">Type of Food: ${p.typeOfFood}</p>`;
      report += `<p style="font-size: 14px;">Storage Conditions: ${p.storageConditions}</p>`;
      report += `<p style="font-size: 14px; font-weight: bold;">Predicted Waste: ${p.predictedWaste?.toFixed(2)} kg</p>`;
      report += `<p style="font-size: 14px; font-weight: bold;">Predicted Demand: ${p.predictedQuantity?.toFixed(2)} kg</p>`;
      report += `<p style="font-size: 14px;">Action: Adjust supply and plan redistribution if waste > 20 kg.</p>`;
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
      doc.text("Food Prediction Report", doc.internal.pageSize.width / 2, 20, { align: "center" });
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
    const chartCanvas = chartRef.current.querySelectorAll('canvas');
    let position = 50;
    const addChart = (canvas, title, yOffset) => {
      return html2canvas(canvas, { scale: 2 }).then(canvas => {
        const chartImgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const chartImgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(chartImgData, 'PNG', 10, yOffset, imgWidth, chartImgHeight);
        doc.setFontSize(16);
        doc.setTextColor(50, 62, 72);
        doc.text(title, 10, yOffset + chartImgHeight + 10);
        return yOffset + chartImgHeight + 20;
      });
    };

    Promise.all([
      addChart(chartCanvas[0], "Waste Prediction", 50),
      addChart(chartCanvas[1], "Demand Prediction", 50 + 100),
    ]).then(([wasteHeight, demandHeight]) => {
      let position = demandHeight;
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      predictions.forEach(p => {
        if (position > 250) { doc.addPage(); addHeader(); position = 50; }
        doc.text(`Event ${p.eventId} - Waste: ${p.predictedWaste?.toFixed(2)} kg, Demand: ${p.predictedQuantity?.toFixed(2)} kg`, 10, position);
        position += 10;
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) { doc.setPage(i); addFooter(i, pageCount); }
      doc.save(`Food_Prediction_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    });
  };

  return (
    <div className="prdd-admin-dashboard">
      <Sidebar />
      <div className="prdd-profile-container">
        <Navbar />
        <div className="prdd-chart-container">
          <h1 style={{ marginTop: '0px', color: '#28a745' }}>Food Waste and Demand Predictions</h1>
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'grid', gap: '10px', maxWidth: '500px' }}>
            <div>
              <label>Number of Guests:</label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label>Quantity of Food (kg):</label>
              <input
                type="number"
                name="quantityOfFood"
                value={formData.quantityOfFood}
                onChange={handleInputChange}
                step="0.1"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label>Type of Food:</label>
              <select name="typeOfFood" value={formData.typeOfFood} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Meat">Meat</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Dairy">Dairy</option>
                <option value="Grains">Grains</option>
              </select>
            </div>
            <div>
              <label>Event Type:</label>
              <select name="eventType" value={formData.eventType} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Corporate">Corporate</option>
                <option value="Wedding">Wedding</option>
                <option value="Party">Party</option>
                <option value="Charity">Charity</option>
              </select>
            </div>
            <div>
              <label>Storage Conditions:</label>
              <select name="storageConditions" value={formData.storageConditions} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Refrigerated">Refrigerated</option>
                <option value="Room Temperature">Room Temperature</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>
            <div>
              <label>Purchase History:</label>
              <select name="purchaseHistory" value={formData.purchaseHistory} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Regular">Regular</option>
                <option value="Occasional">Occasional</option>
                <option value="First Time">First Time</option>
              </select>
            </div>
            <div>
              <label>Seasonality:</label>
              <select name="seasonality" value={formData.seasonality} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="All Seasons">All Seasons</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
            <div>
              <label>Preparation Method:</label>
              <select name="preparationMethod" value={formData.preparationMethod} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Buffet">Buffet</option>
                <option value="Plated">Plated</option>
                <option value="Family Style">Family Style</option>
              </select>
            </div>
            <div>
              <label>Geographical Location:</label>
              <select name="geographicalLocation" value={formData.geographicalLocation} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Urban">Urban</option>
                <option value="Suburban">Suburban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>
            <div>
              <label>Pricing:</label>
              <select name="pricing" value={formData.pricing} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }}>
                <option value="Moderate">Moderate</option>
                <option value="Premium">Premium</option>
                <option value="Budget">Budget</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
              Generate Predictions
            </button>
          </form>
          {predictions.length > 0 && (
            <>
              <button className="prdd-download-button" onClick={downloadPDF}><FaFilePdf /> Export to PDF</button>
              <div ref={chartRef}>
                <Bar data={wasteChartData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Food Waste Predictions' } } }} />
                <Bar data={demandChartData} options={{ ...options, plugins: { ...options.plugins, title: { display: true, text: 'Food Demand Predictions' } } }} />
              </div>
              <div className="prdd-week-section" dangerouslySetInnerHTML={{ __html: generateReport() }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodDemandDashboard;