import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = ({ title = 'TaskPulse AI', modules = [], activeModule, onModuleChange, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Background Elements (Same as Login for visual consistency) */}
      <div className="dashboard-bg-elements">
        <svg className="background-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="#e0f8fd" />
          <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="#a5edf9" opacity="0.5" />
          <path d="M0,70 Q25,50 50,70 T100,70 L100,100 L0,100 Z" fill="#8ae2f0" opacity="0.5" />
        </svg>
        <div className="ribbon-container-left">
          <div className="ribbon-bar bar-1"></div>
          <div className="ribbon-bar bar-2"></div>
          <div className="ribbon-bar bar-3"></div>
          <div className="ribbon-bar bar-4"></div>
        </div>
        <div className="ribbon-container-right">
          <div className="ribbon-bar bar-r1"></div>
          <div className="ribbon-bar bar-r2"></div>
          <div className="ribbon-bar bar-r3"></div>
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-brand">
          <div className="brand-dot"></div>
          <span>{title}</span>
        </div>
        
        <div className="dashboard-links">
          {modules.map((mod) => (
            <button 
              key={mod.id}
              className={activeModule === mod.id ? 'active' : ''}
              onClick={() => onModuleChange(mod.id)}
            >
              {mod.label}
            </button>
          ))}
          {/* Optional Logout Button inside Nav or a User Profile icon */}
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
