import React from 'react';

const MyTasksModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">My Tasks</h2>
      </div>
      <div className="module-content">
        <p>View your assigned tasks and update their status.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>My tasks list will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default MyTasksModule;
