import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useHotelSettings } from "../../contexts/HotelSettingsContext";
import hotelSettingsService from "../../services/hotelSettingsService";
import "./simple-admin.css";

const HotelBrandingSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { settings: contextSettings, loadSettings } = useHotelSettings();

  const [settings, setSettings] = useState({
    hotelName: '',
    hotelSubtitle: '',
    description: '',
    contact: {
      phone: {
        primary: '',
        whatsapp: '',
        secondary: ''
      },
      email: {
        primary: '',
        support: '',
        reservations: ''
      },
      address: {
        street: '',
        city: '',
        country: '',
        fullAddress: ''
      },
      website: ''
    }
  });

  // Load current settings from the database
  const loadCurrentSettings = async () => {
    try {
      setInitialLoading(true);
      const result = await hotelSettingsService.getPublicSettings();

      if (result.success && result.data) {
        const data = result.data;
        setSettings({
          hotelName: data.hotelName || '',
          hotelSubtitle: data.hotelSubtitle || '',
          description: data.description || '',
          contact: {
            phone: {
              primary: data.contact?.phone?.primary || '',
              whatsapp: data.contact?.phone?.whatsapp || '',
              secondary: data.contact?.phone?.secondary || ''
            },
            email: {
              primary: data.contact?.email?.primary || '',
              support: data.contact?.email?.support || '',
              reservations: data.contact?.email?.reservations || ''
            },
            address: {
              street: data.contact?.address?.street || '',
              city: data.contact?.address?.city || '',
              country: data.contact?.address?.country || '',
              fullAddress: data.contact?.address?.fullAddress || ''
            },
            website: data.contact?.website || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading hotel settings:', error);
      toast.error('Failed to load current settings');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      toast.error("Please login as admin to access this page");
      navigate("/login");
      return;
    }

    // Load current settings
    loadCurrentSettings();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like 'contact.phone.primary'
      const fieldParts = field.split('.');
      setSettings(prev => {
        const newSettings = { ...prev };
        let current = newSettings;

        // Navigate to the parent object
        for (let i = 0; i < fieldParts.length - 1; i++) {
          if (!current[fieldParts[i]]) {
            current[fieldParts[i]] = {};
          }
          current = current[fieldParts[i]];
        }

        // Set the final value
        current[fieldParts[fieldParts.length - 1]] = value;
        return newSettings;
      });
    } else {
      // Handle top-level fields
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!settings.hotelName.trim()) {
      toast.error('Hotel name is required');
      return;
    }

    if (!settings.contact.phone.primary.trim()) {
      toast.error('Primary phone number is required');
      return;
    }

    if (!settings.contact.email.primary.trim()) {
      toast.error('Primary email is required');
      return;
    }

    setLoading(true);
    try {
      // Update hotel settings via API
      const result = await hotelSettingsService.updateSettings(settings);

      if (result.success) {
        toast.success('Hotel settings saved successfully!');

        // Refresh the context to update all components
        await loadSettings(true);

        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('hotelSettingsChanged', {
          detail: { settings: result.data }
        }));
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving hotel settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="simple-admin-container"><p>Loading current settings...</p></div>;

  return (
    <div className="simple-admin-container">
      <div className="simple-admin-header">
        <h1>Hotel Settings</h1>
        <p>Manage your hotel's basic information and contact details</p>
      </div>

      <div className="simple-admin-controls">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="simple-btn simple-btn-primary"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="simple-table-container">
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#000000' }}>Basic Hotel Information</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <form className="simple-form">
            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Hotel Name *
                </label>
                <input
                  type="text"
                  value={settings.hotelName}
                  onChange={(e) => handleInputChange('hotelName', e.target.value)}
                  placeholder="Enter hotel name"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Hotel Subtitle
                </label>
                <input
                  type="text"
                  value={settings.hotelSubtitle}
                  onChange={(e) => handleInputChange('hotelSubtitle', e.target.value)}
                  placeholder="Enter hotel subtitle"
                />
              </div>
            </div>

            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  value={settings.contact.phone.primary}
                  onChange={(e) => handleInputChange('contact.phone.primary', e.target.value)}
                  placeholder="Enter primary phone number"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={settings.contact.phone.whatsapp}
                  onChange={(e) => handleInputChange('contact.phone.whatsapp', e.target.value)}
                  placeholder="Enter WhatsApp number"
                />
              </div>
            </div>

            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  value={settings.contact.phone.secondary}
                  onChange={(e) => handleInputChange('contact.phone.secondary', e.target.value)}
                  placeholder="Enter secondary phone number"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={settings.contact.website}
                  onChange={(e) => handleInputChange('contact.website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>
            </div>

            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Primary Email *
                </label>
                <input
                  type="email"
                  value={settings.contact.email.primary}
                  onChange={(e) => handleInputChange('contact.email.primary', e.target.value)}
                  placeholder="Enter primary email"
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.contact.email.support}
                  onChange={(e) => handleInputChange('contact.email.support', e.target.value)}
                  placeholder="Enter support email"
                />
              </div>
            </div>

            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Reservations Email
                </label>
                <input
                  type="email"
                  value={settings.contact.email.reservations}
                  onChange={(e) => handleInputChange('contact.email.reservations', e.target.value)}
                  placeholder="Enter reservations email"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  City
                </label>
                <input
                  type="text"
                  value={settings.contact.address.city}
                  onChange={(e) => handleInputChange('contact.address.city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div className="simple-form-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={settings.contact.address.street}
                  onChange={(e) => handleInputChange('contact.address.street', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                  Country
                </label>
                <input
                  type="text"
                  value={settings.contact.address.country}
                  onChange={(e) => handleInputChange('contact.address.country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                Complete Address
              </label>
              <input
                type="text"
                value={settings.contact.address.fullAddress}
                onChange={(e) => handleInputChange('contact.address.fullAddress', e.target.value)}
                placeholder="Enter complete hotel address"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                Hotel Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter hotel description"
                rows="4"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="simple-table-container" style={{ marginTop: '30px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#000000' }}>Current Settings Summary</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#000000', margin: '0 0 10px 0' }}>Hotel Information</h4>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Name:</strong> {settings.hotelName}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Subtitle:</strong> {settings.hotelSubtitle}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Website:</strong> {settings.contact.website}</p>
            </div>

            <div>
              <h4 style={{ color: '#000000', margin: '0 0 10px 0' }}>Contact Information</h4>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Primary Phone:</strong> {settings.contact.phone.primary}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>WhatsApp:</strong> {settings.contact.phone.whatsapp}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Secondary Phone:</strong> {settings.contact.phone.secondary}</p>
            </div>

            <div>
              <h4 style={{ color: '#000000', margin: '0 0 10px 0' }}>Email Addresses</h4>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Primary:</strong> {settings.contact.email.primary}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Support:</strong> {settings.contact.email.support}</p>
              <p style={{ color: '#000000', margin: '5px 0' }}><strong>Reservations:</strong> {settings.contact.email.reservations}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#000000', margin: '0 0 10px 0' }}>Address</h4>
            <p style={{ color: '#000000', margin: '5px 0' }}><strong>Street:</strong> {settings.contact.address.street}</p>
            <p style={{ color: '#000000', margin: '5px 0' }}><strong>City:</strong> {settings.contact.address.city}</p>
            <p style={{ color: '#000000', margin: '5px 0' }}><strong>Country:</strong> {settings.contact.address.country}</p>
            <p style={{ color: '#000000', margin: '5px 0' }}><strong>Full Address:</strong> {settings.contact.address.fullAddress}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#000000', margin: '0 0 10px 0' }}>Description</h4>
            <p style={{ color: '#000000', margin: '5px 0', lineHeight: '1.6' }}>{settings.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBrandingSettings;
