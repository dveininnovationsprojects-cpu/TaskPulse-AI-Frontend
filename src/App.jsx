import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectManagerDashboard from './pages/manager/ManagerDashboard';
import TeamLeadDashboard from './pages/lead/LeadDashboard';
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import DataAnalystDashboard from './pages/analyst/AnalystDashboard';
import ClientViewerDashboard from './pages/client/ClientDashboard';

// Requires a token, and (when `role` is given) requires the logged-in user's
// role to match the route — otherwise they're sent to their own dashboard
// instead of rendering a dashboard built for a different role's permissions.
const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const currentRole = localStorage.getItem('role');
  if (role && currentRole && currentRole !== role) {
    return <Navigate to={`/dashboard/${currentRole.toLowerCase()}`} replace />;
  }
  return children;
};

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (token && role) {
    return <Navigate to={`/dashboard/${role.toLowerCase()}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard/admin" element={
          <PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/project_manager" element={
          <PrivateRoute role="PROJECT_MANAGER"><ProjectManagerDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/team_lead" element={
          <PrivateRoute role="TEAM_LEAD"><TeamLeadDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/developer" element={
          <PrivateRoute role="DEVELOPER"><DeveloperDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/data_analyst" element={
          <PrivateRoute role="DATA_ANALYST"><DataAnalystDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/client_viewer" element={
          <PrivateRoute role="CLIENT_VIEWER"><ClientViewerDashboard /></PrivateRoute>
        } />
        
        {/* Default fallback route */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
