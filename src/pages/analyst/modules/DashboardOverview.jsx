import React from 'react';

const DashboardOverview = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Data Analyst Overview</h2>
      </div>
      <div className="module-content">
        <p>Welcome. Review system-wide data metrics, productivity trends, and AI predictions.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Total Records</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>12.4k</p>
            </div>
            <div style={{ padding: '20px', background: '#f0faff', borderRadius: '12px', border: '1px solid #8ae2f0' }}>
                <h3 style={{ margin: 0, color: '#0c5965' }}>Generated Reports</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#11b1c6' }}>15</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
