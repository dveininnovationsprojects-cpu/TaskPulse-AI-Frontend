import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, role, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div className="dashboard-container">
        <div className="nav-bar">
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>{title}</h1>
            <span style={{ 
              display: 'inline-block', 
              padding: '4px 8px', 
              backgroundColor: '#e0f2fe', 
              color: '#0369a1',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginTop: '8px'
            }}>
              Role: {role}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
        
        <div className="dashboard-card">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => (
  <DashboardLayout title="Admin Portal" role="ADMIN">
    <h2>Welcome, Administrator</h2>
    <p>From here you can control users, roles, departments, and system settings.</p>
  </DashboardLayout>
);

export const ProjectManagerDashboard = () => (
  <DashboardLayout title="Manager Workspace" role="PROJECT_MANAGER">
    <h2>Welcome, Project Manager</h2>
    <p>Track project execution and delivery health. Review risks and approve reallocations.</p>
  </DashboardLayout>
);

export const TeamLeadDashboard = () => (
  <DashboardLayout title="Team Lead Hub" role="TEAM_LEAD">
    <h2>Welcome, Team Lead</h2>
    <p>Manage daily task progress, assign tasks, review work logs, and resolve blockers.</p>
  </DashboardLayout>
);

export const DeveloperDashboard = () => (
  <DashboardLayout title="Developer Workspace" role="DEVELOPER">
    <h2>Welcome, Developer</h2>
    <p>Update assigned work, report blockers, and add daily logs.</p>
  </DashboardLayout>
);

export const DataAnalystDashboard = () => (
  <DashboardLayout title="Analytics Studio" role="DATA_ANALYST">
    <h2>Welcome, Data Analyst</h2>
    <p>Analyze productivity, define KPIs, and prepare reports.</p>
  </DashboardLayout>
);

export const ClientViewerDashboard = () => (
  <DashboardLayout title="Client Overview" role="CLIENT_VIEWER">
    <h2>Welcome, Client</h2>
    <p>View high-level project milestones, progress summary, and risk flags.</p>
  </DashboardLayout>
);
