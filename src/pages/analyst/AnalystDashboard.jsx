import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import ReportsModule from './modules/ReportsModule';
import WorkLogsModule from './modules/WorkLogsModule';

const analystModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'worklogs', label: 'Work Logs' },
];

const AnalystDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'reports': return <ReportsModule />;
      case 'worklogs': return <WorkLogsModule />;
      default: return <DashboardOverview />;
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
