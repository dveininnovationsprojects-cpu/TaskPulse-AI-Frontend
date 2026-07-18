import React from 'react';

const DashboardOverview = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Manager Dashboard Overview</h2>
      </div>
      <div className="module-content">
        <p>Welcome to the Project Manager Dashboard. Here you can see an overview of your projects and team health.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>My Projects</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>4</p>
            </div>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Active Sprints</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>4</p>
            </div>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Risk Alerts</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#e11d48' }}>2</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
