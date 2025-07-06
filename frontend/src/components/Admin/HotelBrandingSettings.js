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
    },
    branding: {
      logo: {
        primary: '',
        secondary: '',
        loginLogo: '',
        favicon: ''
      },
      colors: {
        primary: '#64ffda',
        secondary: '#0A192F',
        accent: '#ffffff'
      }
    }
  });

  const [logoUploading, setLogoUploading] = useState({
    primary: false,
    secondary: false,
    loginLogo: false,
    favicon: false
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
          },
          branding: {
            logo: {
              primary: data.branding?.logo?.primary || '',
              secondary: data.branding?.logo?.secondary || '',
              loginLogo: data.branding?.logo?.loginLogo || '',
              favicon: data.branding?.logo?.favicon || ''
            },
            colors: {
              primary: data.branding?.colors?.primary || '#64ffda',
              secondary: data.branding?.colors?.secondary || '#0A192F',
              accent: data.branding?.colors?.accent || '#ffffff'
            }
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

  // Handle logo upload with multiple fallback methods
  const handleLogoUpload = async (logoType, file) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Please use an image smaller than 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    setLogoUploading(prev => ({ ...prev, [logoType]: true }));

    try {
      // Show initial upload message
      toast.info('Uploading logo... This may take a moment.');

      const result = await hotelSettingsService.uploadLogo(file, logoType);

      if (result.success) {
        // Update the settings state with the new logo URL
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            logo: {
              ...prev.branding.logo,
              [logoType]: result.data.logoUrl
            }
          }
        }));

        toast.success(result.message || `${logoType} logo uploaded successfully!`);

        // Refresh the context to update all components
        await loadSettings(true);

        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('hotelSettingsChanged', {
          detail: { settings: result.data }
        }));
      } else {
        toast.error(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Upload failed. Please try again or use a direct image URL.');
    } finally {
      setLogoUploading(prev => ({ ...prev, [logoType]: false }));
    }
  };

  // Handle logo URL input change
  const handleLogoUrlChange = (logoType, url) => {
    setSettings(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        logo: {
          ...prev.branding.logo,
          [logoType]: url
        }
      }
    }));
  };

  // Handle color change
  const handleColorChange = (colorType, color) => {
    setSettings(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        colors: {
          ...prev.branding.colors,
          [colorType]: color
        }
      }
    }));
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

      {/* Branding Settings */}
      <div className="simple-table-container" style={{ marginTop: '30px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, color: '#000000' }}>Branding & Logo Settings</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <form className="simple-form">
            {/* Logo Upload Section */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#000000', marginBottom: '10px' }}>Logo Management</h4>
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <strong>Upload Methods:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>🔄 <strong>Auto Upload:</strong> Upload files directly (uses multiple fallback methods)</li>
                  <li>🔗 <strong>URL Method:</strong> Paste image URLs from Cloudinary, AWS S3, or any public hosting</li>
                  <li>📱 <strong>Quick Tip:</strong> For production, we recommend using image hosting services</li>
                </ul>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                  Supported formats: JPG, PNG, GIF, WebP (Max size: 5MB)
                </div>
              </div>

              {/* Primary Logo */}
              <div className="simple-form-row" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Primary Logo (Header)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="url"
                      value={settings.branding.logo.primary}
                      onChange={(e) => handleLogoUrlChange('primary', e.target.value)}
                      placeholder="Enter logo URL or upload file"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('primary', e.target.files[0])}
                      style={{ display: 'none' }}
                      id="primary-logo-upload"
                    />
                    <label
                      htmlFor="primary-logo-upload"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: logoUploading.primary ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: logoUploading.primary ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        marginRight: '10px'
                      }}
                    >
                      {logoUploading.primary ? 'Uploading...' : '📤 Upload File'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const testUrl = 'https://via.placeholder.com/200x80/007bff/ffffff?text=HOTEL+LOGO';
                        handleLogoUrlChange('primary', testUrl);
                        toast.success('Test logo applied! You can replace it with your own.');
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🧪 Test Logo
                    </button>
                  </div>
                  {settings.branding.logo.primary && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={settings.branding.logo.primary}
                        alt="Primary Logo Preview"
                        style={{ maxHeight: '50px', maxWidth: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Login Logo */}
              <div className="simple-form-row" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Login Page Logo
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="url"
                      value={settings.branding.logo.loginLogo}
                      onChange={(e) => handleLogoUrlChange('loginLogo', e.target.value)}
                      placeholder="Enter login logo URL or upload file"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('loginLogo', e.target.files[0])}
                      style={{ display: 'none' }}
                      id="login-logo-upload"
                    />
                    <label
                      htmlFor="login-logo-upload"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: logoUploading.loginLogo ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: logoUploading.loginLogo ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        marginRight: '10px'
                      }}
                    >
                      {logoUploading.loginLogo ? 'Uploading...' : '📤 Upload File'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const testUrl = 'https://via.placeholder.com/150x150/8b5cf6/ffffff?text=LOGIN';
                        handleLogoUrlChange('loginLogo', testUrl);
                        toast.success('Test login logo applied!');
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🧪 Test Logo
                    </button>
                  </div>
                  {settings.branding.logo.loginLogo && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={settings.branding.logo.loginLogo}
                        alt="Login Logo Preview"
                        style={{ maxHeight: '50px', maxWidth: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Logo */}
              <div className="simple-form-row" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Secondary Logo (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="url"
                      value={settings.branding.logo.secondary}
                      onChange={(e) => handleLogoUrlChange('secondary', e.target.value)}
                      placeholder="Enter secondary logo URL or upload file"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('secondary', e.target.files[0])}
                      style={{ display: 'none' }}
                      id="secondary-logo-upload"
                    />
                    <label
                      htmlFor="secondary-logo-upload"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: logoUploading.secondary ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: logoUploading.secondary ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {logoUploading.secondary ? 'Uploading...' : 'Upload'}
                    </label>
                  </div>
                  {settings.branding.logo.secondary && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={settings.branding.logo.secondary}
                        alt="Secondary Logo Preview"
                        style={{ maxHeight: '50px', maxWidth: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Colors Section */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#000000', marginBottom: '20px' }}>Brand Colors</h4>

              <div className="simple-form-row">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={settings.branding.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    style={{ width: '100px', height: '40px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={settings.branding.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    style={{ width: '100px', height: '40px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ marginBottom: '5px', color: '#000000', fontWeight: 'bold' }}>
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={settings.branding.colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    style={{ width: '100px', height: '40px' }}
                  />
                </div>
              </div>
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
