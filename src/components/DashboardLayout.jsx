import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, X, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';
import './DashboardLayout.css';
import './SprintsManagement.css';

const DashboardLayout = ({ title = 'TaskPulse AI', modules = [], activeModule, onModuleChange, children }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    let name = localStorage.getItem('name');
    let email = localStorage.getItem('email');
    let uid = localStorage.getItem('userId');

    if (role) {
      setUserRole(role.replace('_', ' '));
    }

    if (uid) {
      setUserId(uid);
    }
    if (email) {
      setUserEmail(email);
    }

    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (!name) name = decoded.name || decoded.sub || 'User';
        if (!email) setUserEmail(decoded.sub || decoded.email || '');
        if (!uid && (decoded.userId || decoded.id)) {
          setUserId(decoded.userId || decoded.id);
        }
      } catch (e) {
        if (!name) name = 'User';
      }
    }
    setUserName(name || 'User');
    setEditName(name || 'User');
  }, []);

  const confirmLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    const currentUserId = userId || localStorage.getItem('userId');
    setIsUpdatingProfile(true);

    try {
      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword) {
          setProfileError('Old password cannot be empty.');
          setIsUpdatingProfile(false);
          return;
        }
        if (!newPassword) {
          setProfileError('New password cannot be empty.');
          setIsUpdatingProfile(false);
          return;
        }
        if (newPassword.length < 8) {
          setProfileError('New password must be at least 8 characters long.');
          setIsUpdatingProfile(false);
          return;
        }
        if (!confirmPassword) {
          setProfileError('Confirm password cannot be empty.');
          setIsUpdatingProfile(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setProfileError('New password and confirm password do not match.');
          setIsUpdatingProfile(false);
          return;
        }

        // Send ChangePasswordRequest DTO
        await api.put('/api/users/change-password', {
          oldPassword,
          newPassword,
          confirmPassword
        });
      }

      // 2. Update local display name if changed
      if (editName) {
        setUserName(editName);
        localStorage.setItem('name', editName);
        if (currentUserId && (userRole.toUpperCase() === 'ADMIN' || localStorage.getItem('role') === 'ADMIN')) {
          try {
            await api.put(`/api/users/${currentUserId}`, { name: editName });
          } catch (e) {}
        }
      }

      setProfileSuccess('Profile & Password updated successfully!');
      setTimeout(() => {
        setProfileSuccess('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowProfileModal(false);
      }, 1500);
    } catch (err) {
      console.error("Profile update error:", err);
      const backendMsg = err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (backendMsg) {
        setProfileError(backendMsg);
      } else if (err.response?.status === 400) {
        setProfileError("Incorrect old password or passwords do not match.");
      } else {
        setProfileError(err.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
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
          {/* User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', paddingLeft: '24px', borderLeft: '1px solid rgba(17, 177, 198, 0.2)', gap: '16px' }}>
            <div
              onClick={() => setShowProfileModal(true)}
              title="Click to view/edit profile"
              style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(17, 177, 198, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#0c5965', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px' }}>{userName}</span>
              <span style={{ color: '#11b1c6', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>{userRole}</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'none'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {children}
      </main>

      {/* Profile Modal */}
      {showProfileModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12, 89, 101, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '32px 28px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid rgba(17, 177, 198, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #11b1c6, #0c5965)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#0c5965', fontSize: '1.25rem', fontWeight: '700' }}>User Profile</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account details & settings</span>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile}>
              {profileSuccess && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} />
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <X size={16} />
                  {profileError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.25)', background: 'rgba(255,255,255,0.9)', color: '#0c5965', fontSize: '0.95rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  value={userEmail || 'user@taskpulse.ai'}
                  disabled
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.15)', background: 'rgba(241, 245, 249, 0.8)', color: '#64748b', fontSize: '0.95rem', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>System Role </label>
                <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', background: 'rgba(17, 177, 198, 0.12)', border: '1px solid rgba(17, 177, 198, 0.3)', color: '#0c5965', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                  {userRole}
                </div>
              </div>

              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>Old Password</label>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 45px 12px 16px', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.25)', background: 'rgba(255,255,255,0.9)', color: '#0c5965', fontSize: '0.95rem', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  style={{ position: 'absolute', right: '14px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#11b1c6', padding: 0 }}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>New Password (min 8 chars)</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 45px 12px 16px', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.25)', background: 'rgba(255,255,255,0.9)', color: '#0c5965', fontSize: '0.95rem', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '14px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#11b1c6', padding: 0 }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#0c5965', marginBottom: '6px' }}>Confirm New Password</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 45px 12px 16px', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.25)', background: 'rgba(255,255,255,0.9)', color: '#0c5965', fontSize: '0.95rem', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '14px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#11b1c6', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #11b1c6 0%, #0c5965 100%)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(17, 177, 198, 0.3)' }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
