import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ProjectsModule = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    clientName: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode, project = null) => {
    setModalMode(mode);
    setSubmitError('');
    if (mode === 'edit' && project) {
      setSelectedProjectId(project.id);
      setFormData({
        projectName: project.projectName || '',
        description: project.description || '',
        clientName: project.clientName || ''
      });
    } else {
      setSelectedProjectId(null);
      setFormData({
        projectName: '',
        description: '',
        clientName: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api.post('/api/projects', formData);
      } else {
        await api.put(`/api/projects/${selectedProjectId}`, formData);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will delete associated tasks.')) {
      try {
        await api.delete(`/api/projects/${id}`);
        fetchProjects();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Projects Management</h2>
        <button className="btn-pill" style={{ marginTop: 0, padding: '10px 24px' }} onClick={() => handleOpenModal('create')}>
          <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Add Project
        </button>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading projects...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map(proj => (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965' }}>{proj.projectName}</td>
                      <td>{proj.clientName || 'Internal'}</td>
                      <td>{proj.description || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="action-btn edit-btn" onClick={() => handleOpenModal('edit', proj)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(proj.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Project' : 'Edit Project'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {submitError && <div className="error-message">{submitError}</div>}

              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  className="form-control"
                  required
                  value={formData.projectName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  className="form-control"
                  placeholder="e.g. Nexora Corp"
                  value={formData.clientName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ resize: 'vertical', borderRadius: '12px' }}
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsModule;
