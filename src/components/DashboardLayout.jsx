import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = ({ title = 'TaskPulse AI', modules = [], activeModule, onModuleChange, children }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
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
          <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {children}
      </main>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12, 89, 101, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ position: 'relative', zIndex: 1, background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.8)', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '40px 30px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255,255,255,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '24px', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', overflow: 'hidden', zIndex: -1, WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}></div>
            <h3 style={{ color: '#0c5965', marginBottom: '16px', fontSize: '1.4rem', position: 'relative', zIndex: 2 }}>
              Confirm Logout
            </h3>
            <p style={{ color: '#475569', marginBottom: '30px', lineHeight: '1.5', position: 'relative', zIndex: 2 }}>
              Are you sure you want to securely log out of TaskPulse AI?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              <button 
                style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                onClick={() => setShowLogoutConfirm(false)}
              >
                No, Stay
              </button>
              <button 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DashboardLayout;
