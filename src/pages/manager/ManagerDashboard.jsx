import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import EmployeesModule from './modules/EmployeesModule';
import ProjectsModule from './modules/ProjectsModule';
import SprintsModule from './modules/SprintsModule';
import TasksModule from './modules/TasksModule';
import WorkLogsModule from './modules/WorkLogsModule';
import ActivitiesModule from '../../components/ActivitiesModule';

const managerModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'projects', label: 'Projects' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'worklogs', label: 'Work Logs' },
  { id: 'activities', label: 'Activities' },
];

const ManagerDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'employees': return <EmployeesModule />;
      case 'projects': return <ProjectsModule />;
      case 'sprints': return <SprintsModule />;
      case 'tasks': return <TasksModule />;
      case 'worklogs': return <WorkLogsModule />;
      case 'activities': return <ActivitiesModule />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={managerModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      {renderModule()}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
