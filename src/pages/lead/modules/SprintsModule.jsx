import React from 'react';

const SprintsModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Sprint Planning</h2>
      </div>
      <div className="module-content">
        <p>Plan sprints, define sprint goals, set team capacity, and link tasks to sprint cycles.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Sprints list table will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default SprintsModule;
