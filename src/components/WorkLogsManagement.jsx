import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Plus, Calendar, BookOpen, ChevronDown, User, Layers, Filter, Search, CheckCircle, Info, RefreshCw, FileText, CheckSquare, TrendingUp, Zap, Activity, X } from 'lucide-react';
import api, { getCurrentUser, refreshCurrentUser } from '../services/api';
import './WorkLogsManagement.css';

const WorkLogsManagement = ({ role = 'DEVELOPER' }) => {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedSprint, setSelectedSprint] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state for logging work
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    taskId: '',
    loggedHours: '',
    logDate: new Date().toISOString().split('T')[0],
    notes: '',
    progressPercent: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Custom Task Select state
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const taskRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskRef.current && !taskRef.current.contains(e.target)) {
        setIsTaskOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    initWorkLogsData();
  }, [role]);

  const initWorkLogsData = async () => {
    setIsLoading(true);
    setError('');
    try {
      let user = getCurrentUser();
      if (!user || !user.id) {
        user = await refreshCurrentUser().catch(() => null);
      }
      setCurrentUser(user);

      // Fetch reference metadata: users, projects, sprints
      const [usersRes, projectsRes, sprintsRes] = await Promise.all([
        api.get('/api/users').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/sprints').catch(() => ({ data: [] }))
      ]);

      const usersList = usersRes.data || [];
      const projectsList = projectsRes.data || [];
      const sprintsList = sprintsRes.data || [];

      let tasksList = [];
      if (projectsList.length > 0) {
        const taskPromises = projectsList.map(p => api.get(`/api/tasks/project/${p.id}`).then(r => r.data || []).catch(() => []));
        const taskResults = await Promise.all(taskPromises);
        tasksList = taskResults.flat();
      } else if (user && user.id) {
        tasksList = await api.get(`/api/tasks/assignee/${user.id}`).then(r => r.data || []).catch(() => []);
      }

      setUsers(usersList);
      setProjects(projectsList);
      setSprints(sprintsList);
      setTasks(tasksList);

      // Now fetch work logs according to role/permissions
      let fetchedLogs = [];
      const isLeadOrManagerOrAdmin = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_TEAM_LEAD'].includes(role?.toUpperCase() || '');

      if (isLeadOrManagerOrAdmin) {
        // Attempt to fetch work logs across team users or project endpoints
        const logPromises = usersList.map(u => 
          api.get(`/api/worklogs/user/${u.id}`).then(res => res.data || []).catch(() => [])
        );
        const myLogsPromise = api.get('/api/worklogs/my-worklogs').then(res => res.data || []).catch(() => []);
        
        const allUserLogsArrays = await Promise.all([myLogsPromise, ...logPromises]);
        const map = new Map();
        allUserLogsArrays.flat().forEach(l => {
          if (l && l.id) map.set(l.id, l);
        });
        fetchedLogs = Array.from(map.values());
      } else if (user && user.id) {
        // Developer, Analyst, Client Viewer
        try {
          const res = await api.get(`/api/worklogs/user/${user.id}`);
          fetchedLogs = res.data || [];
        } catch (e) {
          const resMy = await api.get('/api/worklogs/my-worklogs').catch(() => ({ data: [] }));
          fetchedLogs = resMy.data || [];
        }
      }

      // Sort logs descending by date/id
      fetchedLogs.sort((a, b) => new Date(b.logDate || b.createdAt || 0) - new Date(a.logDate || a.createdAt || 0));
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('WorkLogs load error:', err);
      setError('Failed to load work logs. Please verify network or authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchByUser = async (userIdStr) => {
    setSelectedUser(userIdStr);
    if (userIdStr === 'ALL') {
      initWorkLogsData();
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/api/worklogs/user/${userIdStr}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch logs for user ${userIdStr}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchByProject = async (projIdStr) => {
    setSelectedProject(projIdStr);
    if (projIdStr === 'ALL') {
      initWorkLogsData();
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/api/worklogs/project/${projIdStr}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch logs for project ${projIdStr}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchBySprint = async (sprintIdStr) => {
    setSelectedSprint(sprintIdStr);
    if (sprintIdStr === 'ALL') {
      initWorkLogsData();
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/api/worklogs/sprint/${sprintIdStr}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch logs for sprint ${sprintIdStr}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!formData.taskId) {
      setSubmitError('Please select an active task.');
      return;
    }
    if (!formData.loggedHours || parseFloat(formData.loggedHours) <= 0) {
      setSubmitError('Please enter valid hours spent.');
      return;
    }
    if (!formData.notes.trim()) {
      setSubmitError('Please enter notes describing the work done.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = currentUser || getCurrentUser();
      const payload = {
        taskId: parseInt(formData.taskId, 10),
        userId: user ? parseInt(user.id, 10) : null,
        loggedHours: parseFloat(formData.loggedHours),
        logDate: formData.logDate,
        notes: formData.notes,
        description: formData.notes,
        progressPercent: formData.progressPercent ? parseFloat(formData.progressPercent) : 0
      };

      await api.post('/api/worklogs', payload);
      setSubmitSuccess('Work log submitted successfully!');
      setFormData({
        taskId: '',
        loggedHours: '',
        logDate: new Date().toISOString().split('T')[0],
        notes: '',
        progressPercent: ''
      });
      setIsTaskOpen(false);

      setTimeout(() => {
        setSubmitSuccess('');
        setShowLogModal(false);
        initWorkLogsData();
      }, 1200);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to submit work log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logs locally by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const taskName = log.task?.taskName?.toLowerCase() || '';
    const userName = log.user?.name?.toLowerCase() || log.user?.email?.toLowerCase() || '';
    const notes = (log.description || log.notes || '').toLowerCase();
    return taskName.includes(q) || userName.includes(q) || notes.includes(q);
  });

  // Calculate summary stats
  const totalHours = filteredLogs.reduce((sum, l) => sum + (l.loggedHours || 0), 0);
  const totalLogsCount = filteredLogs.length;
  const uniqueTasksCount = new Set(filteredLogs.map(l => l.task?.id || l.taskId)).size;
  const avgHoursPerLog = totalLogsCount > 0 ? (totalHours / totalLogsCount).toFixed(1) : '0';

  const canLogWork = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'ROLE_ADMIN', 'ROLE_PROJECT_MANAGER', 'ROLE_TEAM_LEAD', 'ROLE_DEVELOPER'].includes(role?.toUpperCase() || '');

  return (
    <div className="module-container worklogs-management">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="module-title">Work Logs & Activity Hub</h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {role.replace('_', ' ')} Access View — Work logs tracking for team members, tasks & projects
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-pill"
            onClick={initWorkLogsData}
            style={{ background: 'rgba(17, 177, 198, 0.1)', color: '#0c5965', border: '1px solid rgba(17, 177, 198, 0.25)', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
          >
            <RefreshCw size={16} /> Refresh Logs
          </button>
          {canLogWork && (
            <button
              className="btn-pill"
              onClick={() => setShowLogModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
            >
              <Plus size={18} /> Log Work
            </button>
          )}
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {/* Stats Cards */}
        <div className="worklogs-stats-grid">
          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-cyan">
                <span className="stat-pulse-dot"></span> EFFORT TRACKING
              </span>
              <span className="stat-trend-badge trend-cyan">Live</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">
                {totalHours.toFixed(1)} <span className="stat-unit">hrs</span>
              </div>
              <h4 className="stat-label">Total Hours Logged</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-cyan" style={{ width: `${Math.min((totalHours / 40) * 100, 100) || 5}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-teal">
                LOG COUNTER
              </span>
              <span className="stat-trend-badge trend-teal">{totalLogsCount} Records</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{totalLogsCount}</div>
              <h4 className="stat-label">Work Log Entries</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-teal" style={{ width: `${Math.min((totalLogsCount / 20) * 100, 100) || 5}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-sky">
                TASK COVERAGE
              </span>
              <span className="stat-trend-badge trend-sky">{uniqueTasksCount} Active</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{uniqueTasksCount}</div>
              <h4 className="stat-label">Tasks Worked On</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-sky" style={{ width: `${Math.min((uniqueTasksCount / 10) * 100, 100) || 5}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-deep">
                DAILY PACE
              </span>
              <span className="stat-trend-badge trend-deep">Average</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">
                {avgHoursPerLog} <span className="stat-unit">hrs</span>
              </div>
              <h4 className="stat-label">Avg Hours / Entry</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-deep" style={{ width: `${Math.min((parseFloat(avgHoursPerLog) / 8) * 100, 100) || 5}%` }}></div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="worklogs-toolbar">
          <div className="worklogs-filters">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.88rem' }}>
              <Filter size={16} /> Filters:
            </span>

            {/* User Filter (for Lead, Manager, Admin) */}
            {['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(role?.toUpperCase()) && (
              <select
                className="filter-select"
                value={selectedUser}
                onChange={(e) => handleFetchByUser(e.target.value)}
              >
                <option value="ALL">All Team Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.role?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            )}

            {/* Project Filter */}
            <select
              className="filter-select"
              value={selectedProject}
              onChange={(e) => handleFetchByProject(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>

            {/* Sprint Filter */}
            <select
              className="filter-select"
              value={selectedSprint}
              onChange={(e) => handleFetchBySprint(e.target.value)}
            >
              <option value="ALL">All Sprints</option>
              {sprints.map(s => (
                <option key={s.id} value={s.id}>{s.sprintName}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#11b1c6' }} />
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              placeholder="Search task or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Work Logs List Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#11b1c6', fontWeight: 600 }}>
            Loading work log history...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '20px', color: '#0c5965', fontStyle: 'italic' }}>
            No work logs recorded matching your filter parameters.
          </div>
        ) : (
          <div className="worklog-table-container">
            <table className="worklog-table">
              <thead>
                <tr>
                  <th>Log Date</th>
                  <th>Employee / User</th>
                  <th>Task & Project</th>
                  <th>Hours Logged</th>
                  <th>Progress</th>
                  <th>Notes / Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const logUser = log.user || users.find(u => u.id === log.userId) || { name: 'Employee', role: 'DEVELOPER' };
                  const taskObj = log.task || tasks.find(t => t.id === log.taskId);
                  const progressVal = log.progressPercent !== null && log.progressPercent !== undefined ? log.progressPercent : 0;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#11b1c6" />
                          {log.logDate || (log.createdAt ? log.createdAt.substring(0, 10) : 'Today')}
                        </span>
                      </td>

                      <td>
                        <div className="worklog-badge-user">
                          <User size={12} />
                          {logUser.name || logUser.email || 'Team Member'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0c5965', fontSize: '0.92rem' }}>
                          {taskObj?.taskName || `Task #${log.task?.id || log.taskId || log.id}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {taskObj?.project?.projectName || 'Project Task'}
                        </div>
                      </td>

                      <td>
                        <div className="worklog-badge-hours">
                          <Clock size={12} />
                          {log.loggedHours || 0} hrs
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${Math.min(progressVal, 100)}%` }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      <td style={{ maxWidth: '320px', lineHeight: 1.4, color: '#475569', fontSize: '0.86rem' }}>
                        {log.description || log.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Work Modal */}
      {showLogModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12, 89, 101, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.8)', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '32px 28px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid rgba(17, 177, 198, 0.15)' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0c5965', fontSize: '1.25rem', fontWeight: 700 }}>Log Today's Work</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Record effort hours & progress update</span>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              {submitError && <div className="error-message" style={{ marginBottom: '16px' }}>{submitError}</div>}
              {submitSuccess && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} />
                  {submitSuccess}
                </div>
              )}

              {/* Custom Select Task Dropdown */}
              <div className="form-group" style={{ position: 'relative', marginBottom: '16px' }} ref={taskRef}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.85rem' }}>Select Task *</label>
                <div
                  className="form-control"
                  onClick={() => setIsTaskOpen(!isTaskOpen)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <span style={{ color: formData.taskId ? '#0c5965' : '#89c4d1' }}>
                    {formData.taskId
                      ? (tasks.find(t => t.id.toString() === formData.taskId.toString())
                        ? `${tasks.find(t => t.id.toString() === formData.taskId.toString()).taskName} (${tasks.find(t => t.id.toString() === formData.taskId.toString()).project?.projectName || 'Project Task'})`
                        : 'Choose an active task...')
                      : 'Choose an active task...'}
                  </span>
                  <ChevronDown size={18} color="#11b1c6" style={{ transform: isTaskOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>

                {isTaskOpen && (
                  <div style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '180px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                    {tasks.length === 0 ? (
                      <div style={{ padding: '10px 14px', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No active tasks found</div>
                    ) : (
                      tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setFormData(prev => ({ ...prev, taskId: t.id.toString() })); setIsTaskOpen(false); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', color: formData.taskId.toString() === t.id.toString() ? '#11b1c6' : '#0c5965', fontWeight: formData.taskId.toString() === t.id.toString() ? '600' : '500', backgroundColor: formData.taskId.toString() === t.id.toString() ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.88rem' }}
                        >
                          {t.taskName} ({t.project?.projectName || 'Project'})
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.85rem' }}>Hours Spent *</label>
                  <input
                    type="number"
                    step="0.25"
                    name="loggedHours"
                    className="form-control"
                    placeholder="e.g. 4.0"
                    value={formData.loggedHours}
                    onChange={(e) => setFormData(p => ({ ...p, loggedHours: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.85rem' }}>Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="progressPercent"
                    className="form-control"
                    placeholder="e.g. 75"
                    value={formData.progressPercent}
                    onChange={(e) => setFormData(p => ({ ...p, progressPercent: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.85rem' }}>Log Date *</label>
                <input
                  type="date"
                  name="logDate"
                  className="form-control"
                  value={formData.logDate}
                  onChange={(e) => setFormData(p => ({ ...p, logDate: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#0c5965', fontWeight: 600, fontSize: '0.85rem' }}>Notes / Description *</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows="3"
                  placeholder="Detail work performed today..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  required
                  style={{ resize: 'vertical', borderRadius: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-pill"
                  style={{ padding: '10px 26px' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Log'}
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

export default WorkLogsManagement;
