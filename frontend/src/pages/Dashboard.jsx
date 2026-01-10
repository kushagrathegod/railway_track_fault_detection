import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import DefectList from '../components/DefectList';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertTriangle, CheckCircle, Info, Activity, TrendingUp, MapPin, Clock, Play } from 'lucide-react';

const API_URL = "http://localhost:8000";

const Dashboard = ({ defects }) => {
    const [selectedDefect, setSelectedDefect] = useState(null);
    const { token, user } = useAuth();
    const [resolving, setResolving] = useState(false);
    const [reopening, setReopening] = useState(false);

    // Calculate stats
    const totalDefects = defects.length;
    const openDefects = defects.filter(d => d.status === 'Open').length;
    const resolvedDefects = defects.filter(d => d.status === 'Resolved').length;
    const criticalDefects = defects.filter(d => d.severity === 'Critical' && d.status === 'Open').length;

    // Handle marking defect as resolved
    const handleMarkResolved = async () => {
        if (!selectedDefect) return;

        setResolving(true);
        try {
            await axios.patch(`${API_URL}/defects/${selectedDefect.id}/resolve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update selected defect status locally
            setSelectedDefect({ ...selectedDefect, status: 'Resolved' });

            // Refresh page to get updated data
            window.location.reload();
        } catch (err) {
            console.error('Error resolving defect:', err);
            alert(err.response?.data?.detail || 'Failed to mark defect as resolved');
        } finally {
            setResolving(false);
        }
    };

    // Handle reopening defect (admin only)
    const handleReopen = async () => {
        if (!selectedDefect) return;

        setReopening(true);
        try {
            await axios.patch(`${API_URL}/defects/${selectedDefect.id}/reopen`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSelectedDefect({ ...selectedDefect, status: 'Open' });
            window.location.reload();
        } catch (err) {
            console.error('Error reopening defect:', err);
            alert(err.response?.data?.detail || 'Failed to reopen defect');
        } finally {
            setReopening(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            {/* Stats Section */}
            <div style={{
                padding: '20px 30px',
                background: 'rgba(13, 13, 20, 0.6)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {/* Total Defects */}
                        <div style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                }}>
                                    <Activity size={20} color="#8b5cf6" />
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                                {totalDefects}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Defects
                            </div>
                        </div>

                        {/* Open Defects */}
                        <div style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(251, 191, 36, 0.15)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(251, 191, 36, 0.3)'
                                }}>
                                    <Clock size={20} color="#fbbf24" />
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                                {openDefects}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Open Defects
                            </div>
                        </div>

                        {/* Critical Defects */}
                        <div style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                    <AlertTriangle size={20} color="#ef4444" />
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                                {criticalDefects}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Critical Open
                            </div>
                        </div>

                        {/* Resolved Defects */}
                        <div style={{
                            background: 'rgba(19, 19, 26, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <CheckCircle size={20} color="#10b981" />
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                                {resolvedDefects}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Resolved
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Sidebar + Map */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                padding: '20px',
                gap: '20px',
                background: 'rgba(10, 10, 15, 0.4)'
            }}>
                {/* Sidebar */}
                <div className="sidebar" style={{
                    width: '380px',
                    height: '100%',
                    background: 'rgba(19, 19, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <DefectList
                        defects={defects}
                        onSelect={setSelectedDefect}
                        selectedId={selectedDefect?.id}
                    />
                </div>

                {/* Map Area - Polished Container */}
                <div style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    background: 'rgba(19, 19, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}>
                    <MapComponent
                        defects={defects}
                        selectedDefect={selectedDefect}
                        onSelectDefect={setSelectedDefect}
                    />

                    {/* Detail Overlay */}
                    {selectedDefect && (
                        <div className="details-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {selectedDefect.severity === 'Critical' ? <AlertTriangle color="#ef4444" /> : <Info color="#3b82f6" />}
                                    {selectedDefect.defect_type}
                                </h2>
                                <button onClick={() => setSelectedDefect(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Status Badge */}
                            {selectedDefect.status === 'Resolved' && (
                                <div style={{
                                    padding: '10px 14px',
                                    marginBottom: '16px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    borderRadius: '10px',
                                    color: '#6ee7b7',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <CheckCircle size={18} />
                                    <span>This defect has been marked as resolved</span>
                                </div>
                            )}

                            <img
                                src={selectedDefect.image_url.startsWith('http') ? selectedDefect.image_url : "https://via.placeholder.com/300x200?text=No+Image"}
                                alt="Defect"
                                className="details-image"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Error+Loading+Image" }}
                            />

                            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.9rem', marginBottom: 15 }}>
                                <div style={{ background: '#334155', padding: 8, borderRadius: 6 }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Confidence</div>
                                    <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>{selectedDefect.confidence}%</div>
                                </div>
                                <div style={{ background: '#334155', padding: 8, borderRadius: 6 }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Severity</div>
                                    <div style={{ fontWeight: 'bold', color: selectedDefect.severity === 'Critical' ? '#ef4444' : '#fff' }}>{selectedDefect.severity}</div>
                                </div>
                            </div>

                            <div className="section-title">Root Cause</div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', color: '#cbd5e1' }}>{selectedDefect.root_cause || "Analyzing..."}</p>

                            <div className="section-title">Immediate Action</div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', color: '#cbd5e1' }}>{selectedDefect.action_required || "Pending..."}</p>

                            <div className="section-title">Resolution Steps</div>
                            <div className="resolution-content">
                                {selectedDefect.resolution_steps ? (
                                    selectedDefect.resolution_steps.split('. ').map((step, i) => (
                                        step.trim() && <div key={i} className="resolution-step">{step}</div>
                                    ))
                                ) : (
                                    <p>Fetching AI recommendations...</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {selectedDefect.status === 'Open' ? (
                                <button
                                    onClick={handleMarkResolved}
                                    disabled={resolving}
                                    style={{
                                        width: '100%',
                                        marginTop: '20px',
                                        padding: '14px',
                                        background: resolving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: resolving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseOver={(e) => !resolving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseOut={(e) => !resolving && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    <CheckCircle size={20} />
                                    {resolving ? 'Marking as Resolved...' : 'Mark as Resolved'}
                                </button>
                            ) : (
                                user?.role === 'Admin' && (
                                    <button
                                        onClick={handleReopen}
                                        disabled={reopening}
                                        style={{
                                            width: '100%',
                                            marginTop: '20px',
                                            padding: '14px',
                                            background: reopening ? 'rgba(251, 191, 36, 0.3)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: reopening ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                        onMouseOver={(e) => !reopening && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                        onMouseOut={(e) => !reopening && (e.currentTarget.style.transform = 'translateY(0)')}
                                    >
                                        <AlertTriangle size={20} />
                                        {reopening ? 'Reopening Defect...' : 'Reopen Defect'}
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
