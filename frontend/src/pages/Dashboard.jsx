import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MapComponent from '../components/MapComponent';
import DefectList from '../components/DefectList';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertTriangle, CheckCircle, Info, Activity, TrendingUp, MapPin, Clock, Play, Terminal, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Dashboard = ({ defects }) => {
    const [selectedDefect, setSelectedDefect] = useState(null);
    const { token, user } = useAuth();
    const [resolving, setResolving] = useState(false);
    const [reopening, setReopening] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    // Handle deleting defect (admin only)
    const handleDelete = async () => {
        if (!selectedDefect) return;

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete this defect report?\n\nDefect ID: #${selectedDefect.id}\nType: ${selectedDefect.defect_type}\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        setDeleting(true);
        try {
            await axios.delete(`${API_URL}/defects/${selectedDefect.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSelectedDefect(null);
            window.location.reload();
        } catch (err) {
            console.error('Error deleting defect:', err);
            alert(err.response?.data?.detail || 'Failed to delete defect');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            {/* Stats Section - Mission Control Style */}
            <div style={{
                padding: '16px 24px',
                background: 'var(--bg-secondary)',
                borderBottom: '2px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {/* Total Defects */}
                        <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Activity size={14} color="var(--text-secondary)" />
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Inspection Count</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                {totalDefects.toString().padStart(3, '0')}
                            </div>
                        </div>

                        {/* Open Defects */}
                        <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Clock size={14} color="var(--text-secondary)" />
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Anomalies</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-warning)' }}>
                                {openDefects.toString().padStart(3, '0')}
                            </div>
                        </div>

                        {/* Critical Defects */}
                        <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--status-critical)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            boxShadow: 'inset 0 0 10px rgba(255, 59, 59, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <ShieldAlert size={14} color="var(--status-critical)" />
                                <span style={{ fontSize: '0.65rem', color: 'var(--status-critical)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Critical Violations</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-critical)' }}>
                                {criticalDefects.toString().padStart(3, '0')}
                            </div>
                        </div>

                        {/* Resolved Defects */}
                        <div style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <CheckCircle size={14} color="var(--status-safe)" />
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Security Cleared</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-safe)' }}>
                                {resolvedDefects.toString().padStart(3, '0')}
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
                padding: '16px',
                gap: '16px',
                background: 'transparent'
            }}>
                {/* Sidebar */}
                <div className="sidebar" style={{
                    width: '400px',
                    height: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
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
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
                }}>
                    <MapComponent
                        defects={defects}
                        selectedDefect={selectedDefect}
                        onSelectDefect={setSelectedDefect}
                    />

                    {/* Detail Overlay */}
                    {selectedDefect && (
                        <div className="details-panel">
                            {/* Enhanced Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 24,
                                paddingBottom: 16,
                                borderBottom: '2px solid var(--border-color)'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        marginBottom: 8
                                    }}>
                                        {selectedDefect.severity === 'Critical' ? (
                                            <div style={{
                                                padding: '6px',
                                                background: 'rgba(255, 59, 59, 0.1)',
                                                border: '1px solid var(--status-critical)',
                                                borderRadius: '4px'
                                            }}>
                                                <ShieldAlert color="var(--status-critical)" size={18} />
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '6px',
                                                background: 'rgba(77, 163, 255, 0.1)',
                                                border: '1px solid var(--accent-blue)',
                                                borderRadius: '4px'
                                            }}>
                                                <Terminal color="var(--accent-blue)" size={18} />
                                            </div>
                                        )}
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            color: 'var(--text-primary)',
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {selectedDefect.defect_type}
                                        </h2>
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-mono)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        CASE ID: #{selectedDefect.id?.toString().padStart(4, '0')}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDefect(null)}
                                    style={{
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--border-color)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-primary)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Status Badge */}
                            {selectedDefect.status === 'Resolved' && (
                                <>
                                    <div style={{
                                        padding: '10px 14px',
                                        marginBottom: '16px',
                                        background: 'rgba(0, 230, 118, 0.08)',
                                        border: '1px solid var(--status-safe)',
                                        borderRadius: '6px',
                                        color: 'var(--status-safe)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-mono)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        textTransform: 'uppercase'
                                    }}>
                                        <CheckCircle size={16} />
                                        <span>Incident Resolved - Sec Clearance Verified</span>
                                    </div>

                                    {/* Resolution Info */}
                                    {selectedDefect.resolved_at && (
                                        <div style={{
                                            padding: '14px',
                                            marginBottom: '20px',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                color: 'var(--accent-blue)',
                                                fontSize: '0.65rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1.2px',
                                                fontWeight: 800,
                                                fontFamily: 'var(--font-mono)'
                                            }}>
                                                ⏱ Resolution Timeline
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: 'var(--status-safe)',
                                                fontSize: '0.85rem',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600
                                            }}>
                                                <Clock size={14} />
                                                <span>
                                                    {new Date(selectedDefect.resolved_at).toLocaleString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false
                                                    })} IST
                                                </span>
                                            </div>
                                            {selectedDefect.resolved_by && (
                                                <div style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.75rem',
                                                    marginTop: '2px'
                                                }}>
                                                    Resolved by: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>User ID {selectedDefect.resolved_by}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Image with enhanced styling */}
                            <div style={{
                                position: 'relative',
                                marginBottom: '20px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                background: 'var(--bg-primary)',
                                minHeight: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {selectedDefect.image_url ? (
                                    <img
                                        src={`${API_URL}${selectedDefect.image_url}`}
                                        alt="Defect"
                                        style={{
                                            width: '100%',
                                            display: 'block',
                                            minHeight: '200px',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.8rem; flex-direction: column; gap: 8px;"><span style="font-size: 2rem;">📷</span><span>Image Not Available</span></div>';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '200px',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>📷</span>
                                        <span>No Image Uploaded</span>
                                    </div>
                                )}
                            </div>

                            {/* Enhanced stat cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 14,
                                marginBottom: 24
                            }}>
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '14px 16px',
                                    transition: 'all 0.2s',
                                    cursor: 'default'
                                }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.2px',
                                        marginBottom: 8,
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        Model Confidence
                                    </div>
                                    <div style={{
                                        fontWeight: 800,
                                        color: 'var(--accent-blue)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '1.5rem',
                                        lineHeight: 1
                                    }}>
                                        {selectedDefect.confidence}%
                                    </div>
                                </div>
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    border: `1px solid ${selectedDefect.severity === 'Critical' ? 'var(--status-critical)' : 'var(--border-color)'}`,
                                    borderRadius: '6px',
                                    padding: '14px 16px',
                                    transition: 'all 0.2s',
                                    cursor: 'default',
                                    ...(selectedDefect.severity === 'Critical' && {
                                        background: 'rgba(255, 59, 59, 0.05)'
                                    })
                                }}
                                    onMouseOver={(e) => {
                                        if (selectedDefect.severity !== 'Critical') {
                                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                        }
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={(e) => {
                                        if (selectedDefect.severity !== 'Critical') {
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                        }
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.2px',
                                        marginBottom: 8,
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        Risk Level
                                    </div>
                                    <div style={{
                                        fontWeight: 800,
                                        color: selectedDefect.severity === 'Critical' ? 'var(--status-critical)' : 'var(--text-primary)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '1.5rem',
                                        lineHeight: 1
                                    }}>
                                        {selectedDefect.severity.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced section titles and content */}
                            <div style={{
                                marginBottom: 20,
                                padding: '14px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--accent-blue)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.2px',
                                    marginBottom: 10,
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    🔍 Root Cause Analysis
                                </div>
                                <p style={{
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6',
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    {(selectedDefect.root_cause || "Analyzing...").replace(/[\[\]'"]/g, '')}
                                </p>
                            </div>

                            <div style={{
                                marginBottom: 20,
                                padding: '14px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--status-warning)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.2px',
                                    marginBottom: 10,
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    ⚡ Immediate Action Required
                                </div>
                                <p style={{
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6',
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    {(selectedDefect.action_required || "Pending...").replace(/[\[\]'"]/g, '')}
                                </p>
                            </div>

                            <div style={{
                                marginBottom: 20,
                                padding: '16px',
                                background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.03) 0%, rgba(77, 163, 255, 0.03) 100%)',
                                border: '1px solid var(--status-safe)',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 230, 118, 0.1)'
                            }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--status-safe)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.5px',
                                    marginBottom: 16,
                                    fontWeight: 900,
                                    fontFamily: 'var(--font-mono)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    paddingBottom: '12px',
                                    borderBottom: '2px solid rgba(0, 230, 118, 0.2)'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>✓</span>
                                    <span>Recommended Resolution Protocol</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedDefect.resolution_steps ? (
                                        selectedDefect.resolution_steps
                                            .replace(/[\[\]'"]/g, '')
                                            .split(/\d+\.\s*|\. /)
                                            .filter(step => step.trim())
                                            .map((step, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: '12px 14px',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderLeft: '3px solid var(--status-safe)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.82rem',
                                                        color: 'var(--text-primary)',
                                                        lineHeight: '1.6',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        alignItems: 'flex-start',
                                                        transition: 'all 0.2s',
                                                        cursor: 'default'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.background = 'rgba(0, 230, 118, 0.05)';
                                                        e.currentTarget.style.borderLeftColor = 'var(--accent-blue)';
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                                        e.currentTarget.style.borderLeftColor = 'var(--status-safe)';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }}
                                                >
                                                    <div style={{
                                                        minWidth: '28px',
                                                        height: '28px',
                                                        background: 'var(--status-safe)',
                                                        color: 'var(--bg-primary)',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 900,
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'var(--font-mono)',
                                                        flexShrink: 0
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <span style={{ flex: 1, paddingTop: '4px' }}>
                                                        {step.trim()}
                                                    </span>
                                                </div>
                                            ))
                                    ) : (
                                        <p style={{
                                            margin: 0,
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.8rem',
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            padding: '20px'
                                        }}>
                                            Fetching AI recommendations...
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {selectedDefect.status === 'Open' ? (
                                <button
                                    onClick={handleMarkResolved}
                                    disabled={resolving}
                                    style={{
                                        width: '100%',
                                        marginTop: '24px',
                                        padding: '14px',
                                        background: resolving ? 'var(--bg-primary)' : 'transparent',
                                        border: '1px solid var(--status-safe)',
                                        color: 'var(--status-safe)',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono)',
                                        cursor: resolving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                    onMouseOver={(e) => !resolving && (e.currentTarget.style.background = 'var(--status-safe)', e.currentTarget.style.color = 'var(--bg-primary)')}
                                    onMouseOut={(e) => !resolving && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--status-safe)')}
                                >
                                    <CheckCircle size={16} />
                                    {resolving ? 'UPDATING SEC_LOG...' : 'EXECUTE RESOLUTION'}
                                </button>
                            ) : (
                                user?.role === 'Admin' && (
                                    <>
                                        <button
                                            onClick={handleReopen}
                                            disabled={reopening}
                                            style={{
                                                width: '100%',
                                                marginTop: '24px',
                                                padding: '14px',
                                                background: reopening ? 'var(--bg-primary)' : 'transparent',
                                                border: '1px solid var(--status-warning)',
                                                color: 'var(--status-warning)',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                fontFamily: 'var(--font-mono)',
                                                cursor: reopening ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                            onMouseOver={(e) => !reopening && (e.currentTarget.style.background = 'var(--status-warning)', e.currentTarget.style.color = 'var(--bg-primary)')}
                                            onMouseOut={(e) => !reopening && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--status-warning)')}
                                        >
                                            <AlertTriangle size={16} />
                                            {reopening ? 'REOPENING CASE...' : 'REOPEN INVESTIGATION'}
                                        </button>

                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            style={{
                                                width: '100%',
                                                marginTop: '12px',
                                                padding: '14px',
                                                background: deleting ? 'var(--bg-primary)' : 'transparent',
                                                border: '1px solid var(--status-critical)',
                                                color: 'var(--status-critical)',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                fontFamily: 'var(--font-mono)',
                                                cursor: deleting ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                            onMouseOver={(e) => !deleting && (e.currentTarget.style.background = 'var(--status-critical)', e.currentTarget.style.color = 'var(--bg-primary)')}
                                            onMouseOut={(e) => !deleting && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--status-critical)')}
                                        >
                                            <X size={16} />
                                            {deleting ? 'DELETING REPORT...' : 'DELETE REPORT'}
                                        </button>
                                    </>
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
