import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import MyTasksModule from './modules/MyTasksModule';
import WorkLogsModule from './modules/WorkLogsModule';
import BlockersModule from './modules/BlockersModule';

const developerModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'mytasks', label: 'My Tasks' },
  { id: 'worklogs', label: 'Work Logs' },
  { id: 'blockers', label: 'Blockers' },
];

const DeveloperDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'mytasks': return <MyTasksModule />;
      case 'worklogs': return <WorkLogsModule />;
      case 'blockers': return <BlockersModule />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={developerModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default DeveloperDashboard;
