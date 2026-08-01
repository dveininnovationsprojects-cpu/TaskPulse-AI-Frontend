import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import { Plus, Edit2, Trash2, X, Eye, ChevronDown } from 'lucide-react';

const TasksModule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskWorkLogs, setTaskWorkLogs] = useState([]);
  const [taskBlockers, setTaskBlockers] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Custom Dropdown State & Refs
  const [openDropdown, setOpenDropdown] = useState(null);
  const assigneeRef = useRef(null);
  const sprintRef = useRef(null);
  const priorityRef = useRef(null);
  const statusRef = useRef(null);
  const complexityRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        assigneeRef.current && !assigneeRef.current.contains(e.target) &&
        sprintRef.current && !sprintRef.current.contains(e.target) &&
        priorityRef.current && !priorityRef.current.contains(e.target) &&
        statusRef.current && !statusRef.current.contains(e.target) &&
        complexityRef.current && !complexityRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    projectId: '',
    sprintId: '',
    assigneeId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimatedHours: '',
    complexity: 'Medium',
    deadline: ''
  });
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  const fetchMetadata = async () => {
    try {
      const [projRes, sprintRes, userRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/sprints').catch(() => ({ data: [] })),
        api.get('/api/users').catch(() => ({ data: [] }))
      ]);

      const projectsData = projRes.data || [];
      setProjects(projectsData);
      setSprints(sprintRes.data || []);

      const rawUsers = userRes.data || [];
      const unassignableRoles = ['ADMIN', 'PROJECT_MANAGER', 'CLIENT_VIEWER'];
      const assignableUsers = rawUsers.filter(u => {
        if (!u || !u.role) return true;
        const r = u.role.toUpperCase();
        return !unassignableRoles.includes(r) && !r.includes('ADMIN') && !r.includes('MANAGER') && !r.includes('CLIENT');
      });
      setUsers(assignableUsers);

      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects metadata.');
    }
  };

  const fetchTasks = async (projectId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/tasks/project/${projectId}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      } else if (data && Array.isArray(data.content)) {
        setTasks(data.content);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks for this project.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (mode, task = null) => {
    setModalMode(mode);
    setSubmitError('');
    setOpenDropdown(null);
    if (mode === 'edit' && task) {
      setSelectedTaskId(task.id);
      setFormData({
        taskName: task.taskName || '',
        description: task.description || '',
        projectId: task.project?.id || selectedProjectId,
        sprintId: task.sprint?.id || '',
        assigneeId: task.assignee?.id || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        estimatedHours: task.estimatedHours || '',
        complexity: task.complexity || 'Medium',
        deadline: task.deadline || ''
      });
    } else {
      setSelectedTaskId(null);
      setFormData({
        taskName: '',
        description: '',
        projectId: selectedProjectId,
        sprintId: '',
        assigneeId: '',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: '',
        complexity: 'Medium',
        deadline: ''
      });
    }
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        projectId: parseInt(formData.projectId, 10),
        sprintId: formData.sprintId ? parseInt(formData.sprintId, 10) : null,
        assigneeId: formData.assigneeId ? parseInt(formData.assigneeId, 10) : null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        deadline: formData.deadline || null
      };

      if (modalMode === 'create') {
        await api.post('/api/tasks', payload);
      } else {
        await api.put(`/api/tasks/${selectedTaskId}`, payload);
      }
      setShowFormModal(false);
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState(null);

  const handleDelete = (id) => {
    setConfirmDeleteTaskId(id);
  };

  const executeDeleteTask = async () => {
    if (!confirmDeleteTaskId) return;
    try {
      await api.delete(`/api/tasks/${confirmDeleteTaskId}`);
      setConfirmDeleteTaskId(null);
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error(err);
      setError('Failed to delete task.');
      setConfirmDeleteTaskId(null);
    }
  };

  const fetchTaskDetails = async (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const [logsRes, blockersRes] = await Promise.all([
        api.get(`/api/worklogs/task/${task.id}`).catch(() => ({ data: [] })),
        api.get(`/api/blockers/task/${task.id}`).catch(() => ({ data: [] }))
      ]);
      setTaskWorkLogs(logsRes.data || []);
      setTaskBlockers(blockersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Tasks Directory</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: '1px solid rgba(17,177,198,0.2)',
              background: 'white',
              color: '#0c5965',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            <option value="" disabled>Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
          <button 
            className="btn-pill" 
            style={{ marginTop: 0, padding: '10px 24px' }}
            onClick={() => handleOpenFormModal('create')}
            disabled={!selectedProjectId}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Add Task
          </button>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {!selectedProjectId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>
            Please select a project to view tasks.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading tasks...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Complexity</th>
                  <th>Hours (Est / Act)</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!Array.isArray(tasks) || tasks.length === 0) ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                      No tasks found in this project.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
                      <td>{task.assignee?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}</td>
                      <td>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${task.status}`}>
                          {task.status ? task.status.replace('_', ' ') : 'TODO'}
                        </span>
                      </td>
                      <td>{task.complexity || '-'}</td>
                      <td>{task.estimatedHours || 0}h / {task.actualHours || 0}h</td>
                      <td>{task.deadline || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="action-btn edit-btn" style={{ color: '#11b1c6' }} onClick={() => fetchTaskDetails(task)} title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="action-btn edit-btn" onClick={() => handleOpenFormModal('edit', task)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(task.id)} title="Delete">
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

      {/* Task Create / Edit Modal via Portal */}
      {showFormModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Task' : 'Edit Task'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {submitError && <div className="error-message">{submitError}</div>}

              <div className="form-group">
                <label>Task Name *</label>
                <input
                  type="text"
                  name="taskName"
                  className="form-control"
                  placeholder="e.g. User Auth API Integration"
                  required
                  value={formData.taskName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Task Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Implement login and register endpoints with JWT authentication"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ resize: 'vertical', borderRadius: '16px' }}
                />
              </div>

              {/* Row: Assignee & Sprint */}
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                {/* Custom Assignee Select */}
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={assigneeRef}>
                  <label>Assignee</label>
                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: formData.assigneeId ? '#0c5965' : '#89c4d1' }}>
                      {formData.assigneeId 
                        ? (users.find(u => u.id.toString() === formData.assigneeId.toString()) 
                            ? `${users.find(u => u.id.toString() === formData.assigneeId.toString()).name} (${users.find(u => u.id.toString() === formData.assigneeId.toString()).role ? users.find(u => u.id.toString() === formData.assigneeId.toString()).role.replace('_', ' ') : 'Member'})`
                            : 'Select Assignee')
                        : 'Unassigned'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: openDropdown === 'assignee' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {openDropdown === 'assignee' && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      <div 
                        className="custom-select-option"
                        onClick={() => { setFormData(prev => ({ ...prev, assigneeId: '' })); setOpenDropdown(null); }}
                        style={{ padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}
                      >
                        Unassigned
                      </div>
                      {users
                        .filter(u => {
                          if (!u || !u.role) return true;
                          const r = u.role.toUpperCase();
                          return !r.includes('ADMIN') && !r.includes('MANAGER') && !r.includes('CLIENT');
                        })
                        .map(u => (
                        <div
                          key={u.id}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, assigneeId: u.id.toString() })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.assigneeId.toString() === u.id.toString() ? '#11b1c6' : '#0c5965', fontWeight: formData.assigneeId.toString() === u.id.toString() ? '600' : '500', backgroundColor: formData.assigneeId.toString() === u.id.toString() ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                          onMouseLeave={(e) => { if (formData.assigneeId.toString() !== u.id.toString()) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {u.name} ({u.role ? u.role.replace('_', ' ') : 'Member'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Sprint Select */}
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={sprintRef}>
                  <label>Sprint</label>
                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'sprint' ? null : 'sprint')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: formData.sprintId ? '#0c5965' : '#89c4d1' }}>
                      {formData.sprintId 
                        ? (sprints.find(s => s.id.toString() === formData.sprintId.toString())?.sprintName || 'Select Sprint')
                        : 'No Sprint'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: openDropdown === 'sprint' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {openDropdown === 'sprint' && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      <div 
                        className="custom-select-option"
                        onClick={() => { setFormData(prev => ({ ...prev, sprintId: '' })); setOpenDropdown(null); }}
                        style={{ padding: '8px 14px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}
                      >
                        No Sprint
                      </div>
                      {sprints.map(s => (
                        <div
                          key={s.id}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, sprintId: s.id.toString() })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.sprintId.toString() === s.id.toString() ? '#11b1c6' : '#0c5965', fontWeight: formData.sprintId.toString() === s.id.toString() ? '600' : '500', backgroundColor: formData.sprintId.toString() === s.id.toString() ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                          onMouseLeave={(e) => { if (formData.sprintId.toString() !== s.id.toString()) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {s.sprintName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row: Priority & Status */}
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                {/* Custom Priority Select */}
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={priorityRef}>
                  <label>Priority</label>
                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: '#0c5965' }}>
                      {formData.priority ? (formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase()) : 'Medium'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: openDropdown === 'priority' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {openDropdown === 'priority' && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      {[
                        { label: 'Low', value: 'LOW' },
                        { label: 'Medium', value: 'MEDIUM' },
                        { label: 'High', value: 'HIGH' },
                        { label: 'Critical', value: 'CRITICAL' }
                      ].map(p => (
                        <div
                          key={p.value}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, priority: p.value })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.priority === p.value ? '#11b1c6' : '#0c5965', fontWeight: formData.priority === p.value ? '600' : '500', backgroundColor: formData.priority === p.value ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                          onMouseLeave={(e) => { if (formData.priority !== p.value) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {p.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Status Select */}
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={statusRef}>
                  <label>Status</label>
                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: '#0c5965' }}>
                      {formData.status ? (formData.status.charAt(0) + formData.status.slice(1).toLowerCase()).replace('_', ' ') : 'To Do'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: openDropdown === 'status' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {openDropdown === 'status' && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      {[
                        { label: 'To Do', value: 'TODO' },
                        { label: 'In Progress', value: 'IN_PROGRESS' },
                        { label: 'Blocked', value: 'BLOCKED' },
                        { label: 'Done', value: 'DONE' }
                      ].map(s => (
                        <div
                          key={s.value}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, status: s.value })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.status === s.value ? '#11b1c6' : '#0c5965', fontWeight: formData.status === s.value ? '600' : '500', backgroundColor: formData.status === s.value ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                          onMouseLeave={(e) => { if (formData.status !== s.value) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row: Est. Hours & Complexity */}
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    name="estimatedHours"
                    className="form-control"
                    placeholder="e.g. 16"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Custom Complexity Select */}
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={complexityRef}>
                  <label>Complexity</label>
                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'complexity' ? null : 'complexity')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: '#0c5965' }}>
                      {formData.complexity || 'Medium'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: openDropdown === 'complexity' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {openDropdown === 'complexity' && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      {['Low', 'Medium', 'High'].map(c => (
                        <div
                          key={c}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, complexity: c })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.complexity === c ? '#11b1c6' : '#0c5965', fontWeight: formData.complexity === c ? '600' : '500', backgroundColor: formData.complexity === c ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                          onMouseLeave={(e) => { if (formData.complexity !== c) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  className="form-control"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Task Details Popup Modal via Portal */}
      {showDetailModal && selectedTask && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>Task Detail: {selectedTask.taskName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '0.9rem' }}>
              <div>
                <p><strong>Project:</strong> {selectedTask.project?.projectName || 'None'}</p>
                <p><strong>Sprint:</strong> {selectedTask.sprint?.sprintName || 'None'}</p>
                <p><strong>Assignee:</strong> {selectedTask.assignee?.name || 'Unassigned'}</p>
                <p><strong>Complexity:</strong> {selectedTask.complexity || 'Unassigned'}</p>
              </div>
              <div>
                <p><strong>Priority:</strong> {selectedTask.priority}</p>
                <p><strong>Status:</strong> {selectedTask.status}</p>
                <p><strong>Est. Hours:</strong> {selectedTask.estimatedHours || 0} hrs</p>
                <p><strong>Actual Hours:</strong> {selectedTask.actualHours || 0} hrs</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#0c5965' }}>Description:</strong>
              <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', color: '#334155', fontSize: '0.9rem', marginTop: '6px' }}>
                {selectedTask.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#0c5965', fontSize: '0.95rem' }}>Work Logs History</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading logs...</p>
                ) : taskWorkLogs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No logs reported.</p>
                ) : (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {taskWorkLogs.map(log => (
                      <div key={log.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0c5965', fontWeight: 500 }}>
                          <span>{log.loggedHours} hrs (by {log.user?.name || 'User'})</span>
                          <span>{log.logDate}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#0c5965', fontSize: '0.95rem' }}>Blockers List</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading blockers...</p>
                ) : taskBlockers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No blockers found.</p>
                ) : (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {taskBlockers.map(blocker => (
                      <div key={blocker.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                          <span style={{ color: blocker.status === 'ACTIVE' ? '#ef4444' : '#059669' }}>
                            {blocker.status}
                          </span>
                          <span style={{ color: '#64748b' }}>{blocker.createdAt ? blocker.createdAt.substring(0,10) : ''}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#475569' }}><strong>Reason:</strong> {blocker.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal for Delete Task */}
      {confirmDeleteTaskId && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px' }}>
            <div className="modal-bg-glass"></div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
            </div>
            <h3 style={{ color: '#0c5965', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600 }}>Delete Task?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary-pill" onClick={() => setConfirmDeleteTaskId(null)}>
                Cancel
              </button>
              <button className="btn-pill" style={{ marginTop: 0, background: '#ef4444', borderColor: '#ef4444' }} onClick={executeDeleteTask}>
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TasksModule;
