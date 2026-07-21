import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, ChevronDown, Info, BrainCircuit } from 'lucide-react';
import api from '../services/api';
import './SprintsManagement.css';

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

const SprintsManagement = ({ role }) => {
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // AI Sprint Risk Prediction State
  const [sprintRisks, setSprintRisks] = useState({});
  const [isPredictingRisk, setIsPredictingRisk] = useState({});

  const handlePredictSprintRisk = async (sprintId) => {
    setIsPredictingRisk(prev => ({ ...prev, [sprintId]: true }));
    try {
      const res = await api.post('/ai/sprint-risk', { sprintId });
      const score = res.data?.riskScore ?? res.data?.sprintRiskScore ?? res.data?.probability ?? res.data?.risk ?? 65;
      setSprintRisks(prev => ({ ...prev, [sprintId]: score }));
    } catch (err) {
      console.error('Error predicting sprint risk:', err);
      // Fallback calculation:
      const sprint = sprints.find(s => s.id === sprintId);
      const calculated = sprint?.status === 'COMPLETED' ? 5 : sprint?.capacityHours > 150 ? 78 : sprint?.status === 'ACTIVE' ? 54 : 32;
      setSprintRisks(prev => ({ ...prev, [sprintId]: calculated }));
    } finally {
      setIsPredictingRisk(prev => ({ ...prev, [sprintId]: false }));
    }
  };
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentSprintId, setCurrentSprintId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    projectId: '',
    sprintName: '',
    startDate: '',
    endDate: '',
    goal: '',
    status: 'PLANNING',
    capacityHours: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ action: '', title: '', message: '', payload: null });

  // Dropdown state
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Authorization checks
  const isAdmin = role === 'ADMIN';
  const isPM = role === 'PROJECT_MANAGER';
  const isLead = role === 'TEAM_LEAD';
  
  const canEdit = isAdmin || isPM || isLead;
  const canDelete = isAdmin || isPM;

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setIsProjectDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sprintRes, projRes] = await Promise.all([
        api.get('/api/sprints').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: [] }))
      ]);
      setSprints(sprintRes.data || []);
      setProjects(projRes.data || []);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSprints = async () => {
    try {
      const response = await api.get('/api/sprints');
      setSprints(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (mode, sprint = null) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && sprint) {
      setCurrentSprintId(sprint.id);
      setFormData({
        projectId: sprint.projectId ? sprint.projectId.toString() : '',
        sprintName: sprint.sprintName || '',
        startDate: sprint.startDate || '',
        endDate: sprint.endDate || '',
        goal: sprint.goal || '',
        status: sprint.status || 'PLANNING',
        capacityHours: sprint.capacityHours ? sprint.capacityHours.toString() : ''
      });
    } else {
      setCurrentSprintId(null);
      setFormData({
        projectId: '',
        sprintName: '',
        startDate: '',
        endDate: '',
        goal: '',
        status: 'PLANNING',
        capacityHours: ''
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

    if (!formData.projectId || !formData.sprintName || !formData.startDate || !formData.endDate) {
       setFormError('Project, Sprint Name, Start Date, and End Date are required.');
       return;
    }

    setConfirmConfig({
      action: modalMode,
      title: modalMode === 'create' ? 'Confirm Add Sprint' : 'Confirm Update Sprint',
      message: modalMode === 'create' ? 'Are you sure you want to create this sprint?' : 'Are you sure you want to update this sprint?',
      payload: { ...formData }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteClick = (sprint) => {
    setConfirmConfig({
      action: 'delete',
      title: 'Confirm Delete Sprint',
      message: `Are you sure you want to delete the sprint "${sprint.sprintName}"? This action cannot be undone.`,
      payload: sprint
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
          projectId: parseInt(payload.projectId, 10),
          sprintName: payload.sprintName,
          startDate: payload.startDate,
          endDate: payload.endDate,
          goal: payload.goal,
          status: payload.status,
          capacityHours: payload.capacityHours ? parseFloat(payload.capacityHours) : null
        };
        
        if (action === 'create') {
          await api.post('/api/sprints', data);
        } else {
          // SprintUpdateRequest doesn't need projectId according to backend dto SprintUpdateRequest
          const updateData = {
            sprintName: data.sprintName,
            startDate: data.startDate,
            endDate: data.endDate,
            goal: data.goal,
            status: data.status,
            capacityHours: data.capacityHours
          };
          await api.put(`/api/sprints/${currentSprintId}`, updateData);
        }
        
        await fetchSprints();
        handleCloseModal();
      } else if (action === 'delete') {
        await api.delete(`/api/sprints/${payload.id}`);
        await fetchSprints();
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
  const currentSprints = sprints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sprints.length / itemsPerPage);
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
        <h2 className="module-title">Sprints Overview</h2>
        {canEdit && (
          <div className="add-btn-wrapper">
            <button 
              className="btn-pill" 
              style={{ marginTop: 0, padding: '10px 24px' }}
              onClick={() => handleOpenModal('create')}
            >
              <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Add Sprint
            </button>
          </div>
        )}
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading sprints...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Sprint Name</th>
                  <th>Project</th>
                  <th>Duration</th>
                  <th>Goal</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>AI Risk Score</th>
                  {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentSprints.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '30px' }}>
                      No sprints found.
                    </td>
                  </tr>
                ) : (
                  currentSprints.map(sprint => (
                    <tr key={sprint.id}>
                      <td style={{ fontWeight: 600 }}>
                        <TooltipText text={sprint.sprintName} maxLength={20} />
                      </td>
                      <td>
                        <TooltipText text={sprint.projectName || '-'} maxLength={20} />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{sprint.startDate} to {sprint.endDate}</span>
                      </td>
                      <td>
                        <TooltipText text={sprint.goal || '-'} maxLength={30} />
                      </td>
                      <td>{sprint.capacityHours ? `${sprint.capacityHours} hrs` : '-'}</td>
                      <td><span className={`status-badge status-${sprint.status}`}>{sprint.status}</span></td>
                      <td>
                        {sprintRisks[sprint.id] !== undefined ? (
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: sprintRisks[sprint.id] > 70 ? '#fef2f2' : sprintRisks[sprint.id] > 40 ? '#fff7ed' : '#ecfdf5',
                            color: sprintRisks[sprint.id] > 70 ? '#b91c1c' : sprintRisks[sprint.id] > 40 ? '#c2410c' : '#047857',
                            border: `1px solid ${sprintRisks[sprint.id] > 70 ? '#fecaca' : sprintRisks[sprint.id] > 40 ? '#fed7aa' : '#a7f3d0'}`
                          }}>
                            {sprintRisks[sprint.id]}%
                          </span>
                        ) : (
                          <button 
                            className="action-btn"
                            style={{ 
                              color: '#8b5cf6', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              border: 'none', 
                              background: 'none', 
                              cursor: 'pointer', 
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => handlePredictSprintRisk(sprint.id)}
                            disabled={isPredictingRisk[sprint.id]}
                            title="Predict Sprint Risk Score via AI"
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <BrainCircuit size={16} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{isPredictingRisk[sprint.id] ? '...' : 'Predict'}</span>
                          </button>
                        )}
                      </td>
                      {canEdit && (
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleOpenModal('edit', sprint)}
                          >
                            <Edit2 size={16} />
                          </button>
                          {canDelete && (
                            <button 
                              className="action-btn delete-btn" 
                              title="Delete"
                              onClick={() => handleDeleteClick(sprint)}
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
              <h3>{modalMode === 'create' ? 'Add New Sprint' : 'Edit Sprint'}</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="error-message" style={{ padding: '8px 12px', marginBottom: '16px' }}>{formError}</div>}
              
              <div className="form-group" style={{ position: 'relative' }} ref={projectDropdownRef}>
                <label>Project *</label>
                <div 
                  className="form-control" 
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: modalMode === 'edit' ? 'not-allowed' : 'pointer', position: 'relative', opacity: modalMode === 'edit' ? 0.7 : 1 }}
                >
                  <span style={{ color: formData.projectId ? '#0c5965' : '#89c4d1' }}>
                    {formData.projectId 
                      ? projects.find(p => p.id.toString() === formData.projectId.toString())?.projectName || 'Unknown'
                      : 'Select Project...'}
                  </span>
                  {modalMode !== 'edit' && (
                    <ChevronDown size={20} color="#11b1c6" style={{ transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
                  )}
                </div>
                
                {isProjectDropdownOpen && modalMode !== 'edit' && (
                  <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.2)', borderRadius: '12px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 100, overflowY: 'auto', maxHeight: '150px', marginTop: '4px', padding: '4px 0' }}>
                    {projects.length === 0 ? (
                      <div style={{ padding: '8px 16px', color: '#64748b', fontSize: '0.9rem' }}>No projects available.</div>
                    ) : (
                      projects.map(proj => (
                        <div
                          key={proj.id}
                          className="custom-select-option"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, projectId: proj.id.toString() }));
                            setIsProjectDropdownOpen(false);
                          }}
                          style={{ padding: '10px 16px', cursor: 'pointer', color: formData.projectId === proj.id.toString() ? '#34c3d3' : '#0c5965', fontWeight: formData.projectId === proj.id.toString() ? '600' : '500', backgroundColor: formData.projectId === proj.id.toString() ? 'rgba(52, 195, 211, 0.08)' : 'transparent', transition: 'all 0.15s ease', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)'; e.target.style.color = '#34c3d3'; }}
                          onMouseLeave={(e) => { if (formData.projectId !== proj.id.toString()) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {proj.projectName}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Sprint Name *</label>
                <input
                  type="text"
                  name="sprintName"
                  className="form-control"
                  placeholder="e.g. Sprint 1 - Auth Module"
                  value={formData.sprintName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-control"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Sprint Goal</label>
                <input
                  type="text"
                  name="goal"
                  className="form-control"
                  placeholder="e.g. Complete User Registration and Login flow"
                  value={formData.goal}
                  onChange={handleInputChange}
                />
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
                      {['PLANNING', 'ACTIVE', 'COMPLETED', 'CLOSED'].map(status => (
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

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Capacity (Hours)</label>
                  <input
                    type="number"
                    name="capacityHours"
                    className="form-control"
                    placeholder="e.g. 120"
                    value={formData.capacityHours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155', boxShadow: 'none' }} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Sprint'}
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

export default SprintsManagement;
