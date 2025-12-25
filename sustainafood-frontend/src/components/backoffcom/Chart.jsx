import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import "/src/assets/styles/backoffcss/chart.css"

// Custom color palette
const COLORS = {
  // Primary colors
  primary: "#34495e", // Dark slate blue
  secondary: "#3498db", // Soft blue
  tertiary: "#1abc9c", // Teal

  // Status colors
  success: "#27ae60", // Green
  warning: "#f39c12", // Amber
  danger: "#e74c3c", // Red
  info: "#2980b9", // Blue

  // Neutral colors
  neutral1: "#7f8c8d", // Gray
  neutral2: "#95a5a6", // Light gray

  // Chart colors - softer, more professional palette
  chart1: "#2c3e50", // Dark blue
  chart2: "#16a085", // Green
  chart3: "#8e44ad", // Purple
  chart4: "#d35400", // Orange
  chart5: "#2980b9", // Blue
  chart6: "#27ae60", // Green
}

// Sample data for pie charts
const pieData = [
  { name: "Category A", value: 60 },
  { name: "Category B", value: 40 },
]

const lineData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 7000 },
]

const Chart = ({ type = "line", title = "Chart Title", data = lineData }) => {
  // Use our custom colors for the charts
  const chartColors = [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5, COLORS.chart6]

  return (
    <div className="charts-container">
      <div className="chart">
        <h3>{title}</h3>
        {type === "line" && (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#666" }}
                axisLine={{ stroke: "#e0e0e0" }}
                tickLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis tick={{ fill: "#666" }} axisLine={{ stroke: "#e0e0e0" }} tickLine={{ stroke: "#e0e0e0" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke={COLORS.tertiary}
                strokeWidth={3}
                dot={{ stroke: COLORS.tertiary, strokeWidth: 2, r: 4, fill: "white" }}
                activeDot={{ stroke: COLORS.tertiary, strokeWidth: 2, r: 6, fill: "white" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {type === "pie" && (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default Chart
