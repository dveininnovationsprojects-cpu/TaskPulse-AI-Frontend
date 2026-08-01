import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import { predictTaskDelay, recommendEmployee } from '../../../services/aiService';
import { Plus, Edit2, Trash2, X, Eye, ChevronDown, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

const TasksModule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Suggestions & Delay Risks
  const [aiRecommendationBadge, setAiRecommendationBadge] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [taskDelayRisks, setTaskDelayRisks] = useState({});

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

      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Could not load metadata.');
    }
  };

  const fetchTasks = async (projectId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/tasks/project/${projectId}`);
      const taskList = res.data || [];
      setTasks(taskList);

      // Fetch AI Delay Risk prediction for each task inline
      fetchAiDelayRisks(taskList);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks for the selected project.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAiDelayRisks = async (taskList) => {
    const riskMap = {};
    for (const task of taskList) {
      try {
        const res = await predictTaskDelay({
          story_points: task.storyPoints || (task.estimatedHours ? task.estimatedHours / 2 : 5),
          priority: task.priority || 'MEDIUM',
          developer_experience_years: 3.0,
          developer_active_tasks: 3,
          sprint_remaining_days: 5,
          historical_delay_rate: 0.2,
          task_id: task.id,
          estimated_hours: task.estimatedHours || 8,
          hours_logged: task.actualHours || 0,
          blocker_count: 0
        });
        riskMap[task.id] = res.risk_level || 'LOW';
      } catch (e) {
        riskMap[task.id] = 'LOW';
      }
    }
    setTaskDelayRisks(riskMap);
  };

  // Trigger inline AI Employee Suggestion for Task Assignee
  const handleAiSuggestAssignee = async () => {
    setIsAiSuggesting(true);
    setAiRecommendationBadge('');
    try {
      const candidateList = users.map(u => ({
        id: u.id,
        name: u.name,
        skills: [u.name, formData.complexity || 'Medium', formData.taskName || 'Feature Task'],
        workload_score: 45.0,
        active_tasks: 2,
        employee_id: u.id.toString(),
        active_task_hours: 20.0,
        available_capacity_hours: 40.0,
        past_performance_score: 0.90
      }));

      const res = await recommendEmployee({
        task_title: formData.taskName || 'Feature Task',
        required_skills: [formData.taskName || 'Feature', formData.complexity || 'Medium'],
        story_points: formData.estimatedHours ? parseFloat(formData.estimatedHours) / 2 : 3.0,
        priority: formData.priority || 'HIGH',
        candidates: candidateList,
        task_id: selectedTaskId ? selectedTaskId.toString() : '1'
      });

      const topEmp = res.recommended_employee || (res.rankings && res.rankings[0]);
      if (topEmp) {
        const topEmpId = topEmp.id || topEmp.employee_id;
        setFormData(prev => ({ ...prev, assigneeId: String(topEmpId) }));
        const matchScore = topEmp.match_score || (topEmp.recommendation_score ? topEmp.recommendation_score * 100 : 92);
        setAiRecommendationBadge(`⭐ AI Suggested: ${topEmp.name} (Match Score: ${matchScore.toFixed(0)}%)`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleOpenFormModal = (mode, task = null) => {
    setModalMode(mode);
    setSubmitError('');
    setAiRecommendationBadge('');
    setOpenDropdown(null);

    if (mode === 'edit' && task) {
      setSelectedTaskId(task.id);
      setFormData({
        taskName: task.taskName || '',
        description: task.description || '',
        projectId: task.project ? task.project.id.toString() : selectedProjectId,
        sprintId: task.sprint ? task.sprint.id.toString() : '',
        assigneeId: task.assignee ? task.assignee.id.toString() : '',
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

  const fetchTaskDetails = async (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const [wRes, bRes] = await Promise.all([
        api.get(`/api/worklogs/task/${task.id}`).catch(() => ({ data: [] })),
        api.get(`/api/blockers/task/${task.id}`).catch(() => ({ data: [] }))
      ]);
      setTaskWorkLogs(wRes.data || []);
      setTaskBlockers(bRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.taskName.trim()) {
      setSubmitError('Task Name is required.');
      return;
    }
    if (!formData.projectId) {
      setSubmitError('Project is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const projIdNum = parseInt(formData.projectId, 10);
      const sprintIdNum = formData.sprintId ? parseInt(formData.sprintId, 10) : null;
      const assigneeIdNum = formData.assigneeId ? parseInt(formData.assigneeId, 10) : null;

      const payload = {
        taskName: formData.taskName,
        description: formData.description,
        projectId: projIdNum,
        sprintId: sprintIdNum,
        assigneeId: assigneeIdNum,
        project: { id: projIdNum },
        sprint: sprintIdNum ? { id: sprintIdNum } : null,
        assignee: assigneeIdNum ? { id: assigneeIdNum } : null,
        status: formData.status || 'TODO',
        priority: formData.priority || 'MEDIUM',
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
        complexity: formData.complexity || 'Medium',
        deadline: formData.deadline ? formData.deadline : null
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

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/tasks/${taskId}`);
        fetchTasks(selectedProjectId);
      } catch (err) {
        console.error(err);
        alert('Failed to delete task.');
      }
    }
  };

  return (
    <div className="module-container">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="module-title">Tasks Management</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select 
            className="form-control"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ width: '220px' }}
          >
            <option value="">Select Project</option>
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading tasks & AI delay predictions...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>AI Delay Risk</th>
                  <th>Hours (Est / Act)</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                      No tasks found in this project.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => {
                    const delayRisk = taskDelayRisks[task.id] || 'LOW';
                    return (
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
                        <td>
                          <span className={`score-badge ${delayRisk}`} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                            AI Risk: {delayRisk}
                          </span>
                        </td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Create / Edit Modal */}
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
                  className="form-control"
                  placeholder="Task title..."
                  value={formData.taskName}
                  onChange={(e) => setFormData(p => ({ ...p, taskName: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Task details & requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Assignee & AI Suggestion Button */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={assigneeRef}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Assignee</label>
                    <button
                      type="button"
                      onClick={handleAiSuggestAssignee}
                      disabled={isAiSuggesting}
                      style={{ background: 'none', border: 'none', color: '#11b1c6', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={14} className={isAiSuggesting ? 'spin' : ''} />
                      {isAiSuggesting ? 'AI Matching...' : 'AI Suggest Assignee'}
                    </button>
                  </div>

                  {aiRecommendationBadge && (
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginBottom: '6px' }}>
                      {aiRecommendationBadge}
                    </div>
                  )}

                  <div 
                    className="form-control" 
                    onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: formData.assigneeId ? '#0c5965' : '#89c4d1' }}>
                      {formData.assigneeId 
                        ? (users.find(u => u.id.toString() === formData.assigneeId.toString()) 
                            ? `${users.find(u => u.id.toString() === formData.assigneeId.toString()).name}`
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
                      {users.map(u => (
                        <div
                          key={u.id}
                          className="custom-select-option"
                          onClick={() => { setFormData(prev => ({ ...prev, assigneeId: u.id.toString() })); setOpenDropdown(null); }}
                          style={{ padding: '8px 14px', cursor: 'pointer', color: formData.assigneeId.toString() === u.id.toString() ? '#11b1c6' : '#0c5965', fontWeight: formData.assigneeId.toString() === u.id.toString() ? '600' : '500', backgroundColor: formData.assigneeId.toString() === u.id.toString() ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                        >
                          {u.name} ({u.role ? u.role.replace('_', ' ') : 'Developer'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                        >
                          {s.sprintName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    placeholder="e.g. 8.0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData(p => ({ ...p, estimatedHours: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.deadline}
                    onChange={(e) => setFormData(p => ({ ...p, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155' }} onClick={() => setShowFormModal(false)}>
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
    </div>
  );
};

export default TasksModule;
