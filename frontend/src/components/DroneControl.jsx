import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Camera, CameraOff, Radio, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = "http://localhost:8000";

const DroneControl = () => {
    const [droneStatus, setDroneStatus] = useState({ is_running: false, process_id: null });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { token, user } = useAuth();

    // Fetch drone status on mount and every 5 seconds
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/drone/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDroneStatus(response.data);
        } catch (err) {
            console.error('Error fetching drone status:', err);
        }
    };

    const handleStart = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.post(`${API_URL}/drone/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(response.data.message);
            setTimeout(() => {
                fetchStatus();
                setMessage('');
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Failed to start drone inspection');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.post(`${API_URL}/drone/stop`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(response.data.message);
            setTimeout(() => {
                fetchStatus();
                setMessage('');
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Failed to stop drone inspection');
        } finally {
            setLoading(false);
        }
    };

    // Only show to admins
    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 999,
            background: 'rgba(19, 19, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            minWidth: '320px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                <Camera size={24} color="#8b5cf6" />
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600
                    }}>
                        Drone Inspection
                    </h3>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#8b8d98',
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: droneStatus.is_running ? '#10b981' : '#6b7280',
                            boxShadow: droneStatus.is_running ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
                            animation: droneStatus.is_running ? 'pulse 2s infinite' : 'none'
                        }} />
                        {droneStatus.is_running ? 'Active' : 'Inactive'}
                    </div>
                </div>
            </div>

            {/* Status Info */}
            {droneStatus.is_running && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7' }}>
                        <Radio size={16} />
                        <span>Vision Agent Running</span>
                    </div>
                    <div style={{ color: '#8b8d98', fontSize: '0.75rem', marginTop: '4px', marginLeft: '24px' }}>
                        Process ID: {droneStatus.process_id}
                    </div>
                </div>
            )}

            {/* Message */}
            {message && (
                <div style={{
                    padding: '10px 12px',
                    background: message.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.includes('success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                    color: message.includes('success') ? '#6ee7b7' : '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {message.includes('success') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {message}
                </div>
            )}

            {/* Control Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {!droneStatus.is_running ? (
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: loading ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <Camera size={18} />
                        {loading ? 'Starting...' : 'Start Inspection'}
                    </button>
                ) : (
                    <button
                        onClick={handleStop}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: loading ? 'rgba(239, 68, 68, 0.3)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <CameraOff size={18} />
                        {loading ? 'Stopping...' : 'Stop Inspection'}
                    </button>
                )}
            </div>

            {/* Info */}
            <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#8b8d98',
                lineHeight: '1.4'
            }}>
                💡 <strong style={{ color: '#a5b4fc' }}>Tip:</strong> Click "Start Inspection" to launch the vision agent. Upload railway track images to detect defects in real-time.
            </div>
        </div>
    );
};

export default DroneControl;
