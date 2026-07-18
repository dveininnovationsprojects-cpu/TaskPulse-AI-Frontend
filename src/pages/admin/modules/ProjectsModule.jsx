import React from 'react';

const ProjectsModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Project Management</h2>
      </div>
      <div className="module-content">
        <p>View all projects, client details, deadlines, and project statuses.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Projects list table will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectsModule;
