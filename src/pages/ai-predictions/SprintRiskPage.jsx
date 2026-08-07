import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ArrowLeft, Filter, ShieldAlert } from 'lucide-react';
import {
  fetchAllProjects,
  fetchActiveBlockers,
  activeBlockerCountByTask,
  predictTaskDelay,
  predictSprintRisk,
  riskLevelStyle,
} from './aiPredictionUtils';

const Factor = ({ label, value, color }) => (
  <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
      <span>{label}</span>
      <span>{Math.round(Math.min(1, value) * 100)}%</span>
    </div>
    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(17,177,198,0.08)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round(Math.min(1, value) * 100)}%`, background: color, borderRadius: '3px' }} />
    </div>
  </div>
);

const SprintRiskPage = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sprintRisks, setSprintRisks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const projectsData = await fetchAllProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) setSelectedProjectId(projectsData[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [sprintsRes, tasksRes, blockers] = await Promise.all([
          api.get('/api/sprints').catch(() => ({ data: [] })),
          api.get(`/api/tasks/project/${selectedProjectId}`).catch(() => ({ data: [] })),
          fetchActiveBlockers(),
        ]);
        const sprints = (sprintsRes.data || []).filter(s => s.projectId === parseInt(selectedProjectId, 10));
        const tasks = tasksRes.data || [];
        const blockerCountByTask = activeBlockerCountByTask(blockers);

        // Step 1: run the delay model over every task once (its output feeds sprint risk).
        const delayResults = await Promise.all(
          tasks.map(t => predictTaskDelay(t, blockerCountByTask, tasks))
        );
        const delayScoreByTaskId = {};
        delayResults.forEach(r => { delayScoreByTaskId[r.task.id] = r.delay_risk_score; });

        // Step 2: aggregate per sprint and run the sprint-risk model.
        const results = await Promise.all(
          sprints.map(sprint => predictSprintRisk(
            sprint,
            tasks.filter(t => t.sprint?.id === sprint.id),
            blockerCountByTask,
            delayScoreByTaskId
          ))
        );
        results.sort((a, b) => b.sprint_risk_score - a.sprint_risk_score);
        setSprintRisks(results);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not reach the AI prediction service. Make sure the XGBoost service (ai-service) is running.');
        setSprintRisks([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedProjectId]);

  return (
    <div className="module-container">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="action-btn" title="Back to AI Predictions" style={{ color: '#0c5965' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="module-title">Sprint Risk</h2>
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>Select a project to assess sprint risk.</div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Running XGBoost sprint risk predictions...</div>
        ) : sprintRisks.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>No sprints found for this project.</div>
        ) : sprintRisks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sprintRisks.map(({ sprint, sprint_risk_score, risk_level, total, doneCount, blockedCount, request }) => {
              const level = riskLevelStyle(risk_level);
              return (
                <div key={sprint.id} style={{ background: 'white', padding: '22px 24px', borderRadius: '18px', border: '1px solid rgba(17,177,198,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0c5965', fontSize: '1.05rem' }}>{sprint.sprintName}</span>
                      <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sprint.status}</span>
                    </div>
                    <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: level.color, background: level.bg, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> {level.label} · {Math.round(sprint_risk_score * 100)}/100
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '14px' }}>
                    {sprint.startDate || '?'} → {sprint.endDate || '?'} · {total} task{total !== 1 ? 's' : ''} ({doneCount} done, {blockedCount} blocked)
                  </div>

                  {total > 0 && (
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <Factor label="Avg. task delay risk" value={request.avg_task_delay_risk} color="#ef4444" />
                      <Factor label="Blocker density" value={request.blocker_density} color="#d97706" />
                      <Factor label="Work completed vs. planned" value={request.planned_story_points > 0 ? request.completed_story_points / request.planned_story_points : 0} color="#0284c7" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintRiskPage;
