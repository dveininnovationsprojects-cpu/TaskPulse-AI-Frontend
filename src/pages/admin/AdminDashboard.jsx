import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import EmployeesModule from './modules/EmployeesModule';
import ProjectsModule from './modules/ProjectsModule';
import TasksModule from './modules/TasksModule';
import BlockersModule from './modules/BlockersModule';

const adminModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'blockers', label: 'Blockers' },
];

const AdminDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'employees': return <EmployeesModule />;
      case 'projects': return <ProjectsModule />;
      case 'tasks': return <TasksModule />;
      case 'blockers': return <BlockersModule />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={adminModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
