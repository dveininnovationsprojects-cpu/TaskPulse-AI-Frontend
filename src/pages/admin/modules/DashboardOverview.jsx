import React from 'react';

const DashboardOverview = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Dashboard Overview</h2>
      </div>
      <div className="module-content">
        <p>Welcome to the Admin Dashboard. Here you can see a high-level overview of system metrics.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Total Users</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>124</p>
            </div>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Active Projects</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>12</p>
            </div>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Pending Blockers</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#e11d48' }}>5</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
