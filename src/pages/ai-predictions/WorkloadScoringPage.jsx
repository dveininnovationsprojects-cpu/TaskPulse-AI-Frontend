import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  fetchAllProjects,
  fetchAllTasks,
  fetchAssignableUsers,
  fetchEmployees,
  scoreEmployeeWorkload,
  workloadLevelStyle,
} from './aiPredictionUtils';

const WorkloadScoringPage = ({ onBack }) => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [users, projects, employees] = await Promise.all([
          fetchAssignableUsers(),
          fetchAllProjects(),
          fetchEmployees(),
        ]);
        const employeesByUserId = {};
        employees.forEach(e => { employeesByUserId[e.userId] = e; });

        const tasks = await fetchAllTasks(projects);

        const computed = await Promise.all(
          users.map(user => scoreEmployeeWorkload(user, tasks, employeesByUserId))
        );
        computed.sort((a, b) => b.workload_score - a.workload_score);
        setRows(computed);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not reach the AI prediction service. Make sure the XGBoost service (ai-service) is running.');
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const maxScore = useMemo(() => Math.max(1, ...rows.map(r => r.workload_score)), [rows]);

  return (
    <div className="module-container">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="action-btn" title="Back to AI Predictions" style={{ color: '#0c5965' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="module-title">Workload Scoring</h2>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Running XGBoost workload scoring...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>No assignable team members found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {rows.map(({ user, openTaskCount, blockedCount, workload_score, workload_level, request }) => {
              const level = workloadLevelStyle(workload_level);
              return (
                <div key={user.id} style={{ background: 'white', padding: '20px 24px', borderRadius: '18px', border: '1px solid rgba(17,177,198,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0c5965', fontSize: '1rem' }}>{user.name}</span>
                      <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.role}</span>
                    </div>
                    <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: level.color, background: level.bg }}>
                      {level.label} · {Math.round(workload_score)}/100
                    </span>
                  </div>

                  <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(17,177,198,0.08)', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ height: '100%', width: `${(workload_score / maxScore) * 100}%`, background: level.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                    <span><strong style={{ color: '#0c5965' }}>{openTaskCount}</strong> open tasks</span>
                    <span><strong style={{ color: '#0c5965' }}>{request.active_task_hours.toFixed(1)}h</strong> active</span>
                    <span style={{ color: blockedCount > 0 ? '#ef4444' : '#475569' }}><strong>{blockedCount}</strong> blocked</span>
                    <span><strong style={{ color: '#0c5965' }}>{request.available_capacity_hours.toFixed(1)}h</strong> capacity left</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadScoringPage;
