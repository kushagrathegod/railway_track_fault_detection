import React from 'react';

const DefectList = ({ defects, onSelect, selectedId }) => {
    return (
        <div className="defect-list">
            <h3>🔍 Live Detections</h3>
            {defects.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>No defects detected yet.</div>
            ) : (
                defects.map(defect => (
                    <div
                        key={defect.id}
                        className={`defect-card ${selectedId === defect.id ? 'selected' : ''} ${defect.severity === 'Critical' ? 'critical' : ''}`}
                        onClick={() => onSelect(defect)}
                    >
                        <div className="defect-header">
                            <span className="defect-type">{defect.defect_type}</span>
                            <span className="defect-confidence">{defect.confidence}%</span>
                        </div>
                        <div className="defect-info">📍 {defect.nearest_station}</div>
                        <div className="defect-info">⚠️ {defect.severity} | 🕒 {new Date(defect.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default DefectList;
