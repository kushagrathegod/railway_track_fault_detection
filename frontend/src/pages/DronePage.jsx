import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Upload, Video, Image as ImageIcon, AlertCircle, CheckCircle2, Loader, Activity, MapPin, Play, Square, Shield, Zap, Database, Cpu, Clock } from 'lucide-react';

const API_URL = "http://localhost:8000";

const DronePage = () => {
    const { token } = useAuth();
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
        <div style={{ padding: '30px', height: 'calc(100vh - 70px)', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        margin: 0,
                        marginBottom: '8px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🚁 Drone Inspection Control
                    </h1>
                    <p style={{ color: '#8b8d98', fontSize: '0.95rem', margin: 0 }}>
                        Real-time railway track defect detection using AI-powered vision analysis
                    </p>
                </div>

                {inspectionStarted && (
                    <button
                        onClick={reset}
                        style={{
                            padding: '12px 24px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                    >
                        <Square size={20} fill="#ef4444" />
                        Stop Inspection
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
                    minHeight: '600px',
                    gap: '50px'
                }}>
                    {/* System Status Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        width: '100%',
                        maxWidth: '900px'
                    }}>
                        {[
                            { icon: <Cpu size={20} color="#6366f1" />, label: 'AI Engine', status: 'Ready' },
                            { icon: <Shield size={20} color="#10b981" />, label: 'Security', status: 'Active' },
                            { icon: <Database size={20} color="#fbbf24" />, label: 'Database', status: 'Connected' },
                            { icon: <Clock size={20} color="#8b5cf6" />, label: 'Latency', status: '12ms' }
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(19, 19, 26, 0.6)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    padding: '8px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '10px'
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ color: '#8b8d98', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{item.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={() => setInspectionStarted(true)}
                            style={{
                                padding: '30px 60px',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                fontFamily: 'Outfit, sans-serif',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 20px 50px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 30px 60px rgba(99, 102, 241, 0.5)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = '0 20px 50px rgba(99, 102, 241, 0.3)';
                            }}
                        >
                            <Play size={32} fill="white" />
                            Start Drone Inspection
                        </button>
                        <p style={{ marginTop: '25px', color: '#8b8d98', fontSize: '1rem', maxWidth: '500px' }}>
                            Initialize the AI-powered inspection suite to detect railway defects in real-time or via high-resolution image uploads.
                        </p>
                    </div>

                    {/* Guidelines Section */}
                    <div style={{
                        maxWidth: '900px',
                        width: '100%',
                        background: 'rgba(19, 19, 26, 0.4)',
                        border: '1px dashed rgba(99, 102, 241, 0.3)',
                        borderRadius: '20px',
                        padding: '30px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '30px'
                    }}>
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={18} color="#fbbf24" /> Active Inspection
                            </h4>
                            <ul style={{ color: '#8b8d98', fontSize: '0.9rem', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Ensure stable internet for live telemetry.</li>
                                <li>AI models will automatically flag critical defects.</li>
                                <li>Auto-analyze mode available for hands-free operation.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={18} color="#10b981" /> Data Integrity
                            </h4>
                            <ul style={{ color: '#8b8d98', fontSize: '0.9rem', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>All detections are geo-tagged and timestamped.</li>
                                <li>Automated email alerts sent to Station Masters.</li>
                                <li>Detailed analysis report generated for every flag.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Selection - Only shown AFTER starting and BEFORE choosing mode */}
            {inspectionStarted && !mode && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    {/* Camera Mode */}
                    <div
                        onClick={startCamera}
                        style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '16px',
                            padding: '40px 30px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Video size={40} color="white" />
                        </div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
                            Live Camera Feed
                        </h3>
                        <p style={{ color: '#8b8d98', fontSize: '0.9rem', margin: 0 }}>
                            Use webcam for real-time inspection
                        </p>
                    </div>

                    {/* Upload Mode */}
                    <div
                        onClick={() => document.getElementById('imageInput').click()}
                        style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '16px',
                            padding: '40px 30px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Upload size={40} color="white" />
                        </div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
                            Upload Image
                        </h3>
                        <p style={{ color: '#8b8d98', fontSize: '0.9rem', margin: 0 }}>
                            Test with saved railway track images
                        </p>
                        <span style={{
                            display: 'inline-block',
                            marginTop: '10px',
                            padding: '4px 10px',
                            background: 'rgba(251, 191, 36, 0.2)',
                            border: '1px solid rgba(251, 191, 36, 0.4)',
                            borderRadius: '6px',
                            color: '#fbbf24',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            FOR TESTING
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', height: 'calc(100% - 150px)' }}>
                    {/* Left: Video/Image Display */}
                    <div style={{
                        background: 'rgba(19, 19, 26, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                                    {mode === 'camera' ? '📹 Live Feed' : '🖼️ Image Preview'}
                                </h2>
                                {mode === 'camera' && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 10px',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '20px',
                                        color: '#a5b4fc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <MapPin size={14} />
                                        <span>{liveLocation.label}: {liveLocation.lat.toFixed(4)}, {liveLocation.lon.toFixed(4)}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: '8px',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Video Feed */}
                        {mode === 'camera' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '12px',
                                        background: '#000'
                                    }}
                                />
                                <canvas ref={canvasRef} style={{ display: 'none' }} />

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={captureFrame}
                                        disabled={capturing || processing}
                                        style={{
                                            flex: 2,
                                            padding: '14px',
                                            background: capturing ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: capturing || processing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        {processing ? <Loader className="spinning" size={20} /> : <Camera size={20} />}
                                        {processing ? 'Processing...' : capturing ? 'Captured!' : 'Capture & Analyze Frame'}
                                    </button>

                                    <button
                                        onClick={() => setAutoAnalyze(!autoAnalyze)}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            background: autoAnalyze ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'rgba(99, 102, 241, 0.1)',
                                            border: `1px solid ${autoAnalyze ? 'rgba(139, 92, 246, 0.6)' : 'rgba(99, 102, 241, 0.3)'}`,
                                            borderRadius: '12px',
                                            color: autoAnalyze ? 'white' : '#8b8d98',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Activity size={20} className={autoAnalyze ? 'pulse' : ''} />
                                        {autoAnalyze ? 'Auto ON' : 'Auto Off'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image Preview */}
                        {mode === 'upload' && previewUrl && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}
                                />

                                <button
                                    onClick={processUploadedImage}
                                    disabled={processing}
                                    style={{
                                        padding: '14px',
                                        background: processing ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    {processing ? <Loader className="spinning" size={20} /> : <ImageIcon size={20} />}
                                    {processing ? 'Analyzing...' : 'Analyze Image'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Results Panel */}
                    <div style={{
                        background: 'rgba(19, 19, 26, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                            📊 Analysis Results
                        </h2>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '10px',
                                color: '#fca5a5',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Status Badge */}
                                <div style={{
                                    padding: '12px',
                                    background: result.status === 'defect_detected'
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : result.status === 'no_defect'
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(251, 191, 36, 0.1)',
                                    border: `1px solid ${result.status === 'defect_detected'
                                        ? 'rgba(239, 68, 68, 0.4)'
                                        : result.status === 'no_defect'
                                            ? 'rgba(16, 185, 129, 0.4)'
                                            : 'rgba(251, 191, 36, 0.4)'}`,
                                    borderRadius: '10px',
                                    color: result.status === 'defect_detected'
                                        ? '#fca5a5'
                                        : result.status === 'no_defect'
                                            ? '#6ee7b7'
                                            : '#fbbf24',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {result.status === 'defect_detected' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                    {result.status === 'defect_detected' ? 'Defect Detected!' : result.status === 'no_defect' ? 'No Defect Found' : 'Low Confidence'}
                                </div>

                                {/* ML Model Info */}
                                <div style={{
                                    padding: '12px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#8b8d98', marginBottom: '4px' }}>ML Model Prediction</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{result.prediction}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#8b5cf6', marginTop: '4px' }}>
                                        Confidence: {result.confidence}%
                                    </div>
                                </div>

                                {/* Message for non-defects */}
                                {result.message && (
                                    <div style={{
                                        padding: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: '#cbd5e1'
                                    }}>
                                        {result.message}
                                    </div>
                                )}

                                {/* Defect Details (only if defect detected) */}
                                {result.status === 'defect_detected' && (
                                    <>
                                        {/* Defect Info */}
                                        <div style={{
                                            padding: '15px',
                                            background: result.severity === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                            border: `1px solid ${result.severity === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                                            borderRadius: '10px'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', color: '#8b8d98', marginBottom: '4px' }}>Defect Type</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.defect_type}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{
                                                padding: '12px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: '#8b8d98', marginBottom: '4px' }}>Severity</div>
                                                <div style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: result.severity === 'Critical' ? '#ef4444' : '#6366f1'
                                                }}>
                                                    {result.severity}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '12px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: '#8b8d98', marginBottom: '4px' }}>Defect ID</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>#{result.id}</div>
                                            </div>
                                        </div>

                                        {/* Root Cause */}
                                        {result.root_cause && (
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600, marginBottom: '8px' }}>
                                                    ROOT CAUSE
                                                </div>
                                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>
                                                    {result.root_cause}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Required */}
                                        {result.action_required && (
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600, marginBottom: '8px' }}>
                                                    ACTION REQUIRED
                                                </div>
                                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>
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
                                padding: '40px 20px',
                                color: '#8b8d98'
                            }}>
                                <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    {mode === 'camera' ? 'Capture a frame to analyze' : 'Click analyze to process the image'}
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
