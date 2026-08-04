import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardOverview from './modules/DashboardOverview';

const clientModules = [
  { id: 'dashboard', label: 'Dashboard' }
];

const ClientDashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  return (
    <DashboardLayout 
      title="TaskPulse AI" 
      modules={clientModules} 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
    >
      <DashboardOverview />
    </DashboardLayout>
  );
};

export default ClientDashboard;
