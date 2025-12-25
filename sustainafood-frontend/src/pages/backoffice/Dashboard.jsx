"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import CardStats from "../../components/backoffcom/CardStats"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  PolarAreaController,
  RadarController,
  DoughnutController,
} from "chart.js"
import { Bar, Line, Pie } from "react-chartjs-2"
import "/src/assets/styles/backoffcss/dashboard.css"
import axios from "axios"
import { CSVLink } from "react-csv"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController,
  RadarController,
  DoughnutController,
  Filler,
  Title,
  Tooltip,
  Legend,
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 20,
    userRoles: {},
    totalDonations: 21,
    donationStatus: {},
    totalRequests: 17,
    requestStatus: {},
    totalTransactions: 19,
    transactionStatus: {},
    totalProducts: 2,
    totalMeals: 15,
    expiringDonations: 8,
    foodDistributed: 1,
    foodWastePrevented: 7,
    totalFeedbacks: 0,
    averageRating: 0,
    feedbackTrends: [],
    deliveryTrends: [],
    totalDeliveries: 0,
    deliveryStatus: {}, // Added deliveryStatus
    topDonors: [],
    topRecipients: [],
    donationTrends: [],
    requestTrends: [],
    userGrowth: [],
    productBreakdown: {},
    mealBreakdown: {},
  })

  const [filters, setFilters] = useState({
    dateRange: "30d",
    category: "all",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Dashboard";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get("http://localhost:3000/stats", {
          params: filters,
        })
        setStats(response.data)
      } catch (err) {
        console.error("Error fetching stats:", err)
        setError("Failed to load statistics. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const csvData = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Total Donations", value: stats.totalDonations },
    { label: "Total Requests", value: stats.totalRequests },
    { label: "Total Transactions", value: stats.totalTransactions },
    { label: "Total Products", value: stats.totalProducts },
    { label: "Total Meals", value: stats.totalMeals },
    { label: "Expiring Donations", value: stats.expiringDonations },
    { label: "Food Waste Prevented (kg)", value: stats.foodWastePrevented },
    { label: "Total Feedbacks", value: stats.totalFeedbacks },
    { label: "Average Rating", value: stats.averageRating },
    { label: "Total Deliveries", value: stats.totalDeliveries },
    ...Object.entries(stats.userRoles).map(([role, count]) => ({
      label: `Users - ${role}`,
      value: count,
    })),
    ...Object.entries(stats.donationStatus).map(([status, count]) => ({
      label: `Donations - ${status}`,
      value: count,
    })),
    ...Object.entries(stats.requestStatus).map(([status, count]) => ({
      label: `Requests - ${status}`,
      value: count,
    })),
    ...Object.entries(stats.transactionStatus).map(([status, count]) => ({
      label: `Transactions - ${status}`,
      value: count,
    })),
    ...Object.entries(stats.deliveryStatus).map(([status, count]) => ({
      label: `Deliveries - ${status}`,
      value: count,
    })),
    ...Object.entries(stats.productBreakdown).map(([type, count]) => ({
      label: `Products - ${type}`,
      value: count,
    })),
    ...Object.entries(stats.mealBreakdown).map(([type, count]) => ({
      label: `Meals - ${type}`,
      value: count,
    })),
  ]

  // Donation Trends - Area Chart
  const donationTrendsData = {
    labels: stats.donationTrends.map((trend) => trend.date),
    datasets: [
      {
        label: "Donations Over Time",
        data: stats.donationTrends.map((trend) => trend.count),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Request Trends - Area Chart
  const requestTrendsData = {
    labels: stats.requestTrends.map((trend) => trend.date),
    datasets: [
      {
        label: "Requests Over Time",
        data: stats.requestTrends.map((trend) => trend.count),
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // User Growth - Area Chart
  const userGrowthData = {
    labels: stats.userGrowth.map((growth) => growth.date),
    datasets: [
      {
        label: "New Users Over Time",
        data: stats.userGrowth.map((growth) => growth.count),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Feedback Trends - Area Chart
  const feedbackTrendsData = {
    labels: stats.feedbackTrends.map((trend) => trend.date),
    datasets: [
      {
        label: "Feedbacks Over Time",
        data: stats.feedbackTrends.map((trend) => trend.count),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Delivery Trends - Area Chart
  const deliveryTrendsData = {
    labels: stats.deliveryTrends.map((trend) => trend.date),
    datasets: [
      {
        label: "Deliveries Over Time",
        data: stats.deliveryTrends.map((trend) => trend.count),
        borderColor: "rgba(46, 125, 50, 1)",
        backgroundColor: "rgba(46, 125, 50, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Product Breakdown - Horizontal Bar Chart
  const productBreakdownData = {
    labels: Object.keys(stats.productBreakdown),
    datasets: [
      {
        label: "Product Types",
        data: Object.values(stats.productBreakdown),
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#F44336", "#8D6E63"],
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  }

  // Meal Breakdown - Doughnut Chart
  const mealBreakdownData = {
    labels: Object.keys(stats.mealBreakdown),
    datasets: [
      {
        label: "Meal Types",
        data: Object.values(stats.mealBreakdown),
        backgroundColor: ["#66BB6A", "#FFA726", "#42A5F5", "#EF5350", "#A1887F"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  }

  // Donation Status - Pie Chart
  const donationStatusData = {
    labels: Object.keys(stats.donationStatus),
    datasets: [
      {
        label: "Donation Status",
        data: Object.values(stats.donationStatus),
        backgroundColor: ["#43A047", "#FB8C00", "#1E88E5", "#E53935", "#795548", "#607D8B"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  }

  // Request Status - Pie Chart
  const requestStatusData = {
    labels: Object.keys(stats.requestStatus),
    datasets: [
      {
        label: "Request Status",
        data: Object.values(stats.requestStatus),
        backgroundColor: ["#388E3C", "#F57C00", "#1976D2", "#D32F2F", "#6D4C41"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  }

  // Delivery Status - Pie Chart
  const deliveryStatusData = {
    labels: Object.keys(stats.deliveryStatus),
    datasets: [
      {
        label: "Delivery Status",
        data: Object.values(stats.deliveryStatus),
        backgroundColor: ["#0288D1", "#FBC02D", "#7B1FA2"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  }

  // Transaction Status - Stacked Bar Chart
  const transactionStatusData = {
    labels: ["Transaction Status"],
    datasets: Object.entries(stats.transactionStatus).map(([status, count], index) => ({
      label: status,
      data: [count],
      backgroundColor: ["#2E7D32", "#EF6C00", "#1565C0", "#C62828", "#5D4037", "#546E7A"][index],
      borderWidth: 0,
      borderRadius: 6,
    })),
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />
        <div className="filter-bar">
          <div className="filter-group">
            <label>
              Date Range:
              <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </label>
            <label>
              Category:
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="all">All</option>
                <option value="packaged_products">Packaged Products</option>
                <option value="prepared_meals">Prepared Meals</option>
              </select>
            </label>
          </div>
          <CSVLink
            data={csvData}
            filename={`sustainafood-stats-${new Date().toISOString()}.csv`}
            className="export-button"
          >
            Export to CSV
          </CSVLink>
        </div>
        {loading && <div className="loading">Loading statistics...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <>
            <div className="card-container">
              <CardStats
                title="Total Users"
                value={stats.totalUsers}
                percentage={null}
                icon="users"
                color="blue"
                progress={0}
              />
              <CardStats
                title="Total Donations"
                value={stats.totalDonations}
                percentage={null}
                icon="utensils"
                color="green"
                progress={0}
              />
              <CardStats
                title="Total Requests"
                value={stats.totalRequests}
                percentage={null}
                icon="handHoldingHeart"
                color="orange"
                progress={0}
              />
              <CardStats
                title="Total Transactions"
                value={stats.totalTransactions}
                percentage={null}
                icon="chart"
                color="purple"
                progress={0}
              />
              <CardStats
                title="Food Waste Prevented"
                value={`${stats.foodWastePrevented} kg`}
                percentage={null}
                icon="trash"
                color="teal"
                progress={0}
              />
              <CardStats
                title="Expiring Donations"
                value={stats.expiringDonations}
                percentage={null}
                icon="clock"
                color="yellow"
                progress={0}
              />
              <CardStats
                title="Total Products"
                value={stats.totalProducts}
                percentage={null}
                icon="box"
                color="pink"
                progress={0}
              />
              <CardStats
                title="Total Meals"
                value={stats.totalMeals}
                percentage={null}
                icon="utensils"
                color="cyan"
                progress={0}
              />
              <CardStats
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                percentage={null}
                icon="star"
                color="gold"
                progress={0}
              />
              <CardStats
                title="Total Deliveries"
                value={stats.totalDeliveries}
                percentage={null}
                icon="truck"
                color="indigo"
                progress={0}
              />
            </div>
            <div className="charts-status-container">
              <div className="chart-section">
                <h3>User Growth</h3>
                <Line
                  data={userGrowthData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Transaction Status</h3>
                <Bar
                  data={transactionStatusData}
                  options={{
                    responsive: true,
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                      },
                    },
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Request Trends</h3>
                <Line
                  data={requestTrendsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Feedback Trends</h3>
                <Line
                  data={feedbackTrendsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Donation Trends</h3>
                <Line
                  data={donationTrendsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Delivery Trends</h3>
                <Line
                  data={deliveryTrendsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Product Breakdown</h3>
                <Bar
                  data={productBreakdownData}
                  options={{
                    responsive: true,
                    indexAxis: "y",
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-section">
                <h3>Meal Breakdown</h3>
                <Bar
                  data={mealBreakdownData}
                  options={{
                    responsive: true,
                    indexAxis: "y",
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="pie-charts-container">
              <div className="pie-chart-section">
                <h3>Donation Status</h3>
                <Pie
                  data={donationStatusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
              <div className="pie-chart-section">
                <h3>Request Status</h3>
                <Pie
                  data={requestStatusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
              <div className="pie-chart-section">
                <h3>Delivery Status</h3>
                <Pie
                  data={deliveryStatusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="detailed-stats">
              <div className="stats-section">
                <h3>User Role Breakdown</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.userRoles).map(([role, count]) => (
                      <tr key={role}>
                        <td>{role}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stats-section">
                <h3>Top Donors</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Donations</th>
                      <th>Total Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topDonors.map((donor) => (
                      <tr key={donor._id}>
                        <td>{donor.name || "Unknown"}</td>
                        <td>{donor.donationCount}</td>
                        <td>{donor.totalItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stats-section">
                <h3>Top Recipients</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Requests</th>
                      <th>Total Items Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topRecipients.map((recipient) => (
                      <tr key={recipient._id}>
                        <td>{recipient.name || "Unknown"}</td>
                        <td>{recipient.requestCount}</td>
                        <td>{recipient.totalItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard