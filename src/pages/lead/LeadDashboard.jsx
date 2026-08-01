import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';
import EmployeesModule from './modules/EmployeesModule';
import SprintsModule from './modules/SprintsModule';
import TasksModule from './modules/TasksModule';
import WorkLogsModule from './modules/WorkLogsModule';
import BlockersModule from './modules/BlockersModule';
import ActivitiesModule from '../../components/ActivitiesModule';

const leadModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'worklogs', label: 'Work Logs' },
  { id: 'blockers', label: 'Blockers' },
  { id: 'activities', label: 'Activities' },
];

const LeadDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardOverview />;
      case 'employees': return <EmployeesModule />;
      case 'sprints': return <SprintsModule />;
      case 'tasks': return <TasksModule />;
      case 'worklogs': return <WorkLogsModule />;
      case 'blockers': return <BlockersModule />;
      case 'activities': return <ActivitiesModule />;
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
