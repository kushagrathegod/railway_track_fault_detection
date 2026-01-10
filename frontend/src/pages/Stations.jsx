import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Save, MapPin } from 'lucide-react';

const API_URL = "http://localhost:8000";

const Stations = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        latitude: '',
        longitude: '',
        station_master_email: ''
    });

    // Fetch stations
    const fetchStations = async () => {
        try {
            const res = await axios.get(`${API_URL}/stations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStations(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching stations:', err);
            setError('Failed to load stations');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStations();
    }, [token]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            latitude: '',
            longitude: '',
            station_master_email: ''
        });
        setShowAddForm(false);
        setEditingStation(null);
        setError('');
    };

    // Create new station
    const handleCreateStation = async (e) => {
        e.preventDefault();
        console.log('Form submitted, creating station...');
        console.log('Form data:', formData);
        setError('');
        setSuccess('');

        try {
            console.log('Sending POST request to:', `${API_URL}/stations`);
            console.log('With data:', {
                name: formData.name,
                code: formData.code,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                station_master_email: formData.station_master_email
            });

            const response = await axios.post(`${API_URL}/stations`, {
                name: formData.name,
                code: formData.code,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                station_master_email: formData.station_master_email
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Station created successfully:', response.data);
            setSuccess('Station created successfully!');
            resetForm();
            fetchStations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error creating station:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.detail || 'Failed to create station');
        }
    };

    // Update station
    const handleUpdateStation = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const updateData = {};
            if (formData.name) updateData.name = formData.name;
            if (formData.code) updateData.code = formData.code;
            if (formData.latitude) updateData.latitude = parseFloat(formData.latitude);
            if (formData.longitude) updateData.longitude = parseFloat(formData.longitude);
            if (formData.station_master_email) updateData.station_master_email = formData.station_master_email;

            await axios.put(`${API_URL}/stations/${editingStation.id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Station updated successfully!');
            resetForm();
            fetchStations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update station');
        }
    };

    // Delete station
    const handleDeleteStation = async (stationId, stationName) => {
        if (!window.confirm(`Are you sure you want to delete "${stationName}"? This action cannot be undone.`)) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await axios.delete(`${API_URL}/stations/${stationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Station deleted successfully!');
            fetchStations();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete station');
        }
    };

    // Start editing
    const startEdit = (station) => {
        setEditingStation(station);
        setFormData({
            name: station.name,
            code: station.code,
            latitude: station.latitude.toString(),
            longitude: station.longitude.toString(),
            station_master_email: station.station_master_email
        });
        setShowAddForm(false);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading stations...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '30px', overflowY: 'auto', height: 'calc(100vh - 70px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🚉 Railway Stations
                </h1>

                <button
                    onClick={() => {
                        console.log('Add New Station button clicked');
                        setShowAddForm(true);
                        setEditingStation(null);
                        // Reset form data without calling resetForm (which would set showAddForm to false)
                        setFormData({
                            name: '',
                            code: '',
                            latitude: '',
                            longitude: '',
                            station_master_email: ''
                        });
                        setError('');
                        console.log('showAddForm state should now be true');
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
                    }}
                >
                    <Plus size={18} />
                    Add New Station
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div style={{
                    padding: '14px 18px',
                    marginBottom: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    color: '#6ee7b7',
                    fontSize: '0.9rem'
                }}>
                    ✓ {success}
                </div>
            )}

            {error && (
                <div style={{
                    padding: '14px 18px',
                    marginBottom: '20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    color: '#fca5a5',
                    fontSize: '0.9rem'
                }}>
                    ✗ {error}
                </div>
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingStation) && (
                <div style={{
                    background: 'rgba(19, 19, 26, 0.9)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '16px',
                    padding: '30px',
                    marginBottom: '30px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem' }}>
                            {editingStation ? 'Edit Station' : 'Add New Station'}
                        </h2>
                        <button
                            onClick={resetForm}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={editingStation ? handleUpdateStation : handleCreateStation}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#c8cad3' }}>
                                    Station Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., New Delhi"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(10, 10, 15, 0.6)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontFamily: 'Space Grotesk, sans-serif'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#c8cad3' }}>
                                    Station Code *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., NDLS"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(10, 10, 15, 0.6)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontFamily: 'Space Grotesk, sans-serif',
                                        textTransform: 'uppercase'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#c8cad3' }}>
                                    Latitude *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 28.6410"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(10, 10, 15, 0.6)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontFamily: 'Space Grotesk, sans-serif'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#c8cad3' }}>
                                    Longitude *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., 77.2197"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(10, 10, 15, 0.6)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontFamily: 'Space Grotesk, sans-serif'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#c8cad3' }}>
                                Station Master Email *
                            </label>
                            <input
                                type="email"
                                name="station_master_email"
                                value={formData.station_master_email}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., stationmaster@railway.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(10, 10, 15, 0.6)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontFamily: 'Space Grotesk, sans-serif'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '12px 24px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: '#c8cad3',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Save size={18} />
                                {editingStation ? 'Update Station' : 'Create Station'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {stations.map(station => (
                    <div
                        key={station.id}
                        style={{
                            background: 'rgba(19, 19, 26, 0.7)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '16px',
                            padding: '24px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif', color: 'white' }}>
                                    {station.name}
                                </h3>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                    borderRadius: '6px',
                                    color: '#06b6d4',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    fontFamily: 'monospace'
                                }}>
                                    {station.code}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => startEdit(station)}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '8px',
                                        color: '#8b5cf6',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title="Edit station"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteStation(station.id, station.name)}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title="Delete station"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#8b8d98' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <MapPin size={16} color="#06b6d4" />
                                <span>{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</span>
                            </div>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#06b6d4', marginBottom: '4px' }}>
                                    Station Master
                                </div>
                                <div style={{ color: '#c8cad3', wordBreak: 'break-all' }}>
                                    {station.station_master_email}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {stations.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#8b8d98',
                    fontSize: '1.1rem'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚉</div>
                    No stations found. Click "Add New Station" to get started.
                </div>
            )}
        </div>
    );
};

export default Stations;
