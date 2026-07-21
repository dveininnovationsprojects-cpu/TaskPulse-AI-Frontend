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

// A simple PrivateRoute that redirects to login if no token is found.
// Note: Actual role validation should ideally happen here or in the backend.
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
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
          <PrivateRoute><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/project_manager" element={
          <PrivateRoute><ProjectManagerDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/team_lead" element={
          <PrivateRoute><TeamLeadDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/developer" element={
          <PrivateRoute><DeveloperDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/data_analyst" element={
          <PrivateRoute><DataAnalystDashboard /></PrivateRoute>
        } />
        <Route path="/dashboard/client_viewer" element={
          <PrivateRoute><ClientViewerDashboard /></PrivateRoute>
        } />
        
        {/* Default fallback route */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
