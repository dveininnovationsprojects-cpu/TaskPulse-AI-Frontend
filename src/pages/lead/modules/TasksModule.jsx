import React from 'react';

const TasksModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Team Tasks</h2>
      </div>
      <div className="module-content">
        <p>Assign tasks, review work logs, and update sprint status.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Tasks list table will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default TasksModule;
