import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Save, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Stations = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token, user } = useAuth();
    const [deletingId, setDeletingId] = useState(null);
    const scrollContainerRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        latitude: '',
        longitude: '',
        station_master_email: '',
        station_master_username: '',
        station_master_password: ''
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
            station_master_email: '',
            station_master_username: '',
            station_master_password: ''
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
                station_master_email: formData.station_master_email,
                station_master_username: formData.station_master_username,
                station_master_password: formData.station_master_password
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

        console.log(`[STATIONS] Requested deletion of station ${stationId} (${stationName})`);
        setError('');
        setSuccess('');
        setDeletingId(stationId);

        try {
            await axios.delete(`${API_URL}/stations/${stationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log(`[STATIONS] Success: Station ${stationId} deleted`);
            setSuccess('Station deleted successfully!');
            fetchStations();

            // Scroll internal container to top to show success message
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error(`[STATIONS] Deletion failed:`, err);
            const errorMsg = err.response?.data?.detail || 'Failed to delete station';
            setError(errorMsg);

            // Scroll internal container to top to show error message
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setDeletingId(null);
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
        <div
            ref={scrollContainerRef}
            style={{ padding: '24px', overflowY: 'auto', height: 'calc(100vh - 60px)', background: 'transparent' }}
        >
            {/* Header - Infrastructure Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        margin: 0,
                        marginBottom: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ width: '8px', height: '20px', background: 'var(--accent-blue)' }}></div>
                        INFRASTRUCTURE_NODES
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        STATION_MASTER_DATABASE // GEO_SPATIAL_SYNC: ACTIVE
                    </p>
                </div>

                {user?.role === 'Admin' && (
                    <button
                        onClick={() => {
                            setShowAddForm(true);
                            setEditingStation(null);
                            setFormData({
                                name: '',
                                code: '',
                                latitude: '',
                                longitude: '',
                                station_master_email: '',
                                station_master_username: '',
                                station_master_password: ''
                            });
                            setError('');
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid var(--accent-blue)',
                            color: 'var(--accent-blue)',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: 'var(--accent-glow)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--accent-blue)';
                            e.currentTarget.style.color = 'var(--bg-primary)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--accent-blue)';
                        }}
                    >
                        <Plus size={16} />
                        REGISTER_NEW_NODE
                    </button>
                )}
            </div>

            {/* Status Messages */}
            {success && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    background: 'rgba(0, 230, 118, 0.05)',
                    border: '1px solid var(--status-safe)',
                    color: 'var(--status-safe)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                }}>
                    LOG_MSG: {success}
                </div>
            )}

            {error && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    background: 'rgba(255, 59, 59, 0.05)',
                    border: '1px solid var(--status-critical)',
                    color: 'var(--status-critical)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                }}>
                    SYS_ERR: {error}
                </div>
            )}

            {/* Data Entry Form */}
            {(showAddForm || editingStation) && (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '32px',
                    marginBottom: '32px',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-blue)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            [PROTOCOL: {editingStation ? 'STATION_UPDATE' : 'STATION_REGISTRATION'}]
                        </h2>
                        <button
                            onClick={resetForm}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={editingStation ? handleUpdateStation : handleCreateStation}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    STATION_NAME
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., TERMINAL_A"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-mono)',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    NODE_CODE
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., TML-A"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    MASTER_AUTH_EMAIL
                                </label>
                                <input
                                    type="email"
                                    name="station_master_email"
                                    value={formData.station_master_email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="admin@railway.gov"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    LAT_COORDINATE
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="00.0000"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    LON_COORDINATE
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="00.0000"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                />
                            </div>
                        </div>

                        {!editingStation && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', padding: '24px', background: 'rgba(77, 163, 255, 0.05)', border: '1px dashed var(--border-color)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                        MASTER_IDENTIFIER (UID)
                                    </label>
                                    <input
                                        type="text"
                                        name="station_master_username"
                                        value={formData.station_master_username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="OP_LOGIN_ID"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--accent-blue)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.85rem',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                        SECURITY_ACCESS_PHRASE
                                    </label>
                                    <input
                                        type="password"
                                        name="station_master_password"
                                        value={formData.station_master_password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="••••••••"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--accent-blue)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.85rem',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '12px 32px',
                                    background: 'transparent',
                                    border: '1px solid var(--text-secondary)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase'
                                }}
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 32px',
                                    background: 'var(--accent-blue)',
                                    border: 'none',
                                    color: 'var(--bg-primary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 900,
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase'
                                }}
                            >
                                <Save size={16} />
                                {editingStation ? 'COMMIT_CHANGES' : 'EXECUTE_REGISTRATION'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stations Data Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>CODE</th>
                            <th>STATION_NAME</th>
                            <th>LAT_COORDINATE</th>
                            <th>LON_COORDINATE</th>
                            <th>SECURE_AUTH_EMAIL</th>
                            {user?.role === 'Admin' && <th style={{ width: '120px', textAlign: 'right' }}>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {stations.map(station => (
                            <tr key={station.id}>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        background: 'rgba(77, 163, 255, 0.1)',
                                        border: '1px solid var(--accent-blue)',
                                        color: 'var(--accent-blue)',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {station.code}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{station.name.toUpperCase()}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{station.latitude.toFixed(6)}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{station.longitude.toFixed(6)}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{station.station_master_email}</td>
                                {user?.role === 'Admin' && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => startEdit(station)}
                                                style={{
                                                    padding: '6px',
                                                    background: 'transparent',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--accent-blue)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                                title="EDIT_NODE"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStation(station.id, station.name)}
                                                disabled={deletingId === station.id}
                                                style={{
                                                    padding: '6px',
                                                    background: deletingId === station.id ? 'rgba(255, 59, 59, 0.1)' : 'transparent',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--status-critical)',
                                                    cursor: deletingId === station.id ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    opacity: deletingId === station.id ? 0.7 : 1
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--status-critical)'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                                title="DELETE_NODE"
                                            >
                                                {deletingId === station.id ? (
                                                    <div style={{ width: '14px', height: '14px', border: '2px solid' }} className="spinner"></div>
                                                ) : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {stations.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    color: 'var(--text-secondary)',
                    border: '1px dashed var(--border-color)',
                    background: 'rgba(18, 26, 47, 0.2)'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.3 }}>🚉</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        DATABASE_EMPTY: NO_STATIONS_INITIALIZED
                    </p>
                </div>
            )}
        </div>
    );
};

export default Stations;
