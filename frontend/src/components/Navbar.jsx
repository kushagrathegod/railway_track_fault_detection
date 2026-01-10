import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, LogOut, User, Building2, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Don't show navbar on login page
    if (location.pathname === '/login') {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" stroke="url(#gradient1)" strokeWidth="2" fill="none" />
                    <circle cx="6" cy="6" r="2" fill="url(#gradient1)" />
                    <circle cx="18" cy="6" r="2" fill="url(#gradient1)" />
                    <circle cx="6" cy="18" r="2" fill="url(#gradient1)" />
                    <circle cx="18" cy="18" r="2" fill="url(#gradient1)" />
                    <line x1="12" y1="9" x2="6" y2="6" stroke="url(#gradient1)" strokeWidth="1.5" />
                    <line x1="12" y1="9" x2="18" y2="6" stroke="url(#gradient1)" strokeWidth="1.5" />
                    <line x1="12" y1="15" x2="6" y2="18" stroke="url(#gradient1)" strokeWidth="1.5" />
                    <line x1="12" y1="15" x2="18" y2="18" stroke="url(#gradient1)" strokeWidth="1.5" />
                    <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
                Neural Track
            </div>

            {isAuthenticated && (
                <>
                    <div className="nav-links" style={{ display: 'flex', gap: '20px', marginLeft: '40px' }}>
                        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <LayoutDashboard size={18} /> Dashboard
                        </NavLink>
                        {user?.role === 'Admin' && (
                            <NavLink to="/stations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                <Building2 size={18} /> Stations
                            </NavLink>
                        )}
                        {user?.role === 'Admin' && (
                            <NavLink to="/drone" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                                <Camera size={18} /> Drone Control
                            </NavLink>
                        )}
                        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <FileText size={18} /> Reports
                        </NavLink>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="status-badge">
                            <Activity size={14} style={{ marginRight: 5 }} /> System Active
                        </div>

                        <div className="user-info">
                            <User size={16} />
                            <span>{user?.username}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>

                        <button onClick={handleLogout} className="logout-button">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </>
            )}
        </nav>
    );
};

export default Navbar;
