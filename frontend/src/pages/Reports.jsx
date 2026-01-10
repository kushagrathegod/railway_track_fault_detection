import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, AlertTriangle, Check, Clock, X, CheckCircle, Info } from 'lucide-react';

const API_URL = "http://localhost:8000";

const Reports = ({ defects }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedDefect, setSelectedDefect] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [reopening, setReopening] = useState(false);
    const { token, user } = useAuth();

    const filteredDefects = defects.filter(defect => {
        const matchesSearch =
            defect.defect_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            defect.nearest_station?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSeverity = filterSeverity === 'All' || defect.severity === filterSeverity;
        const matchesStatus = filterStatus === 'All' || defect.status === filterStatus;

        return matchesSearch && matchesSeverity && matchesStatus;
    });

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
                    📊 Defect Reports
                </h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: '#8b8d98' }} />
                        <input
                            type="text"
                            placeholder="Search location, type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'rgba(19, 19, 26, 0.7)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                padding: '12px 14px 12px 42px',
                                borderRadius: '12px',
                                color: 'white',
                                width: '240px',
                                fontFamily: 'Space Grotesk, sans-serif'
                            }}
                        />
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        style={{
                            background: 'rgba(19, 19, 26, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            color: 'white',
                            fontFamily: 'Space Grotesk, sans-serif',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            background: 'rgba(19, 19, 26, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            color: 'white',
                            fontFamily: 'Space Grotesk, sans-serif',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-container" style={{
                background: 'rgba(19, 19, 26, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(10, 10, 15, 0.8)', borderBottom: '2px solid rgba(99, 102, 241, 0.3)' }}>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>ID</th>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>Date/Time</th>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>Defect Type</th>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>Severity</th>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>Location</th>
                            <th style={{ padding: '18px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#06b6d4' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDefects.map(defect => (
                            <tr
                                key={defect.id}
                                onClick={() => setSelectedDefect(defect)}
                                style={{
                                    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <td style={{ padding: '15px', color: '#94a3b8', fontWeight: 600 }}>#{defect.id}</td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={14} color="#94a3b8" />
                                        {new Date(defect.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                                    </div>
                                </td>
                                <td style={{ padding: '15px', fontWeight: '600' }}>{defect.defect_type}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: defect.severity === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : defect.severity === 'High' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: defect.severity === 'Critical' ? '#fca5a5' : defect.severity === 'High' ? '#fbbf24' : '#93c5fd',
                                        border: `1px solid ${defect.severity === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : defect.severity === 'High' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                                    }}>
                                        {defect.severity}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={14} color="#94a3b8" />
                                        {defect.nearest_station || 'Unknown'}
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: defect.status === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                        color: defect.status === 'Resolved' ? '#6ee7b7' : '#fbbf24',
                                        border: `1px solid ${defect.status === 'Resolved' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`
                                    }}>
                                        {defect.status === 'Resolved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        {defect.status || 'Open'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredDefects.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No defects found matching your criteria.
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedDefect && (
                <>
                    {/* Overlay */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999
                        }}
                        onClick={() => setSelectedDefect(null)}
                    />

                    {/* Detail Panel */}
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: 'rgba(19, 19, 26, 0.95)',
                        backdropFilter: 'blur(30px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '20px',
                        padding: '30px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        zIndex: 1000
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                {selectedDefect.severity === 'Critical' ? <AlertTriangle color="#ef4444" /> : <Info color="#3b82f6" />}
                                {selectedDefect.defect_type}
                            </h2>
                            <button onClick={() => setSelectedDefect(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Status Badge */}
                        {selectedDefect.status === 'Resolved' && (
                            <div style={{
                                padding: '12px 16px',
                                marginBottom: '20px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '10px',
                                color: '#6ee7b7',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <CheckCircle size={20} />
                                <span>This defect has been marked as resolved</span>
                            </div>
                        )}

                        {/* Image */}
                        <img
                            src={selectedDefect.image_url.startsWith('http') ? selectedDefect.image_url : "https://via.placeholder.com/400x250?text=No+Image"}
                            alt="Defect"
                            style={{
                                width: '100%',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=Error+Loading+Image" }}
                        />

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 4 }}>Defect ID</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>#{selectedDefect.id}</div>
                            </div>
                            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 4 }}>Confidence</div>
                                <div style={{ fontWeight: 'bold', color: '#fbbf24', fontSize: '1.1rem' }}>{selectedDefect.confidence}%</div>
                            </div>
                            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 4 }}>Severity</div>
                                <div style={{ fontWeight: 'bold', color: selectedDefect.severity === 'Critical' ? '#ef4444' : '#fff', fontSize: '1.1rem' }}>{selectedDefect.severity}</div>
                            </div>
                            <div style={{ background: '#1e293b', padding: 12, borderRadius: 8 }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 4 }}>Status</div>
                                <div style={{ fontWeight: 'bold', color: selectedDefect.status === 'Resolved' ? '#10b981' : '#fbbf24', fontSize: '1.1rem' }}>{selectedDefect.status || 'Open'}</div>
                            </div>
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Location</div>
                            <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
                                <MapPin size={16} style={{ display: 'inline', marginRight: 6 }} />
                                {selectedDefect.nearest_station} (Lat: {selectedDefect.latitude}, Lon: {selectedDefect.longitude})
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Detected At</div>
                            <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
                                <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
                                {new Date(selectedDefect.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                            </div>
                        </div>

                        {/* Root Cause */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Root Cause</div>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>{selectedDefect.root_cause || "Analyzing..."}</p>
                        </div>

                        {/* Immediate Action */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>Immediate Action</div>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>{selectedDefect.action_required || "Pending..."}</p>
                        </div>

                        {/* Resolution Steps */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: '0.85rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 600 }}>Resolution Steps</div>
                            <div>
                                {selectedDefect.resolution_steps ? (
                                    selectedDefect.resolution_steps.split('. ').map((step, i) => (
                                        step.trim() && (
                                            <div key={i} style={{
                                                padding: '10px 14px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.4',
                                                color: '#cbd5e1'
                                            }}>
                                                {i + 1}. {step}
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <p style={{ color: '#94a3b8' }}>Fetching AI recommendations...</p>
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
                                    padding: '14px',
                                    background: resolving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
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
                                        padding: '14px',
                                        background: reopening ? 'rgba(251, 191, 36, 0.3)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
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
                </>
            )}
        </div>
    );
};

export default Reports;
