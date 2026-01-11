import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, Upload, Video, Image as ImageIcon, AlertCircle, CheckCircle2, Loader, Activity, MapPin, Play, Square, Shield, Zap, Database, Cpu, Clock } from 'lucide-react';

const API_URL = "http://localhost:8000";

const DronePage = () => {
    const { token } = useAuth();
    const { theme } = useTheme();
    // Inspection flow state
    const [inspectionStarted, setInspectionStarted] = useState(false);
    const [mode, setMode] = useState(null); // 'camera' or 'upload'
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // Camera refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturing, setCapturing] = useState(false);

    // Upload refs
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Location state
    const [useDefaultLocation, setUseDefaultLocation] = useState(true);
    const [latitude, setLatitude] = useState(28.6139);  // Default: New Delhi
    const [longitude, setLongitude] = useState(77.2090);
    const [liveLocation, setLiveLocation] = useState({ lat: 28.6139, lon: 77.2090, label: 'Default (New Delhi)' });

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Start camera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            setStream(mediaStream);
            setMode('camera');
            setError('');

            // Get browser location for live feed
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    setLiveLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        label: 'Auto-detected'
                    });
                }, (err) => {
                    console.warn("Geolocation error:", err);
                    setLiveLocation({
                        lat: 28.6139,
                        lon: 77.2090,
                        label: 'Default fallback (New Delhi)'
                    });
                });
            }
        } catch (err) {
            setError('Failed to access camera. Please grant camera permissions.');
            console.error('Camera error:', err);
        }
    };

    // Bind stream to video element when stream or mode changes
    useEffect(() => {
        if (mode === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    // Auto-analysis state
    const [autoAnalyze, setAutoAnalyze] = useState(false);
    const analysisIntervalRef = useRef(null);

    // Auto-analysis interval
    useEffect(() => {
        if (autoAnalyze && mode === 'camera') {
            analysisIntervalRef.current = setInterval(() => {
                if (!processing && !capturing) {
                    captureFrame();
                }
            }, 3000); // Analyze every 3 seconds
        } else {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
        }

        return () => {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
        };
    }, [autoAnalyze, mode, processing, capturing]);

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setMode(null);
        setCapturing(false);
        setAutoAnalyze(false);
    };

    // Capture and process frame
    const captureFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setCapturing(true);
        setProcessing(true);
        setError('');
        // Don't clear result if auto-analyzing to avoid flickering
        if (!autoAnalyze) setResult(null);

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to blob
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');

            // Add location data
            const params = new URLSearchParams();
            if (mode === 'camera') {
                // Always use live location for camera
                params.append('latitude', liveLocation.lat);
                params.append('longitude', liveLocation.lon);
            } else if (!useDefaultLocation) {
                // Use manual input for upload mode if not using default
                params.append('latitude', latitude);
                params.append('longitude', longitude);
            }

            try {
                const response = await axios.post(
                    `${API_URL}/upload-analyze?${params.toString()}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                setResult(response.data);
                if (response.data.severity === 'Critical') {
                    canvas.style.border = '4px solid #ef4444';
                    setTimeout(() => canvas.style.border = 'none', 1000);
                }
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to process frame');
            } finally {
                setProcessing(false);
                setTimeout(() => setCapturing(false), 2000);
            }
        }, 'image/jpeg', 0.95);
    };

    // Handle image upload
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMode('upload');
            setError('');
            setResult(null);
        }
    };

    // Process uploaded image
    const processUploadedImage = async () => {
        if (!selectedImage) return;

        setProcessing(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('file', selectedImage);

        // Add location data if manual mode
        const params = new URLSearchParams();
        if (!useDefaultLocation) {
            params.append('latitude', latitude);
            params.append('longitude', longitude);
        }

        try {
            const response = await axios.post(
                `${API_URL}/upload-analyze?${params.toString()}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process image');
        } finally {
            setProcessing(false);
        }
    };

    // Reset
    const reset = () => {
        stopCamera();
        setSelectedImage(null);
        setPreviewUrl(null);
        setResult(null);
        setError('');
        setMode(null);
        setInspectionStarted(false);
    };

    return (
        <div style={{ padding: '24px', height: 'calc(100vh - 60px)', overflow: 'auto', background: 'transparent' }}>
            {/* Header - Industrial Control Style */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
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
                        AI SURVEILLANCE MODULE [S-7]
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        REAL-TIME ANOMALY DETECTION ENGINE // SECURE_LINK_ESTABLISHED
                    </p>
                </div>

                {inspectionStarted && (
                    <button
                        onClick={reset}
                        style={{
                            padding: '10px 20px',
                            background: 'transparent',
                            border: '1px solid var(--status-critical)',
                            color: 'var(--status-critical)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--status-critical)', e.currentTarget.style.color = 'var(--bg-primary)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--status-critical)')}
                    >
                        <Square size={14} fill="currentColor" />
                        TERMINATE_SESSION
                    </button>
                )}
            </div>

            {/* Location Configuration - Only shown for upload */}
            {mode === 'upload' && (
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto 30px',
                    background: 'rgba(19, 19, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '1.1rem',
                        fontFamily: 'Outfit, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📍 Location Configuration
                    </h3>

                    {/* Location Mode Toggle */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setUseDefaultLocation(true)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    background: useDefaultLocation ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(99, 102, 241, 0.1)',
                                    border: `1px solid ${useDefaultLocation ? 'rgba(139, 92, 246, 0.6)' : 'rgba(99, 102, 241, 0.3)'}`,
                                    borderRadius: '10px',
                                    color: useDefaultLocation ? 'white' : '#8b8d98',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ✓ Default Location
                            </button>
                            <button
                                onClick={() => setUseDefaultLocation(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    background: !useDefaultLocation ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(99, 102, 241, 0.1)',
                                    border: `1px solid ${!useDefaultLocation ? 'rgba(139, 92, 246, 0.6)' : 'rgba(99, 102, 241, 0.3)'}`,
                                    borderRadius: '10px',
                                    color: !useDefaultLocation ? 'white' : '#8b8d98',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                📝 Manual Input
                            </button>
                        </div>
                    </div>

                    {/* Location Display/Input */}
                    {useDefaultLocation ? (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: '#cbd5e1'
                        }}>
                            <div style={{ marginBottom: '4px', color: '#8b8d98', fontSize: '0.8rem' }}>Using Default Location:</div>
                            <div style={{ fontWeight: 600 }}>📍 New Delhi, India</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#8b5cf6' }}>
                                Lat: 28.6139, Lon: 77.2090
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '0.85rem',
                                    color: '#8b8d98',
                                    fontWeight: 600
                                }}>
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={latitude}
                                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(19, 19, 26, 0.9)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="e.g., 28.6139"
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '0.85rem',
                                    color: '#8b8d98',
                                    fontWeight: 600
                                }}>
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={longitude}
                                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(19, 19, 26, 0.9)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="e.g., 77.2090"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Start Inspection Button - Center Stage with Status Cards */}
            {!inspectionStarted && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    gap: '48px'
                }}>
                    <div style={{
                        maxWidth: '900px',
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(280px, 320px) 1fr',
                        gap: '24px',
                        background: 'transparent',
                        alignItems: 'stretch'
                    }}>
                        {/* Drone Sample Video Preview - Compact Mini-Feed */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '6px'
                            }}>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Video size={12} color="var(--accent-blue)" />
                                    DRONE_SAMPLE [PREVIEW]
                                </div>
                                <div style={{
                                    fontSize: '0.55rem',
                                    padding: '2px 6px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--status-safe)',
                                    color: 'var(--status-safe)',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 800
                                }}>
                                    SIM_LIVE
                                </div>
                            </div>
                            <div style={{
                                position: 'relative',
                                background: '#000',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                aspectRatio: '16/9'
                            }}>
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'block',
                                        objectFit: 'cover'
                                    }}
                                >
                                    <source src="/drone_shot3.mp4" type="video/mp4" />
                                </video>
                                {/* Mini Overlay Elements */}
                                <div style={{ position: 'absolute', top: 5, left: 5, borderTop: '1px solid var(--accent-blue)', borderLeft: '1px solid var(--accent-blue)', width: 10, height: 10 }}></div>
                                <div style={{ position: 'absolute', top: 5, right: 5, borderTop: '1px solid var(--accent-blue)', borderRight: '1px solid var(--accent-blue)', width: 10, height: 10 }}></div>
                                <div style={{ position: 'absolute', bottom: 5, left: 5, borderBottom: '1px solid var(--accent-blue)', borderLeft: '1px solid var(--accent-blue)', width: 10, height: 10 }}></div>
                                <div style={{ position: 'absolute', bottom: 5, right: 5, borderBottom: '1px solid var(--accent-blue)', borderRight: '1px solid var(--accent-blue)', width: 10, height: 10 }}></div>
                            </div>
                            <div style={{
                                marginTop: '6px',
                                fontSize: '0.55rem',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)',
                                textAlign: 'center',
                                letterSpacing: '0.5px'
                            }}>
                                SAMPLE_FEED_ID: DSS-07
                            </div>
                        </div>

                        {/* Guidelines Section - High-End HUD Redesign (Theme-Aware) */}
                        <div style={{
                            background: theme === 'dark' ? 'rgba(5, 12, 22, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(12px)',
                            border: theme === 'dark' ? '1px solid rgba(77, 163, 255, 0.15)' : '1px solid rgba(37, 99, 235, 0.2)',
                            padding: '24px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '32px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: theme === 'light' ? '0 8px 32px rgba(0, 0, 0, 0.05)' : 'none'
                        }}>
                            {/* Decorative Corner Brackets */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, borderLeft: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, opacity: theme === 'light' ? 0.6 : 1 }}></div>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, borderRight: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, opacity: theme === 'light' ? 0.6 : 1 }}></div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, borderLeft: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, opacity: theme === 'light' ? 0.6 : 1 }}></div>
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, borderRight: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'var(--accent-blue)'}`, opacity: theme === 'light' ? 0.6 : 1 }}></div>

                            {/* Scanline Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '1px',
                                background: theme === 'dark' ? 'rgba(77, 163, 255, 0.05)' : 'rgba(37, 99, 235, 0.05)',
                                zIndex: 1,
                                pointerEvents: 'none',
                                animation: 'scanline 4s linear infinite'
                            }}></div>

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <h4 style={{
                                    color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
                                    marginBottom: '16px',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    fontWeight: 900
                                }}>
                                    <div style={{ padding: '4px', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid var(--status-warning)' }}>
                                        <Zap size={14} color="var(--status-warning)" />
                                    </div>
                                    PROTOCOL_SEC
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        'STABLE TELEMETRY LINK REQUIRED',
                                        'AI AUTO-FLAG ANOMALIES',
                                        'MODULE_S7 ENCRYPTION ACTIVE'
                                    ].map((text, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '4px', height: '4px', background: 'var(--status-warning)', boxShadow: theme === 'dark' ? '0 0 5px var(--status-warning)' : 'none' }}></div>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <h4 style={{
                                    color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
                                    marginBottom: '16px',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    fontWeight: 900
                                }}>
                                    <div style={{ padding: '4px', background: 'rgba(0, 255, 170, 0.1)', border: '1px solid var(--status-safe)' }}>
                                        <Shield size={14} color="var(--status-safe)" />
                                    </div>
                                    INTEGRITY_LOG
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        'GEO-TAGGING PER FRAME ENABLED',
                                        'MASTER ALERTS SYNCHRONIZED',
                                        'SEC_LOG REAL-TIME GENERATION'
                                    ].map((text, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '4px', height: '4px', background: 'var(--status-safe)', boxShadow: theme === 'dark' ? '0 0 5px var(--status-safe)' : 'none' }}></div>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Status Row - Restored */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        width: '100%',
                        maxWidth: '800px'
                    }}>
                        {[
                            { icon: <Cpu size={16} color="var(--accent-blue)" />, label: 'AI_ENGINE', status: 'READY' },
                            { icon: <Shield size={16} color="var(--status-safe)" />, label: 'AUTH', status: 'ACTIVE' },
                            { icon: <Database size={16} color="var(--status-warning)" />, label: 'DB_NODE', status: 'CONNECTED' },
                            { icon: <Clock size={16} color="var(--accent-blue)" />, label: 'LATENCY', status: '0.8ms' }
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{
                                    padding: '6px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{item.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={() => setInspectionStarted(true)}
                            style={{
                                padding: '16px 32px',
                                fontSize: '1rem',
                                fontWeight: 900,
                                fontFamily: 'var(--font-mono)',
                                background: 'transparent',
                                color: 'var(--accent-blue)',
                                border: '2px solid var(--accent-blue)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                boxShadow: 'var(--accent-glow)',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
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
                            <Play size={20} fill="currentColor" />
                            INITIALIZE_INSPECTION
                        </button>
                    </div>
                </div>
            )}

            {/* Mode Selection - Only shown AFTER starting and BEFORE choosing mode */}
            {inspectionStarted && !mode && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '24px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    {/* Camera Mode */}
                    <div
                        onClick={startCamera}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '48px 32px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            e.currentTarget.style.boxShadow = 'var(--accent-glow)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-blue)'
                        }}>
                            <Video size={32} />
                        </div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            LIVE_OPTICAL_FEED
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: 0, fontFamily: 'var(--font-mono)' }}>
                            ESTABLISH REAL-TIME TELEMETRY LINK
                        </p>
                    </div>

                    {/* Upload Mode */}
                    <div
                        onClick={() => document.getElementById('imageInput').click()}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '48px 32px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--status-safe)';
                            e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(0, 230, 118, 0.05)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--status-safe)'
                        }}>
                            <Upload size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STATIC_FRAME_ANALYSIS
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', margin: 0, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                            IMPORT ARCHIVED HIGH-RES IMAGERY
                        </p>
                        <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: 'transparent',
                            border: '1px solid var(--status-warning)',
                            color: 'var(--status-warning)',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)'
                        }}>
                            TEST_PROTOCOL_ONLY
                        </span>
                    </div>
                    <input
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {/* Main Content Area */}
            {mode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', height: 'calc(100% - 120px)' }}>
                    {/* Left: Video/Image Display */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border-color)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <h2 style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {mode === 'camera' ? 'OPTICAL_FEED_01 [LIVE]' : 'FRAME_PREVIEW_S7'}
                                </h2>
                                {mode === 'camera' && (
                                    <div style={{
                                        fontSize: '0.65rem',
                                        padding: '4px 10px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--accent-blue)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 800
                                    }}>
                                        <MapPin size={12} />
                                        <span>GPS: {liveLocation.lat.toFixed(6)}N, {liveLocation.lon.toFixed(6)}E</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: '1px solid var(--text-secondary)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)',
                                    textTransform: 'uppercase'
                                }}
                            >
                                BACK
                            </button>
                        </div>

                        {/* Video Feed */}
                        {mode === 'camera' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ position: 'relative', flex: 1, background: '#000', border: '1px solid var(--border-color)' }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    {/* Overlay elements for futuristic look */}
                                    <div style={{ position: 'absolute', top: 20, left: 20, borderTop: '2px solid var(--accent-blue)', borderLeft: '2px solid var(--accent-blue)', width: 40, height: 40 }}></div>
                                    <div style={{ position: 'absolute', top: 20, right: 20, borderTop: '2px solid var(--accent-blue)', borderRight: '2px solid var(--accent-blue)', width: 40, height: 40 }}></div>
                                    <div style={{ position: 'absolute', bottom: 20, left: 20, borderBottom: '2px solid var(--accent-blue)', borderLeft: '2px solid var(--accent-blue)', width: 40, height: 40 }}></div>
                                    <div style={{ position: 'absolute', bottom: 20, right: 20, borderBottom: '2px solid var(--accent-blue)', borderRight: '2px solid var(--accent-blue)', width: 40, height: 40 }}></div>

                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(77, 163, 255, 0.2)', borderRadius: '50%', width: 200, height: 200, pointerEvents: 'none' }}></div>
                                </div>
                                <canvas ref={canvasRef} style={{ display: 'none' }} />

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={captureFrame}
                                        disabled={capturing || processing}
                                        style={{
                                            flex: 2,
                                            padding: '16px',
                                            background: capturing ? 'var(--bg-primary)' : 'transparent',
                                            border: '1px solid var(--status-safe)',
                                            color: 'var(--status-safe)',
                                            fontSize: '0.85rem',
                                            fontWeight: 900,
                                            fontFamily: 'var(--font-mono)',
                                            cursor: capturing || processing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => !capturing && !processing && (e.currentTarget.style.background = 'var(--status-safe)', e.currentTarget.style.color = 'var(--bg-primary)')}
                                        onMouseOut={(e) => !capturing && !processing && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--status-safe)')}
                                    >
                                        {processing ? <Loader className="spinning" size={16} /> : <Camera size={16} />}
                                        {processing ? 'ANALYZING_FRAME...' : capturing ? 'FRAME_LOCKED' : 'CAPTURE_AND_ANALYZE'}
                                    </button>

                                    <button
                                        onClick={() => setAutoAnalyze(!autoAnalyze)}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            background: autoAnalyze ? 'var(--accent-blue)' : 'transparent',
                                            border: `1px solid var(--accent-blue)`,
                                            color: autoAnalyze ? 'var(--bg-primary)' : 'var(--accent-blue)',
                                            fontSize: '0.85rem',
                                            fontWeight: 900,
                                            fontFamily: 'var(--font-mono)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s ease',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}
                                    >
                                        <Activity size={16} className={autoAnalyze ? 'pulse' : ''} />
                                        {autoAnalyze ? 'AUTO_SCAN: ON' : 'AUTO_SCAN: OFF'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image Preview */}
                        {mode === 'upload' && previewUrl && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ flex: 1, background: '#000', border: '1px solid var(--border-color)', position: 'relative' }}>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    {/* Medical/Science Style Crosshair */}
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(77, 163, 255, 0.3)', width: 100, height: 100, borderRadius: '50%' }}></div>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: 120, width: 1, background: 'rgba(77, 163, 255, 0.2)' }}></div>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 1, background: 'rgba(77, 163, 255, 0.2)' }}></div>
                                </div>

                                <button
                                    onClick={processUploadedImage}
                                    disabled={processing}
                                    style={{
                                        padding: '16px',
                                        background: processing ? 'var(--bg-primary)' : 'transparent',
                                        border: '1px solid var(--accent-blue)',
                                        color: 'var(--accent-blue)',
                                        fontSize: '0.85rem',
                                        fontWeight: 900,
                                        fontFamily: 'var(--font-mono)',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                    onMouseOver={(e) => !processing && (e.currentTarget.style.background = 'var(--accent-blue)', e.currentTarget.style.color = 'var(--bg-primary)')}
                                    onMouseOut={(e) => !processing && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--accent-blue)')}
                                >
                                    {processing ? <Loader className="spinning" size={16} /> : <ImageIcon size={16} />}
                                    {processing ? 'EXECUTING_ENGINE...' : 'INIT_FRAME_ANALYSIS'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Results Panel */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        padding: '20px',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent-blue)', opacity: 0.3 }}></div>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            [DIAGNOSTIC_REPORT]
                        </h2>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255, 59, 59, 0.05)',
                                border: '1px solid var(--status-critical)',
                                color: 'var(--status-critical)',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                marginBottom: '20px',
                                textTransform: 'uppercase'
                            }}>
                                <AlertCircle size={14} />
                                ENGINE_ERR: {error}
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Status Badge */}
                                <div style={{
                                    padding: '16px',
                                    background: 'var(--bg-primary)',
                                    border: `1px solid ${result.status === 'defect_detected'
                                        ? 'var(--status-critical)'
                                        : result.status === 'no_defect'
                                            ? 'var(--status-safe)'
                                            : 'var(--status-warning)'}`,
                                    color: result.status === 'defect_detected'
                                        ? 'var(--status-critical)'
                                        : result.status === 'no_defect'
                                            ? 'var(--status-safe)'
                                            : 'var(--status-warning)',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    {result.status === 'defect_detected' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                    {result.status === 'defect_detected' ? 'ANOMALY_CONFIRMED' : result.status === 'no_defect' ? 'CLEAR_SCAN_OK' : 'LOW_SIGNAL_WEAK'}
                                </div>

                                {/* ML Model Info */}
                                <div style={{
                                    padding: '16px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase' }}>NEURAL_NET_PREDICTION</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{result.prediction}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                        CONFIDENCE: {result.confidence}%
                                    </div>
                                </div>

                                {/* Message for non-defects */}
                                {result.message && (
                                    <div style={{
                                        padding: '16px',
                                        background: 'rgba(18, 26, 47, 0.4)',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-mono)',
                                        lineHeight: '1.6'
                                    }}>
                                        {result.message.toUpperCase()}
                                    </div>
                                )}

                                {/* Defect Details (only if defect detected) */}
                                {result.status === 'defect_detected' && (
                                    <>
                                        {/* Defect Info */}
                                        <div style={{
                                            padding: '16px',
                                            background: result.severity === 'Critical' ? 'rgba(255, 59, 59, 0.05)' : 'var(--bg-primary)',
                                            border: `1px solid ${result.severity === 'Critical' ? 'var(--status-critical)' : 'var(--border-color)'}`
                                        }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase' }}>ANOMALY_CLASSIFICATION</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{result.defect_type}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{
                                                padding: '12px',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>SEVERITY_LEVEL</div>
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    fontWeight: 900,
                                                    fontFamily: 'var(--font-mono)',
                                                    color: result.severity === 'Critical' ? 'var(--status-critical)' : 'var(--accent-blue)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {result.severity}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '12px',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>ASSET_TAG_ID</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>#{result.id}</div>
                                            </div>
                                        </div>

                                        {/* Root Cause */}
                                        {result.root_cause && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '4px', height: '4px', background: 'currentColor' }}></div>
                                                    PRIMARY_ETIOLOGY
                                                </div>
                                                <p style={{ fontSize: '0.7rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                                                    {result.root_cause}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Required */}
                                        {result.action_required && (
                                            <div style={{ marginTop: '12px' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--status-warning)', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '4px', height: '4px', background: 'currentColor' }}></div>
                                                    REMEDIATION_PROTOCOL
                                                </div>
                                                <p style={{ fontSize: '0.7rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                                                    {result.action_required}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Placeholder */}
                        {!result && !error && (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{ padding: '20px', background: 'rgba(18, 26, 47, 0.4)', border: '1px solid var(--border-color)' }}>
                                    <Activity size={32} style={{ opacity: 0.3 }} />
                                </div>
                                <p style={{ margin: 0, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    {mode === 'camera' ? 'AWAITING_FRAME_CAPTURE...' : 'READY_FOR_IMAGE_PROCESSING...'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
};

export default DronePage;
