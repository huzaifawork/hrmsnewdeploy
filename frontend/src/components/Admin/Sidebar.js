import React, { useState, useEffect } from "react";
import "./sidebar.css";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FiHome,
  FiUser,
  FiLayers,
  FiGrid,
  FiShoppingCart,
  FiUsers,
  FiBarChart,
  FiSettings,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiSearch,
  FiBell,
  FiMail,
  FiCalendar,
  FiTrendingUp,
  FiActivity,
  FiStar,
  FiHeart,
  FiBookOpen,
  FiCoffee,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiGlobe,
  FiPlus,
  FiEdit,
  FiTrash,
} from "react-icons/fi";
import "./EnhancedDashboardModule.css";
import Dashboardmodule from "./dashboardmodule";
import AdminAddRoom from "./AdminAddRoom";
import AdminViewRooms from "./AdminViewRooms";
import AdminRoomUpdate from "./AdminRoomUpdate";
import AdminAddTable from "./AdminAddTable";
import AdminViewTables from "./AdminViewTables";
import AdminUpdateTable from "./AdminUpdateTable";
import AdminDeleteTable from "./AdminDeleteTable";
import AdminManageBookings from "./AdminManageBookings";
import AdminManageReservations from "./AdminManageReservations";
import AdminCustomerManagement from "./AdminCustomerManagement";
import OnlineOrderPlacement from "./OrderPlacement";
import AdminUserManagement from "./UserManagement";
import StaffManagement from "./StaffManagement";
import ShiftManagement from "./ShiftManagement";
import ReportingAnalytics from "./Reporting";
import UserProfileManagement from "./UserProfileManagement";
import RecommendationSystem from "./RecommendationSystem";
import MenuManagement from "./MenuManagement";
import AdminSettings from "./Setting";
import HotelBrandingSettings from "./HotelBrandingSettings";
import AdminDeleteRoom from "./AdminDeleteRoom";
import AdminOrders from "./AdminOrders";
import AdminViewMenus from "./AdminViewMenus";
import AdminAddMenu from "./AdminAddMenu";
import AdminUpdateMenu from "./AdminUpdateMenu";
import AdminDeleteMenu from "./AdminDeleteMenu";
import SentimentAnalysis from "./SentimentAnalysis";
import TableRecommendationAnalytics from "./TableRecommendationAnalytics";
import RecommendationEvaluation from "./RecommendationEvaluation";
import RoomRecommendationAnalytics from "./RoomRecommendationAnalytics";

const Sidebar = () => {
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [userName, setUserName] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) {
      setUserName(name);
    }

    // Handle window resize for mobile responsiveness
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        // Close mobile menu when switching to desktop
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Monitor selectedModule changes
  useEffect(() => {
    console.log("selectedModule state changed to:", selectedModule);
  }, [selectedModule]);

  // Function to change module
  const changeModule = (newModule) => {
    console.log("=== CHANGING MODULE ===");
    console.log("From:", selectedModule);
    console.log("To:", newModule);
    setSelectedModule(newModule);
    setForceUpdate(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      // On mobile, toggle mobile menu instead of collapsing
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      // On desktop, collapse/expand sidebar
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const toggleDropdown = (module) => {
    setOpenDropdown(openDropdown === module ? null : module);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !event.target.closest(".enhanced-sidebar") &&
        !event.target.closest(".mobile-menu-toggle")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const menuItems = [
    {
      name: "Dashboard",
      icon: FiHome,
      component: "Dashboard",
      badge: "Live",
      badgeColor: "success",
    },
    {
      name: "User Profile",
      icon: FiUser,
      component: "User Profile",
    },
    {
      name: "Room Management",
      icon: FiLayers,
      submenu: [
        { name: "View Rooms", component: "AdminViewRooms", icon: FiGrid },
        { name: "Add Room", component: "AdminAddRoom", icon: FiPlus },
        { name: "Update Room", component: "AdminRoomUpdate", icon: FiEdit },
        { name: "Delete Room", component: "AdminDeleteRoom", icon: FiTrash },
        {
          name: "ML Analytics",
          component: "RoomRecommendationAnalytics",
          icon: FiStar,
        },
      ],
    },
    {
      name: "Menu Management",
      icon: FiCoffee,
      submenu: [
        { name: "View Menu", component: "AdminViewMenus", icon: FiBookOpen },
        { name: "Add Menu", component: "AdminAddMenu", icon: FiPlus },
        { name: "Update Menu", component: "AdminUpdateMenu", icon: FiEdit },
        { name: "Delete Menu", component: "AdminDeleteMenu", icon: FiTrash },
        {
          name: "ML Analytics",
          component: "RecommendationEvaluation",
          icon: FiStar,
        },
      ],
    },
    {
      name: "Table Management",
      icon: FiGrid,
      submenu: [
        { name: "View Tables", component: "AdminViewTables", icon: FiGrid },
        { name: "Add Table", component: "AdminAddTable", icon: FiPlus },
        { name: "Update Table", component: "AdminUpdateTable", icon: FiEdit },
        { name: "Delete Table", component: "AdminDeleteTable", icon: FiTrash },
        {
          name: "Analytics",
          component: "TableRecommendationAnalytics",
          icon: FiTrendingUp,
        },
      ],
    },
    {
      name: "Order Management",
      icon: FiShoppingCart,
      badge: notifications > 0 ? notifications.toString() : null,
      badgeColor: "warning",
      submenu: [
        {
          name: "View Orders",
          component: "AdminOrders",
          icon: FiShoppingCart,
          route: "/admin/orders",
        },
        {
          name: "Manage Bookings",
          component: "AdminManageBookings",
          icon: FiCalendar,
        },
        {
          name: "Manage Reservations",
          component: "AdminManageReservations",
          icon: FiMapPin,
        },
      ],
    },
    {
      name: "Staff Management",
      icon: FiUsers,
      submenu: [
        { name: "Staff List", component: "StaffManagement", icon: FiUsers },
        {
          name: "Shift Management",
          component: "ShiftManagement",
          icon: FiClock,
        },
      ],
    },
    {
      name: "Customer Management",
      icon: FiHeart,
      component: "AdminCustomerManagement",
    },
    {
      name: "Analytics & Reports",
      icon: FiBarChart,
      submenu: [
        {
          name: "Business Reports",
          component: "ReportingAnalytics",
          icon: FiPieChart,
        },
        {
          name: "Sentiment Analysis",
          component: "SentimentAnalysis",
          icon: FiActivity,
        },

        {
          name: "ML Evaluation",
          component: "RecommendationEvaluation",
          icon: FiStar,
        },
      ],
    },
    {
      name: "Settings",
      icon: FiSettings,
      submenu: [
        {
          name: "System Settings",
          component: "AdminSettings",
          icon: FiSettings,
        },
        {
          name: "Hotel Branding",
          component: "HotelBrandingSettings",
          icon: FiGlobe,
        },
      ],
    },
  ];

  const renderContent = () => {
    switch (selectedModule) {
      case "Dashboard":
        return <Dashboardmodule key="dashboard" />;
      case "User Profile":
        return <UserProfileManagement key="user-profile" />;
      case "AdminAddRoom":
        return <AdminAddRoom key="add-room" />;
      case "AdminViewRooms":
        return <AdminViewRooms key="view-rooms" />;
      case "AdminRoomUpdate":
        return <AdminRoomUpdate key="update-room" />;
      case "AdminDeleteRoom":
        return <AdminDeleteRoom key="delete-room" />;
      case "AdminAddTable":
        return <AdminAddTable key="add-table" />;
      case "AdminViewTables":
        return <AdminViewTables key="view-tables" />;
      case "AdminUpdateTable":
        return <AdminUpdateTable key="update-table" />;
      case "AdminDeleteTable":
        return <AdminDeleteTable key="delete-table" />;
      case "AdminManageBookings":
        return <AdminManageBookings key="manage-bookings" />;
      case "AdminManageReservations":
        return <AdminManageReservations key="manage-reservations" />;
      case "AdminCustomerManagement":
        return <AdminCustomerManagement />;
      case "Online Orders":
        return <OnlineOrderPlacement />;
      case "StaffManagement":
        return <StaffManagement />;
      case "ShiftManagement":
        return <ShiftManagement />;
      case "Menu Management":
        return <MenuManagement />;
      case "SentimentAnalysis":
        return <SentimentAnalysis />;
      case "Recommendation System":
        return <RecommendationSystem />;
      case "Reporting":
        return <ReportingAnalytics />;
      case "Settings":
      case "AdminSettings":
        return <AdminSettings />;
      case "HotelBrandingSettings":
        return <HotelBrandingSettings />;
      case "AdminOrders":
        return <AdminOrders />;
      case "AdminViewMenus":
        return <AdminViewMenus />;
      case "AdminAddMenu":
        return <AdminAddMenu />;
      case "AdminUpdateMenu":
        return <AdminUpdateMenu />;
      case "AdminDeleteMenu":
        return <AdminDeleteMenu />;
      case "TableRecommendationAnalytics":
        return <TableRecommendationAnalytics />;
      case "RecommendationEvaluation":
        return <RecommendationEvaluation />;
      case "RoomRecommendationAnalytics":
        return <RoomRecommendationAnalytics />;
      case "MenuRecommendationAnalytics":
        return <RecommendationEvaluation />;
      default:
        return <Dashboardmodule />;
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? "active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Mobile overlay clicked - closing menu");
          setIsMobileMenuOpen(false);
        }}
        style={{
          display: isMobileMenuOpen ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 998
        }}
      />

      {/* Clean Sidebar */}
      <aside
        className={`admin-sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${
          isMobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">H</div>
          {!isSidebarCollapsed && (
            <div>
              <h3 className="sidebar-title">HRMS</h3>
              <p className="sidebar-subtitle">Dashboard</p>
            </div>
          )}
          {/* Mobile Close Button */}
          {isMobile && isMobileMenuOpen && (
            <button
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: "absolute",
                right: "15px",
                top: "15px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                color: "#000000",
                cursor: "pointer",
                padding: "5px",
                borderRadius: "4px",
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isSidebarCollapsed && (
              <h6 className="nav-section-title" style={{ color: "#000000" }}>
                Main Modules
              </h6>
            )}
            <ul className="nav-list">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  selectedModule === item.name ||
                  selectedModule === item.component;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isDropdownOpen = openDropdown === item.name;

                return (
                  <React.Fragment key={item.name}>
                    <li className="nav-item">
                      <div
                        className={`nav-link ${isActive ? "active" : ""}`}
                        style={{
                          color: "#000000 !important",
                          textDecoration: "none",
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = "#000000";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = "#000000";
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (hasSubmenu) {
                            toggleDropdown(item.name);
                          } else {
                            const newModule = item.component || item.name;
                            changeModule(newModule);

                            // Close mobile menu and any open dropdowns
                            if (isMobile) {
                              setIsMobileMenuOpen(false);
                            }
                            setOpenDropdown(null);
                          }
                        }}
                      >
                        <IconComponent
                          className="nav-icon"
                          style={{ color: "#000000 !important" }}
                          onMouseEnter={(e) => {
                            e.target.style.color = "#000000";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = "#000000";
                          }}
                        />
                        {!isSidebarCollapsed && (
                          <>
                            <span style={{ color: "#000000 !important" }}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="nav-badge">{item.badge}</span>
                            )}
                            {hasSubmenu && (
                              <FiChevronDown
                                className={`nav-chevron ${
                                  isDropdownOpen ? "open" : ""
                                }`}
                                style={{ color: "#000000 !important" }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = "#000000";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = "#000000";
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {isSidebarCollapsed && (
                        <div className="menu-tooltip">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span
                              className={`tooltip-badge ${
                                item.badgeColor || "primary"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </li>

                    {hasSubmenu && isDropdownOpen && !isSidebarCollapsed && (
                      <ul className="nav-submenu">
                        {item.submenu.map((subItem) => {
                          const SubIconComponent = subItem.icon || FiGrid;
                          const isSubActive =
                            selectedModule === subItem.component;

                          return (
                            <li key={subItem.name} className="nav-item">
                              <div
                                className={`nav-link submenu-link ${
                                  isSubActive ? "active" : ""
                                }`}
                                style={{
                                  color: "#000000 !important",
                                  textDecoration: "none",
                                  cursor: "pointer",
                                  userSelect: "none"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = "#000000";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = "#000000";
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newModule = subItem.component;
                                  changeModule(newModule);

                                  // Close mobile menu and dropdowns
                                  if (isMobile) {
                                    setIsMobileMenuOpen(false);
                                  }
                                  setOpenDropdown(null);
                                }}
                              >
                                <SubIconComponent
                                  className="nav-icon"
                                  style={{ color: "#000000 !important" }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = "#000000";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = "#000000";
                                  }}
                                />
                                <span style={{ color: "#000000 !important" }}>
                                  {subItem.name}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </React.Fragment>
                );
              })}
            </ul>
          </div>

          {/* User Menu at Bottom */}
          <div className="nav-section">
            <div className="nav-item">
              <div className="user-menu">
                <div className="user-avatar">
                  {(userName || "Admin").charAt(0).toUpperCase()}
                </div>
                {!isSidebarCollapsed && (
                  <div className="user-info">
                    <p className="user-name">{userName || "Admin"}</p>
                    <p className="user-role">ADMINISTRATOR</p>
                  </div>
                )}
              </div>
            </div>
            <div className="nav-item">
              <a
                href="#"
                className="nav-link"
                style={{
                  color: "#000000 !important",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#000000";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#000000";
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <FiLogOut
                  className="nav-icon"
                  style={{ color: "#000000 !important" }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#000000";
                  }}
                />
                {!isSidebarCollapsed && (
                  <span style={{ color: "#000000 !important" }}>Logout</span>
                )}
              </a>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main
        className={`admin-main ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button
              className="header-btn"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <FiMenu />
            </button>
            <div>
              <h1 className="header-title">Hi, Admin!</h1>
              <p className="header-subtitle">Welcome to your dashboard</p>
              <div style={{
                background: "yellow",
                padding: "5px",
                fontSize: "12px",
                marginTop: "5px",
                borderRadius: "4px",
                color: "black"
              }}>
                Current Module: {selectedModule} | Force Update: {forceUpdate}
              </div>
            </div>
          </div>

          <div className="header-right">
            {/* Hide search and notifications on mobile for cleaner look */}
            {!isMobile && (
              <>
                <div className="header-search">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Global search..."
                    className="search-input"
                  />
                </div>

                <div className="header-actions">
                  <button className="header-btn">
                    <FiBell />
                  </button>
                  <button className="header-btn">
                    <FiMail />
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div
          className="admin-content"
          key={`${selectedModule}-${forceUpdate}`}

        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
