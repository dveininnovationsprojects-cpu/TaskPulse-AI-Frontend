import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import ProjectsOverviewModule from './modules/ProjectsOverviewModule';
import SprintsModule from './modules/SprintsModule';
import WorkLogsModule from './modules/WorkLogsModule';

const clientModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects Overview' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'worklogs', label: 'Work Logs' },
];

const ClientDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'projects': return <ProjectsOverviewModule />;
      case 'sprints': return <SprintsModule />;
      case 'worklogs': return <WorkLogsModule />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={clientModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default ClientDashboard;
