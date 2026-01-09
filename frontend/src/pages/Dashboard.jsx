import React, { useState } from 'react';
import MapComponent from '../components/MapComponent';
import DefectList from '../components/DefectList';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Dashboard = ({ defects }) => {
    const [selectedDefect, setSelectedDefect] = useState(null);

    return (
        <div className="main-container">
            {/* Sidebar */}
            <div className="sidebar">
                <DefectList
                    defects={defects}
                    onSelect={setSelectedDefect}
                    selectedId={selectedDefect?.id}
                />
            </div>

            {/* Map Area */}
            <div className="map-container">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
