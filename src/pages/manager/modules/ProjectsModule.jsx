import React from 'react';

const ProjectsModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">My Projects</h2>
      </div>
      <div className="module-content">
        <p>View and manage projects assigned to you. Track timelines and client details.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Projects list table will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectsModule;
