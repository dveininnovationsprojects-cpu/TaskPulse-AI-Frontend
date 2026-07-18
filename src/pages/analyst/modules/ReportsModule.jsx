import React from 'react';

const ReportsModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">KPI Reports & Analytics</h2>
      </div>
      <div className="module-content">
        <p>Generate, view, and export productivity trends and AI prediction accuracy reports.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Analytics charts and report tables will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
