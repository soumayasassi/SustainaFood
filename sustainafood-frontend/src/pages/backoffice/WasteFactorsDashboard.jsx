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

const WasteFactorsDashboard = () => {
  const [factors, setFactors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    document.title = "SustainaFood - Waste Factors Dashboard";
    return () => { document.title = "SustainaFood"; };
  }, []);

  useEffect(() => {
    const fetchFactors = async () => {
      try {
        const response = await axios.get('http://localhost:5001/waste-factors');
        // Transform the response into an array of { feature, importance } objects
        const factorsData = Object.entries(response.data).map(([feature, importance]) => ({
          feature,
          importance: parseFloat(importance) // Ensure importance is a number
        }));
        setFactors(factorsData);
        setLoading(false);
      } catch (err) {
        console.error('Factors Fetch Error:', err);
        setError('Failed to load factors: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    fetchFactors();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="profile-container">
          <Navbar />
          <div>Loading factors...</div>
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
    labels: factors.map(f => f.feature),
    datasets: [{
      label: 'Factor Importance',
      data: factors.map(f => f.importance),
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Factors Influencing Waste' } },
    scales: { y: { beginAtZero: true, max: 1 } },
  };

  const generateReport = () => {
    let report = '<div class="report-container" style="font-family: Poppins, sans-serif; color: #333;">';
    report += '<h1 style="font-size: 26px; text-align: center; font-weight: bold;">Waste Factors Analysis Report</h1>';
    report += '<p style="font-size: 14px;">Factors influencing food waste based on current event data:</p>';
    factors.forEach(f => {
      report += `<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px;">`;
      report += `<p style="font-size: 14px; font-weight: bold;">${f.feature}: ${Math.round(f.importance * 100)}%</p>`;
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
      doc.text("Waste Factors Report", doc.internal.pageSize.width / 2, 20, { align: "center" });
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
      doc.text("Factor Analysis", 10, 70 + chartImgHeight);
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      let position = 80 + chartImgHeight;
      factors.forEach(f => {
        if (position > 250) { doc.addPage(); addHeader(); position = 50; }
        doc.text(`${f.feature}: ${Math.round(f.importance * 100)}%`, 10, position);
        position += 10;
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) { doc.setPage(i); addFooter(i, pageCount); }
      doc.save(`Waste_Factors_Report_${today.toISOString().split("T")[0]}.pdf`);
    });
  };

  return (
    <div className="prdd-admin-dashboard">
      <Sidebar />
      <div className="prdd-profile-container">
        <Navbar />
        <div className="prdd-chart-container">
          <h1 style={{ marginTop: '0px', color: '#28a745' }}>Factors Influencing Waste</h1>
          <button className="prdd-download-button" onClick={downloadPDF}><FaFilePdf /> Export to PDF</button>
          <div ref={chartRef}><Bar data={chartData} options={options} /></div>
        </div>
        <div className="prdd-week-section" dangerouslySetInnerHTML={{ __html: generateReport() }} />
      </div>
    </div>
  );
};

export default WasteFactorsDashboard;