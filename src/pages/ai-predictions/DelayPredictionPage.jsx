import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Filter, TrendingDown } from 'lucide-react';
import {
  fetchAllProjects,
  fetchAllTasks,
  fetchActiveBlockers,
  activeBlockerCountByTask,
  predictTaskDelay,
  riskLevelStyle,
} from './aiPredictionUtils';

const DelayPredictionPage = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [blockerCountByTask, setBlockerCountByTask] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const projectsData = await fetchAllProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) setSelectedProjectId(projectsData[0].id);

      const [tasksData, blockers] = await Promise.all([
        fetchAllTasks(projectsData),
        fetchActiveBlockers(),
      ]);
      setAllTasks(tasksData);
      setBlockerCountByTask(activeBlockerCountByTask(blockers));
    })();
  }, []);

  const projectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return allTasks.filter(t => t.project?.id === parseInt(selectedProjectId, 10) && t.status !== 'DONE');
  }, [allTasks, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await Promise.all(
          projectTasks.map(t => predictTaskDelay(t, blockerCountByTask, allTasks))
        );
        results.sort((a, b) => b.delay_risk_score - a.delay_risk_score);
        setPredictions(results);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not reach the AI prediction service. Make sure the XGBoost service (ai-service) is running.');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks, blockerCountByTask]);

  return (
    <div className="module-container">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="action-btn" title="Back to AI Predictions" style={{ color: '#0c5965' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="module-title">Delay Prediction</h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={18} style={{ color: '#0c5965' }} />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.2)', background: 'white', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <option value="" disabled>Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {!selectedProjectId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>Select a project to run delay predictions.</div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Running XGBoost delay predictions...</div>
        ) : predictions.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>No open tasks in this project — nothing to predict.</div>
        ) : predictions.length > 0 && (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Days Left</th>
                  <th>Blockers</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(({ task, delay_risk_score, risk_level, request }) => {
                  const level = riskLevelStyle(risk_level);
                  return (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
                      <td>{task.assignee?.name || 'Unassigned'}</td>
                      <td>{task.status}</td>
                      <td>{task.deadline || '-'}</td>
                      <td style={{ color: request.days_remaining < 0 ? '#ef4444' : '#475569' }}>
                        {task.deadline ? (request.days_remaining < 0 ? `${Math.abs(request.days_remaining)}d overdue` : `${request.days_remaining}d`) : 'No deadline'}
                      </td>
                      <td style={{ color: request.blocker_count > 0 ? '#ef4444' : '#475569' }}>
                        {request.blocker_count > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingDown size={14} /> {request.blocker_count}
                          </span>
                        ) : '0'}
                      </td>
                      <td>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: level.color, background: level.bg }}>
                          {level.label} ({Math.round(delay_risk_score * 100)})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DelayPredictionPage;
