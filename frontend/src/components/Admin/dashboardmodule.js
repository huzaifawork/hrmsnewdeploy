import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
// Simple admin design
import "./simple-admin.css";

export default function Dashboardmodule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [timePeriod, setTimePeriod] = useState('monthly');

  // Fetch dashboard analytics data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://hrms-bace.vercel.app/api';

      const response = await axios.get(`${apiUrl}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboardData(response.data.analytics);

        // Generate recent activities from the data
        const activities = generateRecentActivities(response.data.analytics);
        setRecentActivities(activities);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Provide fallback data if API is not available
      const fallbackData = {
        revenue: { total: 0, food: 0, rooms: 0, tables: 0 },
        overview: { isGrowthPositive: true, revenueGrowth: 0 },
        rooms: { bookings: 0, available: 0, total: 0, occupancyRate: 0 },
        food: { totalOrders: 0, successRate: 0, avgOrderValue: 0 },
        tables: { reservations: 0 },
        activity: { today: { bookings: 0, orders: 0, reservations: 0 } }
      };

      setDashboardData(fallbackData);
      setRecentActivities([{
        guest: 'System',
        room: 'Dashboard',
        activity: 'Using fallback data - API connection failed',
        time: 'Just now'
      }]);

      setError('Dashboard loaded with limited data. Some features may not be available.');
      toast.warning('Dashboard loaded with limited data');
    }
  };

  // Generate recent activities from analytics data
  const generateRecentActivities = (analytics) => {
    const activities = [];
    const now = new Date();

    // Add some sample activities based on real data
    if (analytics.activity?.today?.orders > 0) {
      activities.push({
        guest: 'Recent Customer',
        room: `Order #${Math.floor(Math.random() * 1000) + 1000}`,
        activity: `Placed food order - Rs.${analytics.food?.avgOrderValue || 0}`,
        time: `${Math.floor(Math.random() * 30) + 1} mins ago`
      });
    }

    if (analytics.activity?.today?.bookings > 0) {
      activities.push({
        guest: 'New Guest',
        room: `Room #${Math.floor(Math.random() * 100) + 100}`,
        activity: 'Checked in for room booking',
        time: `${Math.floor(Math.random() * 60) + 1} mins ago`
      });
    }

    if (analytics.activity?.today?.reservations > 0) {
      activities.push({
        guest: 'Table Guest',
        room: `Table #${Math.floor(Math.random() * 20) + 1}`,
        activity: 'Reserved table for dining',
        time: `${Math.floor(Math.random() * 90) + 1} mins ago`
      });
    }

    // Add some default activities if no real data
    if (activities.length === 0) {
      activities.push(
        {
          guest: 'System',
          room: 'Dashboard',
          activity: 'Dashboard loaded successfully',
          time: 'Just now'
        }
      );
    }

    return activities.slice(0, 4); // Limit to 4 activities
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "admin") {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    // Fetch real dashboard data
    fetchDashboardData().finally(() => {
      setLoading(false);
    });
  }, [navigate]);

  // Handle time period change
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
    // In a real implementation, you might refetch data with different time period
    // For now, we'll just update the state
  };

  if (loading) {
    return (
      <div className="simple-admin-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-admin-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button
            className="simple-btn simple-btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-admin-container">
      <div className="simple-admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Hi, Admin!</h1>
          <p>Complete overview of your hotel business performance.</p>
          {dashboardData && (
            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "5px" }}>
              Last updated: {new Date().toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchDashboardData().finally(() => setLoading(false));
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px"
          }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="simple-stat-card" style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>Revenue Statistics</h3>
          <select
            value={timePeriod}
            onChange={(e) => handleTimePeriodChange(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div
          className="stat-number"
          style={{ fontSize: "36px", marginBottom: "8px" }}
        >
          Rs.{dashboardData?.revenue?.total?.toLocaleString() || '0'}
        </div>
        <div style={{
          color: dashboardData?.overview?.isGrowthPositive ? "#059669" : "#dc2626",
          fontSize: "14px"
        }}>
          {dashboardData?.overview?.isGrowthPositive ? '+' : ''}{dashboardData?.overview?.revenueGrowth?.toFixed(1) || '0'}% from last month
        </div>

        {/* Revenue Breakdown */}
        {dashboardData?.revenue && (
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#059669" }}>
                Rs.{dashboardData.revenue.food?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Food Orders</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#3b82f6" }}>
                Rs.{dashboardData.revenue.rooms?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Room Bookings</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#8b5cf6" }}>
                Rs.{dashboardData.revenue.tables?.toLocaleString() || '0'}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Table Reservations</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="simple-stats-grid">
        <div className="simple-stat-card">
          <h3>Total Bookings</h3>
          <div className="stat-number">{dashboardData?.rooms?.bookings?.toLocaleString() || '0'}</div>
          <div className="stat-label">Room Bookings</div>
          <div style={{ fontSize: "12px", color: "#059669", marginTop: "5px" }}>
            Today: {dashboardData?.activity?.today?.bookings || '0'}
          </div>
        </div>

        <div className="simple-stat-card">
          <h3>Available Rooms</h3>
          <div className="stat-number">{dashboardData?.rooms?.available || '0'}</div>
          <div className="stat-label">Out of {dashboardData?.rooms?.total || '0'} rooms</div>
          <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "5px" }}>
            Occupancy: {dashboardData?.rooms?.occupancyRate || '0'}%
          </div>
        </div>

        <div className="simple-stat-card">
          <h3>Food Orders</h3>
          <div className="stat-number">{dashboardData?.food?.totalOrders?.toLocaleString() || '0'}</div>
          <div className="stat-label">Total Orders</div>
          <div style={{ fontSize: "12px", color: "#059669", marginTop: "5px" }}>
            Success Rate: {dashboardData?.food?.successRate || '0'}%
          </div>
        </div>

        <div className="simple-stat-card">
          <h3>Table Reservations</h3>
          <div className="stat-number">{dashboardData?.tables?.reservations?.toLocaleString() || '0'}</div>
          <div className="stat-label">Total Reservations</div>
          <div style={{ fontSize: "12px", color: "#8b5cf6", marginTop: "5px" }}>
            Today: {dashboardData?.activity?.today?.reservations || '0'}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="simple-table-container" style={{ marginTop: "30px" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: 0, color: "#111827" }}>Recent Activities</h3>
          <p style={{ margin: "5px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            Latest customer interactions and bookings
          </p>
        </div>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Reference</th>
              <th>Activity</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.guest}</td>
                  <td>{activity.room}</td>
                  <td>{activity.activity}</td>
                  <td>{activity.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
                  No recent activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bookings Summary */}
      <div className="simple-stat-card" style={{ marginTop: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>Bookings Summary</h3>
          <select
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          >
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>
        <div
          className="stat-number"
          style={{ fontSize: "36px", marginBottom: "8px" }}
        >
          20,395
        </div>
        <div
          style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}
        >
          Total Bookings
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{ color: "#059669", fontSize: "24px", fontWeight: "600" }}
            >
              14,839
            </div>
            <div style={{ color: "#6b7280", fontSize: "14px" }}>
              Confirmed Booking
            </div>
          </div>
          <div>
            <div
              style={{ color: "#d97706", fontSize: "24px", fontWeight: "600" }}
            >
              6,738
            </div>
            <div style={{ color: "#6b7280", fontSize: "14px" }}>
              Pending Booking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
