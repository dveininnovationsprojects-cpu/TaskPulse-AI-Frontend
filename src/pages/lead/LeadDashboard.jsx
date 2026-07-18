import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import EmployeesModule from './modules/EmployeesModule';
import SprintsModule from './modules/SprintsModule';
import TasksModule from './modules/TasksModule';
import BlockersModule from './modules/BlockersModule';

const leadModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'blockers', label: 'Blockers' },
];

const LeadDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'employees': return <EmployeesModule />;
      case 'sprints': return <SprintsModule />;
      case 'tasks': return <TasksModule />;
      case 'blockers': return <BlockersModule />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={leadModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default LeadDashboard;
