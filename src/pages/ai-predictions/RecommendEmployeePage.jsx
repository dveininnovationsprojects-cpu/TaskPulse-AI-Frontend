import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Filter, UserCheck } from 'lucide-react';
import {
  fetchAllProjects,
  fetchAllTasks,
  fetchAssignableUsers,
  fetchEmployees,
  buildSkillVocabulary,
  deriveRequiredSkills,
  recommendEmployeeForTask,
  recommendationLevelStyle,
} from './aiPredictionUtils';

const TOP_N_RECOMMENDATIONS = 3;

const RecommendEmployeePage = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [employeesByUserId, setEmployeesByUserId] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [projectsData, assignableUsers, employees] = await Promise.all([
          fetchAllProjects(), fetchAssignableUsers(), fetchEmployees(),
        ]);
        setProjects(projectsData);
        setUsers(assignableUsers);
        if (projectsData.length > 0) setSelectedProjectId(projectsData[0].id);

        const byUserId = {};
        employees.forEach(e => { byUserId[e.userId] = e; });
        setEmployeesByUserId(byUserId);

        const tasks = await fetchAllTasks(projectsData);
        setAllTasks(tasks);
      } catch (err) {
        console.error(err);
        setError('Failed to load data for employee recommendations.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const openTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return allTasks.filter(t => t.project?.id === parseInt(selectedProjectId, 10) && t.status !== 'DONE');
  }, [allTasks, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || users.length === 0 || openTasks.length === 0) {
      setRecommendations([]);
      return;
    }
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const skillVocabulary = buildSkillVocabulary(Object.values(employeesByUserId));
        const results = await Promise.all(
          openTasks.map(task => {
            const requiredSkills = deriveRequiredSkills(task, employeesByUserId, skillVocabulary);
            return recommendEmployeeForTask(task, requiredSkills, users, allTasks, employeesByUserId);
          })
        );
        setRecommendations(results);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not reach the AI prediction service. Make sure the XGBoost service (ai-service) is running.');
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTasks, users, employeesByUserId]);

  return (
    <div className="module-container">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="action-btn" title="Back to AI Predictions" style={{ color: '#0c5965' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="module-title">Recommend Employee</h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={18} style={{ color: '#0c5965' }} />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>Select a project to see recommendations.</div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Running XGBoost employee recommendations...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>No assignable team members found.</div>
        ) : openTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>No open tasks in this project.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {recommendations.map(({ task, ranked, request }) => {
              const top = TOP_N_RECOMMENDATIONS ? ranked.slice(0, TOP_N_RECOMMENDATIONS) : ranked;
              const currentAssigneeId = task.assignee?.id ? String(task.assignee.id) : null;
              const aiAgreesWithCurrent = currentAssigneeId && top[0]?.employee_id === currentAssigneeId;
              return (
                <div key={task.id} style={{ background: 'white', padding: '20px 24px', borderRadius: '18px', border: '1px solid rgba(17,177,198,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#0c5965', fontSize: '1rem' }}>{task.taskName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {task.priority || 'MEDIUM'} priority · {task.complexity || 'Medium'} complexity
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>
                    {request.required_skills.length > 0 ? `Skills: ${request.required_skills.join(', ')}` : 'No specific skill tags detected for this task'}
                    {currentAssigneeId && (
                      <span style={{ marginLeft: '10px', color: aiAgreesWithCurrent ? '#059669' : '#d97706' }}>
                        · Currently assigned to {task.assignee.name} {aiAgreesWithCurrent ? '(AI agrees)' : '(AI would pick differently)'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {top.map(({ employee_id, user, score, level }, idx) => {
                      const style = recommendationLevelStyle(level);
                      const isCurrent = currentAssigneeId === employee_id;
                      return (
                        <div key={employee_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: idx === 0 ? 'rgba(5, 150, 105, 0.06)' : 'rgba(17,177,198,0.04)', border: idx === 0 ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {idx === 0 && <UserCheck size={18} color="#059669" />}
                            <div>
                              <div style={{ fontWeight: 600, color: '#0c5965' }}>
                                {user?.name || `Employee #${employee_id}`}
                                {isCurrent && <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#64748b' }}>(current assignee)</span>}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                <span style={{ color: style.color, fontWeight: 600 }}>{style.label}</span>
                              </div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: idx === 0 ? '#059669' : '#0c5965', fontSize: '0.95rem' }}>
                            {Math.round(score * 100)}/100
                          </span>
                        </div>
                      );
                    })}
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

export default RecommendEmployeePage;
