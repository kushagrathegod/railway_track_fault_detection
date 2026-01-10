import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Stations from './pages/Stations';
import Login from './pages/Login';
import DronePage from './pages/DronePage';

const API_URL = "http://localhost:8000";

function AppContent() {
    const [defects, setDefects] = useState([]);
    const { token, user } = useAuth();

    // Poll for new defects every 5 seconds
    useEffect(() => {
        if (!token) return; // Don't fetch if not authenticated

        const fetchDefects = async () => {
            try {
                const res = await axios.get(`${API_URL}/defects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Filter defects based on user role
                let filteredDefects = res.data;
                if (user && user.role === 'StationMaster' && user.station_id) {
                    filteredDefects = res.data.filter(
                        defect => defect.assigned_station_id === user.station_id
                    );
                }

                if (JSON.stringify(filteredDefects) !== JSON.stringify(defects)) {
                    setDefects(filteredDefects);
                }
            } catch (err) {
                console.error("Error fetching defects:", err);
            }
        };

        fetchDefects();
        const interval = setInterval(fetchDefects, 5000);
        return () => clearInterval(interval);
    }, [token, user]);

    return (
        <div className="app">
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard defects={defects} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reports defects={defects} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stations"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <Stations />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/drone"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <DronePage />
                        </ProtectedRoute>
                    }
                />
            </Routes>

        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
