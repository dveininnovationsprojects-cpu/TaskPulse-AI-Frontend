import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, ChevronDown, Info } from 'lucide-react';
import api from '../services/api';
import './ProjectsManagement.css';

const TooltipText = ({ text, maxLength = 25 }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(10, rect.left + window.scrollX - 150) // Shift left slightly to center, but don't go off screen
      });
    }
    setShowTooltip(!showTooltip);
  };

  if (!text) return <span>-</span>;
  if (text.length <= maxLength) return <span>{text}</span>;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span>{text.substring(0, maxLength)}...</span>
      <button 
        ref={buttonRef}
        onClick={handleToggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#11b1c6', padding: 0, display: 'flex', alignItems: 'center' }}
        title="View details"
      >
        <Info size={16} />
      </button>
      {showTooltip && createPortal(
        <div 
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(17, 177, 198, 0.4)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(12, 89, 101, 0.15)',
            zIndex: 99999,
            width: 'max-content',
            maxWidth: '300px',
            whiteSpace: 'normal',
            color: '#0c5965',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            fontWeight: 'normal',
            textAlign: 'left'
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
};

const ProjectsManagement = ({ role }) => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    ownerId: '',
    startDate: '',
    deadline: '',
    status: 'PLANNING',
    priority: 'MEDIUM'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ action: '', title: '', message: '', payload: null });

  // Dropdown state
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);

  // Authorization checks
  const isAdmin = role === 'ADMIN';
  const isPM = role === 'PROJECT_MANAGER';
  const canEdit = isAdmin || isPM;
  const canDelete = isAdmin;

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target)) {
        setIsOwnerDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setIsPriorityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && data.id) return [data];
    return [];
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/users').catch(() => ({ data: [] }))
      ]);

      let projList = normalizeArray(projRes.data);

      if (role === 'CLIENT_VIEWER' && projList.length === 0) {
        const storedId = localStorage.getItem('projectId') || localStorage.getItem('registeredProjectId');
        const candidateIds = storedId 
          ? [storedId, ...Array.from({ length: 20 }, (_, i) => (i + 1).toString()).filter(id => id !== storedId)] 
          : Array.from({ length: 20 }, (_, i) => (i + 1).toString());

        for (const id of candidateIds) {
          try {
            const specificProjRes = await api.get(`/api/projects/${id}`);
            if (specificProjRes.data && specificProjRes.data.id) {
              projList = [specificProjRes.data];
              localStorage.setItem('projectId', specificProjRes.data.id.toString());
              break;
            }
          } catch (e) {
            // Ignore access denied errors for projects not assigned to this client
          }
        }
      }

      setProjects(projList);
      setUsers(normalizeArray(userRes.data));
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(normalizeArray(response.data));
    } catch (err) {
      console.error(err);
    }
  };

  // Potential owners (typically PROJECT_MANAGER or ADMIN)
  const potentialOwners = users.filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'ADMIN');

  const handleOpenModal = (mode, project = null) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && project) {
      setCurrentProjectId(project.id);
      setFormData({
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        ownerId: project.owner ? project.owner.id.toString() : '',
        startDate: project.startDate || '',
        deadline: project.deadline || '',
        status: project.status || 'PLANNING',
        priority: project.priority || 'MEDIUM'
      });
    } else {
      setCurrentProjectId(null);
      setFormData({
        projectName: '',
        clientName: '',
        ownerId: '',
        startDate: '',
        deadline: '',
        status: 'PLANNING',
        priority: 'MEDIUM'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.projectName || !formData.ownerId) {
       setFormError('Project Name and Owner are required.');
       return;
    }

    setConfirmConfig({
      action: modalMode,
      title: modalMode === 'create' ? 'Confirm Add Project' : 'Confirm Update Project',
      message: modalMode === 'create' ? 'Are you sure you want to create this project?' : 'Are you sure you want to update this project?',
      payload: { ...formData }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteClick = (project) => {
    setConfirmConfig({
      action: 'delete',
      title: 'Confirm Delete Project',
      message: `Are you sure you want to completely delete the project "${project.projectName}"? This action cannot be undone.`,
      payload: project
    });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const { action, payload } = confirmConfig;
      
      if (action === 'create' || action === 'edit') {
        const data = {
          projectName: payload.projectName,
          clientName: payload.clientName,
          startDate: payload.startDate || null,
          deadline: payload.deadline || null,
          status: payload.status,
          priority: payload.priority
        };
        
        if (action === 'create') {
          data.owner = { id: parseInt(payload.ownerId, 10) };
          await api.post('/api/projects', data);
        } else {
          data.ownerId = parseInt(payload.ownerId, 10);
          await api.put(`/api/projects/${currentProjectId}`, data);
        }
        
        await fetchProjects();
        handleCloseModal();
      } else if (action === 'delete') {
        await api.delete(`/api/projects/${payload.id}`);
        await fetchProjects();
      }
      
      setShowConfirmModal(false);
    } catch (err) {
      if (confirmConfig.action === 'delete') {
        alert('Failed to delete: ' + (err.response?.data?.message || err.message));
      } else {
        setFormError(err.response?.data?.message || err.message || 'Failed to process request.');
        setShowConfirmModal(false); // Close confirm modal to show error on main modal
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const displayTotalPages = totalPages || 1;

  const getPaginationNumbers = () => {
    const pageNumbers = [];
    if (displayTotalPages <= 5) {
      for (let i = 1; i <= displayTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', displayTotalPages);
      } else if (currentPage >= displayTotalPages - 2) {
        pageNumbers.push(1, '...', displayTotalPages - 3, displayTotalPages - 2, displayTotalPages - 1, displayTotalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', displayTotalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Projects Overview</h2>
        {canEdit && (
          <div className="add-btn-wrapper">
            <button 
              className="btn-pill" 
              style={{ marginTop: 0, padding: '10px 24px' }}
              onClick={() => handleOpenModal('create')}
            >
              <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Add Project
            </button>
          </div>
        )}
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
                  <th>Owner</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Priority</th>
                  {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentProjects.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '30px' }}>
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  currentProjects.map(proj => (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 600 }}>
                        <TooltipText text={proj.projectName} maxLength={20} />
                      </td>
                      <td>
                        <TooltipText text={proj.clientName || '-'} maxLength={20} />
                      </td>
                      <td>{proj.owner ? proj.owner.name : '-'}</td>
                      <td>{proj.deadline || '-'}</td>
                      <td><span className={`status-badge status-${proj.status}`}>{proj.status}</span></td>
                      <td className={`priority-${proj.priority}`}>{proj.priority}</td>
                      {canEdit && (
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleOpenModal('edit', proj)}
                          >
                            <Edit2 size={16} />
                          </button>
                          {canDelete && (
                            <button 
                              className="action-btn delete-btn" 
                              title="Delete"
                              onClick={() => handleDeleteClick(proj)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {getPaginationNumbers().map((num, idx) => (
              <button
                key={idx}
                className={`pagination-btn ${num === currentPage ? 'active' : ''} ${num === '...' ? 'dots' : ''}`}
                onClick={() => num !== '...' && setCurrentPage(num)}
                disabled={num === '...'}
              >
                {num}
              </button>
            ))}
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
              disabled={currentPage === displayTotalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Main Modal */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Project' : 'Edit Project'}</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="error-message" style={{ padding: '8px 12px', marginBottom: '16px' }}>{formError}</div>}
              
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  className="form-control"
                  placeholder="e.g. TaskPulse AI Backend"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  className="form-control"
                  placeholder="e.g. Nexora Solutions"
                  value={formData.clientName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group" style={{ position: 'relative' }} ref={ownerDropdownRef}>
                <label>Project Owner *</label>
                <div 
                  className="form-control" 
                  onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <span style={{ color: formData.ownerId ? '#0c5965' : '#89c4d1' }}>
                    {formData.ownerId 
                      ? potentialOwners.find(u => u.id.toString() === formData.ownerId.toString())?.name || 'Unknown'
                      : 'Select project owner...'}
                  </span>
                  <ChevronDown 
                    size={20} 
                    color="#11b1c6" 
                    style={{ 
                      transform: isOwnerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.25s ease' 
                    }} 
                  />
                </div>
                
                {isOwnerDropdownOpen && (
                  <div 
                    className="custom-select-options"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(17, 177, 198, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)',
                      zIndex: 100,
                      overflowY: 'auto',
                      maxHeight: '150px',
                      marginTop: '4px',
                      padding: '4px 0'
                    }}
                  >
                    {potentialOwners.length === 0 ? (
                      <div style={{ padding: '8px 16px', color: '#64748b', fontSize: '0.9rem' }}>No eligible owners available.</div>
                    ) : (
                      potentialOwners.map(owner => (
                        <div
                          key={owner.id}
                          className="custom-select-option"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, ownerId: owner.id.toString() }));
                            setIsOwnerDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            color: formData.ownerId === owner.id.toString() ? '#34c3d3' : '#0c5965',
                            fontWeight: formData.ownerId === owner.id.toString() ? '600' : '500',
                            backgroundColor: formData.ownerId === owner.id.toString() ? 'rgba(52, 195, 211, 0.08)' : 'transparent',
                            transition: 'all 0.15s ease',
                            fontSize: '0.9rem'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)';
                            e.target.style.color = '#34c3d3';
                          }}
                          onMouseLeave={(e) => {
                            if (formData.ownerId !== owner.id.toString()) {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#0c5965';
                            }
                          }}
                        >
                          {owner.name} <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>({owner.role})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    className="form-control"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={statusDropdownRef}>
                  <label>Status</label>
                  <div 
                    className="form-control" 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                  >
                    <span style={{ color: formData.status ? '#0c5965' : '#89c4d1' }}>
                      {formData.status ? (formData.status.charAt(0) + formData.status.slice(1).toLowerCase()).replace('_', ' ') : 'Select Status'}
                    </span>
                    <ChevronDown size={20} color="#11b1c6" style={{ transform: isStatusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
                  </div>
                  {isStatusDropdownOpen && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.2)', borderRadius: '12px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 100, overflowY: 'auto', maxHeight: '150px', marginTop: '4px', padding: '4px 0' }}>
                      {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map(status => (
                        <div
                          key={status}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, status })); setIsStatusDropdownOpen(false); }}
                          style={{ padding: '10px 16px', cursor: 'pointer', color: formData.status === status ? '#34c3d3' : '#0c5965', fontWeight: formData.status === status ? '600' : '500', backgroundColor: formData.status === status ? 'rgba(52, 195, 211, 0.08)' : 'transparent', transition: 'all 0.15s ease', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)'; e.target.style.color = '#34c3d3'; }}
                          onMouseLeave={(e) => { if (formData.status !== status) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {(status.charAt(0) + status.slice(1).toLowerCase()).replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={priorityDropdownRef}>
                  <label>Priority</label>
                  <div 
                    className="form-control" 
                    onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                  >
                    <span style={{ color: formData.priority ? '#0c5965' : '#89c4d1' }}>
                      {formData.priority ? (formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase()) : 'Select Priority'}
                    </span>
                    <ChevronDown size={20} color="#11b1c6" style={{ transform: isPriorityDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
                  </div>
                  {isPriorityDropdownOpen && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.2)', borderRadius: '12px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 100, overflowY: 'auto', maxHeight: '150px', marginTop: '4px', padding: '4px 0' }}>
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(priority => (
                        <div
                          key={priority}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, priority })); setIsPriorityDropdownOpen(false); }}
                          style={{ padding: '10px 16px', cursor: 'pointer', color: formData.priority === priority ? '#34c3d3' : '#0c5965', fontWeight: formData.priority === priority ? '600' : '500', backgroundColor: formData.priority === priority ? 'rgba(52, 195, 211, 0.08)' : 'transparent', transition: 'all 0.15s ease', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)'; e.target.style.color = '#34c3d3'; }}
                          onMouseLeave={(e) => { if (formData.priority !== priority) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {(priority.charAt(0) + priority.slice(1).toLowerCase())}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155', boxShadow: 'none' }} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
      {showConfirmModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
            <div className="modal-bg-glass"></div>
            <h3 style={{ color: '#0c5965', marginBottom: '16px', fontSize: '1.4rem', position: 'relative', zIndex: 2 }}>
              {confirmConfig.title}
            </h3>
            <p style={{ color: '#475569', marginBottom: '30px', lineHeight: '1.5', position: 'relative', zIndex: 2 }}>
              {confirmConfig.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              <button 
                className="btn-pill" 
                style={{ background: '#e2e8f0', color: '#475569', boxShadow: 'none' }}
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                No, Cancel
              </button>
              <button 
                className="btn-pill" 
                style={{ background: confirmConfig.action === 'delete' ? '#ef4444' : '#11b1c6' }}
                onClick={executeConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectsManagement;
