import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, Check, Clock } from 'lucide-react';

const Reports = ({ defects }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('All');

    const filteredDefects = defects.filter(defect => {
        const matchesSearch =
            defect.defect_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            defect.chainage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            defect.nearest_station?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterSeverity === 'All') return matchesSearch;
        return matchesSearch && defect.severity === filterSeverity;
    });

    return (
        <div style={{ padding: '20px', overflowY: 'auto', height: 'calc(100vh - 60px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Defect Reports History</h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search location, type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: '#1e293b',
                                border: '1px solid #374151',
                                padding: '10px 10px 10px 35px',
                                borderRadius: '6px',
                                color: 'white',
                                width: '250px'
                            }}
                        />
                    </div>

                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #374151',
                            padding: '10px',
                            borderRadius: '6px',
                            color: 'white'
                        }}
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            <div className="table-container" style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#0f172a', borderBottom: '1px solid #374151' }}>
                            <th style={{ padding: '15px' }}>ID</th>
                            <th style={{ padding: '15px' }}>Date/Time</th>
                            <th style={{ padding: '15px' }}>Defect Type</th>
                            <th style={{ padding: '15px' }}>Severity</th>
                            <th style={{ padding: '15px' }}>Location</th>
                            <th style={{ padding: '15px' }}>Resolution Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDefects.map(defect => (
                            <tr key={defect.id} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '15px', color: '#94a3b8' }}>#{defect.id}</td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={14} color="#94a3b8" />
                                        {new Date(defect.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                                    </div>
                                </td>
                                <td style={{ padding: '15px', fontWeight: '600' }}>{defect.defect_type}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        background: defect.severity === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: defect.severity === 'Critical' ? '#fca5a5' : '#93c5fd'
                                    }}>
                                        {defect.severity}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={14} color="#94a3b8" />
                                        {defect.chainage} ({defect.nearest_station})
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ maxWidth: '300px', fontSize: '0.9rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {defect.resolution_steps || "Pending Analysis..."}
                                    </div>
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
        </div>
    );
};

export default Reports;
