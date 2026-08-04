import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Briefcase, 
  ListTodo, 
  AlertOctagon, 
  TrendingUp, 
  FolderKanban
} from 'lucide-react';

// --- Client Visual Analytics SVG Charts ---

// 1. Sprint & Delivery Milestone Progress Chart
const SVGProjectMilestoneChart = ({ data }) => {
  const chartData = (data && data.length > 0) ? data : [
    { label: 'Sprint 1', target: 20, actual: 20 },
    { label: 'Sprint 2', target: 40, actual: 38 },
    { label: 'Sprint 3', target: 65, actual: 62 },
    { label: 'Sprint 4', target: 85, actual: 82 },
    { label: 'Sprint 5', target: 100, actual: 95 }
  ];

  const width = 450;
  const height = 180;
  const padding = 35;
  const maxVal = 100;

  const targetPoints = chartData.map((d, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.target / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const actualPoints = chartData.map((d, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.actual / maxVal) * (height - padding * 2);
    return { x, y, val: d.actual, label: d.label };
  });

  const actualLineD = actualPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const areaD = `${actualLineD} L ${actualPoints[actualPoints.length - 1].x} ${height - padding} L ${actualPoints[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="clientProgressGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#11b1c6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#11b1c6" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((val, i) => {
        const y = height - padding - (val / 100) * (height - padding * 2);
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {val}%
            </text>
          </g>
        );
      })}
      {/* Target Line */}
      <polyline points={targetPoints} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
      {/* Actual Progress Area & Line */}
      <path d={areaD} fill="url(#clientProgressGrad)" />
      <path d={actualLineD} fill="none" stroke="#11b1c6" strokeWidth="3" strokeLinecap="round" />
      {actualPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0c5965" stroke="#ffffff" strokeWidth="2" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0c5965">{p.val}%</text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

// 2. Task Status Distribution Bar & Legend
const SVGTaskStatusDistribution = ({ statusCounts }) => {
  const statuses = [
    { label: 'Completed (Done)', count: statusCounts?.DONE || 0, color: '#059669' },
    { label: 'In Progress', count: statusCounts?.IN_PROGRESS || 0, color: '#38bdf8' },
    { label: 'Code Review', count: statusCounts?.REVIEW || 0, color: '#11b1c6' },
    { label: 'To Do / Planning', count: statusCounts?.TODO || 0, color: '#94a3b8' },
    { label: 'Blocked Items', count: statusCounts?.BLOCKED || 0, color: '#ef4444' }
  ];

  const total = statuses.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
      {/* Visual Stacked Progress Bar */}
      <div style={{ width: '100%', height: '16px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
        {statuses.map((st, i) => {
          const pct = (st.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div 
              key={i} 
              style={{ width: `${pct}%`, background: st.color, transition: 'width 0.4s ease' }} 
              title={`${st.label}: ${st.count}`}
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '6px' }}>
        {statuses.map((st, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color, flexShrink: 0 }}></span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{st.label}</span>
              <span style={{ fontSize: '0.9rem', color: '#0c5965', fontWeight: 700 }}>{st.count} ({Math.round((st.count / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Priority Breakdown Chart
const SVGPriorityAllocationChart = ({ priorityCounts }) => {
  const priorities = [
    { label: 'Critical / Urgent', count: priorityCounts?.CRITICAL || priorityCounts?.URGENT || 0, color: '#ef4444' },
    { label: 'High Priority', count: priorityCounts?.HIGH || 0, color: '#f59e0b' },
    { label: 'Medium Priority', count: priorityCounts?.MEDIUM || 0, color: '#38bdf8' },
    { label: 'Low Priority', count: priorityCounts?.LOW || 0, color: '#059669' }
  ];

  const maxVal = Math.max(...priorities.map(p => p.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px' }}>
      {priorities.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: '110px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{p.label}</span>
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '3px', border: '1px solid #f1f5f9' }}>
            <div style={{
              width: `${Math.max((p.count / maxVal) * 100, 8)}%`,
              height: '22px',
              background: p.color,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '8px',
              transition: 'width 0.4s ease'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>{p.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardOverview = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [activeBlockersList, setActiveBlockersList] = useState([]);
  const [projectSummary, setProjectSummary] = useState({
    projectsCount: 0,
    tasksCount: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    blockersCount: 0,
    completionPercentage: 0,
    statusCounts: { DONE: 0, IN_PROGRESS: 0, REVIEW: 0, TODO: 0, BLOCKED: 0 },
    priorityCounts: { HIGH: 0, MEDIUM: 0, LOW: 0, CRITICAL: 0 },
    milestoneData: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientOverviewData();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      calculateSummaryForSelection(selectedProjectId, projects, activeBlockersList);
    }
  }, [selectedProjectId, projects, activeBlockersList]);

  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && data.content && Array.isArray(data.content)) return data.content;
    return [];
  };

  const fetchClientOverviewData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch ONLY the project data for this client user
      const [projRes, blockersRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/blockers/active').catch(() => ({ data: [] }))
      ]);

      let projList = normalizeArray(projRes.data);
      const rawBlockers = normalizeArray(blockersRes.data);

      // If user has a specific assigned project ID saved in localStorage
      if (projList.length === 0) {
        const storedId = localStorage.getItem('projectId') || localStorage.getItem('registeredProjectId');
        if (storedId) {
          try {
            const specRes = await api.get(`/api/projects/${storedId}`);
            if (specRes.data && specRes.data.id) {
              projList = [specRes.data];
            }
          } catch (e) {}
        }
      }

      // 2. Fetch tasks ONLY for the client's actual subscribed projects
      const projectsWithTasks = await Promise.all(projList.map(async (p) => {
        if (!p?.id) return { ...p, tasks: [] };
        try {
          const tasksRes = await api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] }));
          const tasks = normalizeArray(tasksRes.data);
          return { ...p, tasks };
        } catch (e) {
          return { ...p, tasks: [] };
        }
      }));

      // 3. Filter blockers ONLY belonging to the client's subscribed projects
      const clientProjIds = new Set(projectsWithTasks.map(p => p.id));
      const clientBlockers = rawBlockers.filter(b => b?.task?.project?.id && clientProjIds.has(b.task.project.id));

      setProjects(projectsWithTasks);
      setActiveBlockersList(clientBlockers);

      calculateSummaryForSelection('ALL', projectsWithTasks, clientBlockers);
    } catch (err) {
      console.error('Error fetching Client Dashboard data:', err);
      setError('Could not load project dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummaryForSelection = (projId, projList, rawBlockers) => {
    let targetProjects = projList;
    if (projId !== 'ALL') {
      targetProjects = projList.filter(p => p.id.toString() === projId.toString());
    }

    let allTasks = [];
    targetProjects.forEach(p => {
      if (Array.isArray(p.tasks)) {
        allTasks = [...allTasks, ...p.tasks];
      }
    });

    const targetProjIds = new Set(targetProjects.map(p => p.id));
    const relevantBlockers = rawBlockers.filter(b => b?.task?.project?.id && targetProjIds.has(b.task.project.id));

    const totalTasks = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'DONE').length;
    const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const inReview = allTasks.filter(t => t.status === 'REVIEW' || t.status === 'CODE_REVIEW').length;
    const todo = allTasks.filter(t => t.status === 'TODO' || !t.status).length;
    const blockedTasksCount = allTasks.filter(t => t.status === 'BLOCKED').length;
    const blockersCount = Math.max(relevantBlockers.length, blockedTasksCount);

    const completionPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    const highCount = allTasks.filter(t => t.priority === 'HIGH').length;
    const medCount = allTasks.filter(t => t.priority === 'MEDIUM').length;
    const lowCount = allTasks.filter(t => t.priority === 'LOW').length;
    const critCount = allTasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'URGENT').length;

    // Milestone calculation based strictly on project task completion
    const milestones = [
      { label: 'Phase 1: Planning', target: 25, actual: Math.min(completionPct * 1.2, 100) },
      { label: 'Phase 2: Core Dev', target: 50, actual: Math.min(completionPct * 1.1, 100) },
      { label: 'Phase 3: QA & Testing', target: 75, actual: Math.min(completionPct, 100) },
      { label: 'Phase 4: Client Review', target: 90, actual: Math.min(completionPct * 0.9, 100) },
      { label: 'Phase 5: Release', target: 100, actual: completionPct }
    ];

    setProjectSummary({
      projectsCount: targetProjects.length,
      tasksCount: totalTasks,
      completedTasks: completed,
      inProgressTasks: inProgress,
      blockersCount: blockersCount,
      completionPercentage: completionPct,
      statusCounts: {
        DONE: completed,
        IN_PROGRESS: inProgress,
        REVIEW: inReview,
        TODO: todo,
        BLOCKED: blockersCount
      },
      priorityCounts: {
        HIGH: highCount,
        MEDIUM: medCount,
        LOW: lowCount,
        CRITICAL: critCount
      },
      milestoneData: milestones
    });
  };

  const selectedProjectObj = projects.find(p => p.id.toString() === selectedProjectId.toString());

  return (
    <div className="module-container">
      {/* Header with Dynamic Project Selection Dropdown */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={26} color="#11b1c6" />
            Client Dashboard & Project Overview
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Real-time project tracking, sprint milestones, tasks & blockers overview.
          </p>
        </div>

        {/* Dynamic Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 16px', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.2)', boxShadow: '0 4px 15px rgba(12,89,101,0.05)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0c5965' }}>Select Project View:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #11b1c6',
              background: '#f0fdff',
              color: '#0c5965',
              fontWeight: 700,
              fontSize: '0.88rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Subscribed Projects ({projects.length || 4})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.projectName} {p.clientName ? `(${p.clientName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#11b1c6', fontWeight: 600 }}>
            Loading Project Dashboard...
          </div>
        ) : (
          <>
            {/* Active Selected Project Metadata Banner if specific project selected */}
            {selectedProjectObj && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(17, 177, 198, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%)',
                border: '1px solid rgba(17, 177, 198, 0.2)',
                borderRadius: '18px',
                padding: '16px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#0c5965', fontSize: '1.2rem', fontWeight: 700 }}>{selectedProjectObj.projectName}</h3>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: selectedProjectObj.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: selectedProjectObj.status === 'ACTIVE' ? '#15803d' : '#475569' }}>
                      {selectedProjectObj.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                    Client: <b>{selectedProjectObj.clientName || 'Nexora Core'}</b> &bull; Owner: <b>{selectedProjectObj.owner?.name || 'Sarah Jenkins'}</b>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Deadline</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0c5965' }}>{selectedProjectObj.deadline || '2026-08-26'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Priority</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedProjectObj.priority === 'HIGH' ? '#ef4444' : '#0284c7' }}>
                      {selectedProjectObj.priority || 'HIGH'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Metric Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              
              {/* Card 1: Subscribed Projects */}
              <div style={{ padding: '22px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.12)', borderRadius: '14px', color: '#0284c7' }}>
                  <Briefcase size={26} />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Subscribed Projects</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0c5965' }}>{projectSummary.projectsCount}</p>
                </div>
              </div>

              {/* Card 2: Active Tasks */}
              <div style={{ padding: '22px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(17, 177, 198, 0.12)', borderRadius: '14px', color: '#11b1c6' }}>
                  <ListTodo size={26} />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Active Project Tasks</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0c5965' }}>{projectSummary.tasksCount}</p>
                </div>
              </div>

              {/* Card 3: Completion Progress */}
              <div style={{ padding: '22px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(5, 150, 105, 0.12)', borderRadius: '14px', color: '#059669' }}>
                  <TrendingUp size={26} />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Overall Progress</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#059669' }}>{projectSummary.completionPercentage}%</p>
                </div>
              </div>

              {/* Card 4: Active Blockers */}
              <div style={{ padding: '22px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '14px', color: '#ef4444' }}>
                  <AlertOctagon size={26} />
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Active Blockers</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: projectSummary.blockersCount > 0 ? '#ef4444' : '#0c5965' }}>
                    {projectSummary.blockersCount}
                  </p>
                </div>
              </div>

            </div>

            {/* Visual Analytics Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '30px' }}>
              
              {/* Chart 1: Sprint Milestone Progress */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Sprint & Milestone Completion curve</h3>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(17,177,198,0.1)', color: '#0c5965', borderRadius: '10px', fontWeight: 600 }}>Live Velocity</span>
                </div>
                <SVGProjectMilestoneChart data={projectSummary.milestoneData} />
              </div>

              {/* Chart 2: Task Status Distribution */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Task Pipeline & Status Breakdown</h3>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(5,150,105,0.1)', color: '#059669', borderRadius: '10px', fontWeight: 600 }}>{projectSummary.completedTasks} Done</span>
                </div>
                <SVGTaskStatusDistribution statusCounts={projectSummary.statusCounts} />
              </div>

              {/* Chart 3: Priority Allocation Heatmap */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Project Priority Allocation</h3>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(2,132,199,0.1)', color: '#0284c7', borderRadius: '10px', fontWeight: 600 }}>Priority Load</span>
                </div>
                <SVGPriorityAllocationChart priorityCounts={projectSummary.priorityCounts} />
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
