import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DynamicAnalyticsDashboard from '../../components/DynamicAnalyticsDashboard';
import AdminDashboardOverview from '../admin/modules/DashboardOverview';
import ManagerDashboardOverview from '../manager/modules/DashboardOverview';
import DeveloperDashboardOverview from '../developer/modules/DashboardOverview';
import ReportsModule from './modules/ReportsModule';

const analystModules = [
  { id: 'analytics', label: 'Data Analysis' },
  { id: 'executive', label: 'Executive' },
  { id: 'manager', label: 'Manager Dashboard' },
  { id: 'employee', label: 'Employee Dashboard' },
  { id: 'reports', label: 'Reports & Analytics' }
];

const AnalystDashboard = () => {
  const [activeModule, setActiveModule] = useState('analytics');

  const renderModule = () => {
    switch (activeModule) {
      case 'analytics':
        return <DynamicAnalyticsDashboard />;
      case 'executive':
        return <AdminDashboardOverview isAnalystView={true} />;
      case 'manager':
        return <ManagerDashboardOverview isAnalystView={true} />;
      case 'employee':
        return <DeveloperDashboardOverview isAnalystView={true} />;
      case 'reports':
        return <ReportsModule />;
      default:
        return <DynamicAnalyticsDashboard />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={analystModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default AnalystDashboard;

