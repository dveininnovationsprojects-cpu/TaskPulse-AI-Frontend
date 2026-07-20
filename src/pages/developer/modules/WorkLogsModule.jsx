import React, { useState, useEffect } from 'react';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { Clock, Plus, Calendar, BookOpen } from 'lucide-react';

const WorkLogsModule = () => {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
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

  useEffect(() => {
    fetchLogsAndTasks();
  }, []);

  const fetchLogsAndTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      let user = getCurrentUser();
      if (!user || !user.id) {
        user = await refreshCurrentUser();
      }
      setCurrentUser(user);

      if (user && user.id) {
        const [logsRes, tasksRes] = await Promise.all([
          api.get(`/api/worklogs/user/${user.id}`).catch(() => ({ data: [] })),
          api.get(`/api/tasks/assignee/${user.id}`).catch(() => ({ data: [] }))
        ]);
        setLogs(logsRes.data || []);
        setTasks((tasksRes.data || []).filter(t => t.status !== 'DONE'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logging history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        taskId: parseInt(formData.taskId, 10),
        userId: currentUser.id,
        loggedHours: parseFloat(formData.loggedHours),
        logDate: formData.logDate,
        notes: formData.notes,
        description: formData.notes,
        progressPercent: formData.progressPercent ? parseFloat(formData.progressPercent) : 0
      };

      await api.post('/api/worklogs', payload);
      setSubmitSuccess('Work logged successfully!');
      setFormData({
        taskId: '',
        loggedHours: '',
        logDate: new Date().toISOString().split('T')[0],
        notes: '',
        progressPercent: ''
      });
      // Refresh list
      const logsRes = await api.get(`/api/worklogs/user/${currentUser.id}`);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to submit work log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Work Logs</h2>
      </div>

      <div className="module-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Log work Form */}
        <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.15)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Log Today's Work
          </h3>

          <form onSubmit={handleSubmit}>
            {submitError && <div className="error-message" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>{submitError}</div>}
            {submitSuccess && (
              <div className="error-message" style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                backgroundColor: 'rgba(220, 252, 231, 0.8)', 
                color: '#166534', 
                borderColor: '#bbf7d0' 
              }}>
                {submitSuccess}
              </div>
            )}

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Select Task *</label>
              <select
                name="taskId"
                className="form-control"
                value={formData.taskId}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>Choose an active task...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.taskName} ({t.project?.projectName || 'No Project'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Hours Spent *</label>
                <input
                  type="number"
                  step="0.25"
                  name="loggedHours"
                  className="form-control"
                  placeholder="e.g. 3.5"
                  value={formData.loggedHours}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Progress %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="progressPercent"
                  className="form-control"
                  placeholder="e.g. 60"
                  value={formData.progressPercent}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Log Date *</label>
              <input
                type="date"
                name="logDate"
                className="form-control"
                value={formData.logDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Notes *</label>
              <textarea
                name="notes"
                className="form-control"
                rows="3"
                placeholder="What did you work on?"
                value={formData.notes}
                onChange={handleInputChange}
                required
                style={{ resize: 'vertical', borderRadius: '12px' }}
              />
            </div>

            <button type="submit" className="btn-pill" style={{ width: '100%', margin: '10px 0 0 0' }} disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Submit Log'}
            </button>
          </form>
        </div>

        {/* Logging History */}
        <div>
          <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Logging History
          </h3>

          {error && <div className="error-message">{error}</div>}

          {isLoading ? (
            <p style={{ color: '#11b1c6' }}>Loading log history...</p>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '16px', color: '#0c5965', fontStyle: 'italic' }}>
              No work logged yet.
            </div>
          ) : (
            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map(log => (
                <div key={log.id} style={{ 
                  background: 'white', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(17,177,198,0.1)', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#0c5965', fontSize: '0.95rem' }}>{log.task?.taskName}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#11b1c6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {log.loggedHours} hrs
                    </span>
                  </div>
                  
                  <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {log.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#89c4d1', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {log.logDate}
                    </span>
                    {log.progressPercent !== null && log.progressPercent !== undefined && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={12} /> Progress: {log.progressPercent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkLogsModule;
