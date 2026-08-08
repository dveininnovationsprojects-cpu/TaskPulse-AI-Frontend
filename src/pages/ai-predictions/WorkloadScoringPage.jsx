import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Users, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Overloaded' | 'Balanced' | 'Underutilized'

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
        computed.sort((a, b) => {
          const scoreA = getFinalScore(a);
          const scoreB = getFinalScore(b);
          return scoreB - scoreA;
        });
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

  // Helper to ensure accurate 0-100 score calculation regardless of backend format
  const getFinalScore = (row) => {
    const raw = row.workload_score || 0;
    if (raw > 5) return Math.min(100, Math.round(raw));
    const active = row.request?.active_task_hours || 0;
    const capacity = row.request?.available_capacity_hours || 0;
    const total = active + capacity;
    if (total > 0) {
      return Math.min(100, Math.round((active / total) * 100));
    }
    return 0;
  };

  // Helper to derive workload status level cleanly
  const getWorkloadLevel = (score, rawLevel) => {
    if (score > 80) return 'Overloaded';
    if (score >= 40) return 'Balanced';
    return 'Underutilized';
  };

  // Helper for progress bar gradient colors
  const getBarGradient = (score) => {
    if (score > 80) return 'linear-gradient(90deg, #f59e0b, #ef4444)';
    if (score >= 40) return 'linear-gradient(90deg, #11b1c6, #0284c7)';
    return 'linear-gradient(90deg, #34d399, #059669)';
  };

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const score = getFinalScore(r);
      const level = getWorkloadLevel(score, r.workload_level);

      const matchesSearch = 
        r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = statusFilter === 'ALL' || level === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [rows, searchTerm, statusFilter]);

  const summaryStats = useMemo(() => {
    let overloaded = 0;
    let balanced = 0;
    let underutilized = 0;

    rows.forEach(r => {
      const score = getFinalScore(r);
      const level = getWorkloadLevel(score, r.workload_level);
      if (level === 'Overloaded') overloaded++;
      else if (level === 'Balanced') balanced++;
      else underutilized++;
    });

    return { total: rows.length, overloaded, balanced, underutilized };
  }, [rows]);

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="action-btn" title="Back to AI Predictions" style={{ color: '#0c5965' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="module-title">Workload Scoring & Capacity Intelligence</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Real-time capacity utilization analysis powered by TaskPulse XGBoost ML Engine
            </p>
          </div>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#11b1c6', fontWeight: 600 }}>
            Evaluating team capacity scores with XGBoost...
          </div>
        ) : (
          <div>
            {/* Top KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div 
                onClick={() => setStatusFilter('ALL')}
                style={{ 
                  background: statusFilter === 'ALL' ? 'rgba(17,177,198,0.12)' : 'white', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: statusFilter === 'ALL' ? '1.5px solid #11b1c6' : '1px solid rgba(17,177,198,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Team Members</span>
                  <Users size={18} color="#11b1c6" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5965', marginTop: '4px' }}>{summaryStats.total}</div>
              </div>

              <div 
                onClick={() => setStatusFilter('Overloaded')}
                style={{ 
                  background: statusFilter === 'Overloaded' ? 'rgba(239,68,68,0.12)' : 'white', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: statusFilter === 'Overloaded' ? '1.5px solid #ef4444' : '1px solid rgba(239,68,68,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' }}>Overloaded</span>
                  <AlertTriangle size={18} color="#ef4444" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>{summaryStats.overloaded}</div>
              </div>

              <div 
                onClick={() => setStatusFilter('Balanced')}
                style={{ 
                  background: statusFilter === 'Balanced' ? 'rgba(2,132,199,0.12)' : 'white', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: statusFilter === 'Balanced' ? '1.5px solid #0284c7' : '1px solid rgba(2,132,199,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>Balanced</span>
                  <CheckCircle size={18} color="#0284c7" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', marginTop: '4px' }}>{summaryStats.balanced}</div>
              </div>

              <div 
                onClick={() => setStatusFilter('Underutilized')}
                style={{ 
                  background: statusFilter === 'Underutilized' ? 'rgba(5,150,105,0.12)' : 'white', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: statusFilter === 'Underutilized' ? '1.5px solid #059669' : '1px solid rgba(5,150,105,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Underutilized</span>
                  <Clock size={18} color="#059669" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginTop: '4px' }}>{summaryStats.underutilized}</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ 
              display: 'flex', 
              justify: 'space-between', 
              alignItems: 'center', 
              gap: '16px', 
              marginBottom: '20px', 
              flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '12px 18px',
              borderRadius: '16px',
              border: '1px solid rgba(17, 177, 198, 0.15)'
            }}>
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search team member or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 38px',
                    borderRadius: '20px',
                    border: '1px solid rgba(17, 177, 198, 0.25)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: 'white',
                    color: '#0c5965'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['ALL', 'Overloaded', 'Balanced', 'Underutilized'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: statusFilter === status ? '#0c5965' : 'rgba(17, 177, 198, 0.08)',
                      color: statusFilter === status ? 'white' : '#0c5965',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {status === 'ALL' ? 'All Members' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Employee Cards List */}
            {filteredRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic', background: 'white', borderRadius: '16px' }}>
                No team members match the current search or status filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredRows.map(({ user, openTaskCount, blockedCount, workload_score, workload_level, request }) => {
                  const score = getFinalScore({ workload_score, request });
                  const levelName = getWorkloadLevel(score, workload_level);
                  const level = workloadLevelStyle(levelName);
                  const gradient = getBarGradient(score);

                  // Calculate initials for avatar
                  const initials = user.name
                    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <div 
                      key={user.id} 
                      style={{ 
                        background: 'white', 
                        padding: '22px 26px', 
                        borderRadius: '20px', 
                        border: levelName === 'Overloaded' 
                          ? '1px solid rgba(239, 68, 68, 0.25)' 
                          : '1px solid rgba(17, 177, 198, 0.15)',
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                    >
                      {/* Top row: Avatar + Name + Role + Score Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '50%', 
                            background: levelName === 'Overloaded' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'linear-gradient(135deg, #11b1c6, #0c5965)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 700, 
                            fontSize: '0.95rem',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0c5965', fontSize: '1.05rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                              {user.role}
                            </div>
                          </div>
                        </div>

                        <span style={{ 
                          padding: '6px 16px', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: level.color, 
                          background: level.bg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                          {levelName === 'Overloaded' && <ShieldAlert size={14} />}
                          {level.label} · {score}/100
                        </span>
                      </div>

                      {/* Score Progress Bar */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                          <span>Capacity Utilization Load</span>
                          <span style={{ color: level.color }}>{score}% Used</span>
                        </div>
                        <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(17,177,198,0.08)', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${score}%`, 
                            background: gradient, 
                            borderRadius: '5px', 
                            transition: 'width 0.4s ease-in-out' 
                          }} />
                        </div>
                      </div>

                      {/* Detailed Metric Badges */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                        gap: '12px', 
                        paddingTop: '12px', 
                        borderTop: '1px solid rgba(17,177,198,0.08)',
                        fontSize: '0.82rem',
                        color: '#475569' 
                      }}>
                        <div style={{ background: 'rgba(17,177,198,0.04)', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Open Tasks</span>
                          <strong style={{ color: '#0c5965', fontSize: '0.95rem' }}>{openTaskCount}</strong>
                        </div>

                        <div style={{ background: 'rgba(17,177,198,0.04)', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Active Task Load</span>
                          <strong style={{ color: '#0c5965', fontSize: '0.95rem' }}>{request.active_task_hours.toFixed(1)}h</strong>
                        </div>

                        <div style={{ background: blockedCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(17,177,198,0.04)', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ color: blockedCount > 0 ? '#ef4444' : '#64748b', fontSize: '0.72rem', display: 'block' }}>Blocked Tasks</span>
                          <strong style={{ color: blockedCount > 0 ? '#ef4444' : '#0c5965', fontSize: '0.95rem' }}>{blockedCount}</strong>
                        </div>

                        <div style={{ background: 'rgba(17,177,198,0.04)', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Available Capacity</span>
                          <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{request.available_capacity_hours.toFixed(1)}h</strong>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadScoringPage;
