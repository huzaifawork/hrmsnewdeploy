import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiSettings, FiSave, FiRefreshCw, FiGlobe, FiMail, FiPhone,
  FiMapPin, FiUsers, FiStar, FiEdit, FiEye, FiCheck, FiX,
  FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube,
  FiClock, FiCalendar, FiHome, FiInfo, FiImage, FiType
} from 'react-icons/fi';
import { useHotelSettings } from '../../contexts/HotelSettingsContext';
import './AdminManageRooms.css';

const HotelBrandingSettings = () => {
  const navigate = useNavigate();
  const {
    settings,
    loading,
    error,
    adminMode,
    updateSettings,
    updateSection,
    resetSettings,
    loadSettings
  } = useHotelSettings();

  const [localSettings, setLocalSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      toast.error("Please login as admin to access this page");
      navigate("/login");
      return;
    }

    // Load settings if not already loaded
    if (!settings) {
      loadSettings(true);
    }
  }, [navigate, settings, loadSettings]);

  // Initialize local settings when hotel settings are loaded
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings, localSettings]);

  // Handle input changes
  const handleChange = (section, field, value) => {
    if (!localSettings) return;

    const updatedSettings = { ...localSettings };
    
    if (section) {
      if (!updatedSettings[section]) {
        updatedSettings[section] = {};
      }
      
      // Handle nested objects
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        if (!updatedSettings[section][parentField]) {
          updatedSettings[section][parentField] = {};
        }
        updatedSettings[section][parentField][childField] = value;
      } else {
        updatedSettings[section][field] = value;
      }
    } else {
      updatedSettings[field] = value;
    }

    setLocalSettings(updatedSettings);
    setHasChanges(true);
  };

  // Save all settings
  const handleSave = async () => {
    if (!localSettings || !adminMode) {
      toast.error('Admin access required');
      return;
    }

    // Basic validation
    if (!localSettings.hotelName?.trim()) {
      toast.error('Hotel name is required');
      return;
    }

    setSaving(true);
    try {
      const result = await updateSettings(localSettings);
      
      if (result.success) {
        toast.success('Hotel settings saved successfully!');
        setHasChanges(false);
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !localSettings) {
    return (
      <div className="enhanced-admin-settings-module-container">
        <div className="enhanced-settings-header">
          <div className="header-content">
            <div className="title-section">
              <div className="title-wrapper">
                <div className="title-icon">
                  <FiSettings />
                </div>
                <div className="title-text">
                  <h1 className="page-title">Loading Hotel Settings...</h1>
                  <p className="page-subtitle">Please wait while we load your hotel information</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-admin-settings-module-container">
      <div className="enhanced-settings-header">
        <div className="header-content">
          <div className="title-section">
            <div className="title-wrapper">
              <div className="title-icon">
                <FiSettings />
              </div>
              <div className="title-text">
                <h1 className="page-title">Hotel Branding Settings</h1>
                <p className="page-subtitle">Manage your hotel's branding, contact information, and content</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`enhanced-btn enhanced-btn-primary ${hasChanges ? 'pulse' : ''}`}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              title="Save all changes"
            >
              {saving ? <FiRefreshCw className="spinning" /> : <FiSave />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
        {hasChanges && (
          <div className="changes-indicator">
            <FiInfo />
            You have unsaved changes. Don't forget to save!
          </div>
        )}
      </div>
      <div className="enhanced-settings-content">
        <div className="content-container">
          <div className="settings-layout">
            <div className="settings-nav">
              <div className="nav-header">
                <h3>Settings Categories</h3>
              </div>
              <div className="nav-items">
                <button
                  className={`nav-item ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  <FiHome className="nav-icon" />
                  <span>Basic Info</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'branding' ? 'active' : ''}`}
                  onClick={() => setActiveTab('branding')}
                >
                  <FiImage className="nav-icon" />
                  <span>Branding</span>
                </button>
                <button
                  className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  <FiPhone className="nav-icon" />
                  <span>Contact</span>
                </button>
              </div>
            </div>
            <div className="settings-content">
              {activeTab === 'branding' && (
                <div className="settings-section">
                  <div className="section-header">
                    <h2>Logo & Branding</h2>
                    <p>Manage your hotel's visual identity and branding assets</p>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiImage className="label-icon" />
                        Primary Logo URL
                      </label>
                      <input
                        type="url"
                        className="enhanced-input"
                        value={localSettings.branding?.logo?.primary || ''}
                        onChange={(e) => handleChange('branding', 'logo.primary', e.target.value)}
                        placeholder="Enter primary logo URL"
                      />
                      <small className="input-help">Main logo displayed in header and navigation</small>
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiImage className="label-icon" />
                        Login Logo URL
                      </label>
                      <input
                        type="url"
                        className="enhanced-input"
                        value={localSettings.branding?.logo?.loginLogo || ''}
                        onChange={(e) => handleChange('branding', 'logo.loginLogo', e.target.value)}
                        placeholder="Enter login page logo URL"
                      />
                      <small className="input-help">Logo displayed on login and authentication pages</small>
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiImage className="label-icon" />
                        Secondary Logo URL
                      </label>
                      <input
                        type="url"
                        className="enhanced-input"
                        value={localSettings.branding?.logo?.secondary || ''}
                        onChange={(e) => handleChange('branding', 'logo.secondary', e.target.value)}
                        placeholder="Enter secondary logo URL"
                      />
                      <small className="input-help">Alternative logo for different contexts</small>
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiImage className="label-icon" />
                        Favicon URL
                      </label>
                      <input
                        type="url"
                        className="enhanced-input"
                        value={localSettings.branding?.logo?.favicon || ''}
                        onChange={(e) => handleChange('branding', 'logo.favicon', e.target.value)}
                        placeholder="Enter favicon URL"
                      />
                      <small className="input-help">Small icon displayed in browser tabs</small>
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiType className="label-icon" />
                        Primary Color
                      </label>
                      <input
                        type="color"
                        className="enhanced-input"
                        value={localSettings.branding?.colors?.primary || '#64ffda'}
                        onChange={(e) => handleChange('branding', 'colors.primary', e.target.value)}
                      />
                      <small className="input-help">Main brand color used throughout the application</small>
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiType className="label-icon" />
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        className="enhanced-input"
                        value={localSettings.branding?.colors?.secondary || '#0A192F'}
                        onChange={(e) => handleChange('branding', 'colors.secondary', e.target.value)}
                      />
                      <small className="input-help">Secondary brand color for backgrounds and accents</small>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'basic' && (
                <div className="settings-section">
                  <div className="section-header">
                    <h2>Basic Hotel Information</h2>
                    <p>Configure your hotel's basic details and branding</p>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiHome className="label-icon" />
                        Hotel Name *
                      </label>
                      <input
                        type="text"
                        className="enhanced-input"
                        value={localSettings.hotelName || ''}
                        onChange={(e) => handleChange(null, 'hotelName', e.target.value)}
                        placeholder="Enter hotel name"
                        required
                      />
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiType className="label-icon" />
                        Hotel Subtitle
                      </label>
                      <input
                        type="text"
                        className="enhanced-input"
                        value={localSettings.hotelSubtitle || ''}
                        onChange={(e) => handleChange(null, 'hotelSubtitle', e.target.value)}
                        placeholder="Enter hotel subtitle"
                      />
                    </div>
                    <div className="setting-group full-width">
                      <label className="setting-label">
                        <FiInfo className="label-icon" />
                        Hotel Description
                      </label>
                      <textarea
                        className="enhanced-textarea"
                        rows="4"
                        value={localSettings.description || ''}
                        onChange={(e) => handleChange(null, 'description', e.target.value)}
                        placeholder="Enter hotel description"
                      />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'contact' && (
                <div className="settings-section">
                  <div className="section-header">
                    <h2>Contact Information</h2>
                    <p>Manage your hotel's contact details and address</p>
                  </div>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiPhone className="label-icon" />
                        Primary Phone *
                      </label>
                      <input
                        type="tel"
                        className="enhanced-input"
                        value={localSettings.contact?.phone?.primary || ''}
                        onChange={(e) => handleChange('contact', 'phone.primary', e.target.value)}
                        placeholder="Enter primary phone"
                        required
                      />
                    </div>
                    <div className="setting-group">
                      <label className="setting-label">
                        <FiMail className="label-icon" />
                        Primary Email *
                      </label>
                      <input
                        type="email"
                        className="enhanced-input"
                        value={localSettings.contact?.email?.primary || ''}
                        onChange={(e) => handleChange('contact', 'email.primary', e.target.value)}
                        placeholder="Enter primary email"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBrandingSettings;
