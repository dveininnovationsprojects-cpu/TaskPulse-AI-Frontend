import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, Search, Calendar, User, Filter, RefreshCw } from 'lucide-react';

const ActivitiesModule = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, selectedEntityType, activities]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/api/activities').catch(() => ({ data: [] }));
      const data = res.data || [];
      // Sort newest first
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch activity logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let result = [...activities];

    if (selectedEntityType !== 'ALL') {
      result = result.filter(act => act.entityType?.toUpperCase() === selectedEntityType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(act => 
        (act.performedBy && act.performedBy.toLowerCase().includes(q)) ||
        (act.action && act.action.toLowerCase().includes(q)) ||
        (act.entityType && act.entityType.toLowerCase().includes(q)) ||
        (act.oldValue && act.oldValue.toLowerCase().includes(q)) ||
        (act.newValue && act.newValue.toLowerCase().includes(q)) ||
        (act.entityId && act.entityId.toString().includes(q))
      );
    }

    setFilteredActivities(result);
  };

  const renderValueBadge = (val, isOld = false) => {
    if (!val) return null;
    const vUpper = val.toUpperCase();
    const styleBase = {
      display: 'inline-block',
      whiteSpace: 'nowrap',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '0.78rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      textDecoration: isOld ? 'line-through' : 'none',
      opacity: isOld ? 0.65 : 1
    };

    if (['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ACTIVE', 'RESOLVED', 'COMPLETED', 'PLANNING'].includes(vUpper)) {
      let bg = 'rgba(17, 177, 198, 0.15)';
      let fg = '#0284c7';
      if (vUpper === 'BLOCKED') { bg = 'rgba(239, 68, 68, 0.15)'; fg = '#ef4444'; }
      if (vUpper === 'RESOLVED' || vUpper === 'DONE' || vUpper === 'ACTIVE' || vUpper === 'COMPLETED') { bg = 'rgba(34, 197, 94, 0.15)'; fg = '#16a34a'; }
      if (vUpper === 'TODO' || vUpper === 'PLANNING') { bg = 'rgba(148, 163, 184, 0.15)'; fg = '#475569'; }

      return (
        <span style={{ ...styleBase, background: bg, color: fg }}>
          {val.replace('_', ' ')}
        </span>
      );
    }

    if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(vUpper)) {
      let bg = 'rgba(245, 158, 11, 0.15)';
      let fg = '#d97706';
      if (vUpper === 'LOW') { bg = 'rgba(16, 185, 129, 0.15)'; fg = '#10b981'; }
      if (vUpper === 'HIGH' || vUpper === 'CRITICAL') { bg = 'rgba(239, 68, 68, 0.15)'; fg = '#e11d48'; }

      return (
        <span style={{ ...styleBase, background: bg, color: fg }}>
          {val}
        </span>
      );
    }

    return (
      <span style={{ ...styleBase, background: 'rgba(241, 245, 249, 0.8)', color: isOld ? '#94a3b8' : '#0c5965' }}>
        {val}
      </span>
    );
  };

  const createBadge = (text, bg, color) => (
    <span style={{
      display: 'inline-block',
      whiteSpace: 'nowrap',
      background: bg,
      color: color,
      padding: '4px 14px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.78rem',
      letterSpacing: '0.3px'
    }}>
      {text}
    </span>
  );

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE_TASK':
        return createBadge('Create Task', 'rgba(16, 185, 129, 0.15)', '#10b981');
      case 'STATUS_CHANGE':
        return createBadge('Status Change', 'rgba(17, 177, 198, 0.15)', '#0284c7');
      case 'ASSIGNEE_CHANGE':
        return createBadge('Assignee Change', 'rgba(99, 102, 241, 0.15)', '#6366f1');
      case 'COMPLEXITY_CHANGE':
        return createBadge('Complexity Change', 'rgba(168, 85, 247, 0.15)', '#a855f7');
      case 'DEADLINE_CHANGE':
        return createBadge('Deadline Change', 'rgba(234, 179, 8, 0.15)', '#ca8a04');
      case 'BLOCKER_REPORT':
        return createBadge('Blocker Reported', 'rgba(239, 68, 68, 0.15)', '#ef4444');
      case 'BLOCKER_RESOLVED':
        return createBadge('Blocker Resolved', 'rgba(34, 197, 94, 0.15)', '#16a34a');
      case 'DELETE_TASK':
        return createBadge('Delete Task', 'rgba(244, 63, 94, 0.15)', '#f43f5e');
      case 'ROLE_CHANGE':
        return createBadge('Role Change', 'rgba(14, 165, 233, 0.15)', '#0284c7');
      case 'CREATE_USER':
        return createBadge('User Created', 'rgba(34, 197, 94, 0.15)', '#16a34a');
      default:
        return createBadge(action ? action.replace('_', ' ') : 'Event', 'rgba(148, 163, 184, 0.15)', '#475569');
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={24} color="#11b1c6" /> Activity Audit Tracker
        </h2>
        <button className="btn-pill" style={{ marginTop: 0, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchActivities}>
          <RefreshCw size={16} /> Refresh Logs
        </button>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="#11b1c6" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="form-control"
              placeholder="Search performed by, action, or value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '44px', borderRadius: '20px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#0c5965', fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={16} /> Entity:
            </span>
            {['ALL', 'TASK', 'BLOCKER', 'PROJECT', 'SPRINT', 'USER'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedEntityType(type)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(17,177,198,0.2)',
                  background: selectedEntityType === type ? '#11b1c6' : 'white',
                  color: selectedEntityType === type ? 'white' : '#0c5965',
                  fontWeight: selectedEntityType === type ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading activity logs...</div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '20px', color: '#0c5965', fontStyle: 'italic' }}>
            No activity logs found matching criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Performed By</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Action</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Entity</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Changes (Old ➜ New)</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map(act => (
                  <tr key={act.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#0c5965', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <User size={14} color="#11b1c6" />
                        {act.performedBy}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{getActionBadge(act.action)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', whiteSpace: 'nowrap', background: 'rgba(17, 177, 198, 0.12)', color: '#0c5965', padding: '4px 14px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(17, 177, 198, 0.2)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {act.entityType} #{act.entityId}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {act.oldValue || act.newValue ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          {act.oldValue && renderValueBadge(act.oldValue, true)}
                          {act.oldValue && act.newValue && <span style={{ color: '#11b1c6', fontWeight: 'bold' }}>➜</span>}
                          {act.newValue && renderValueBadge(act.newValue, false)}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                        <Calendar size={12} color="#11b1c6" />
                        {act.timestamp ? act.timestamp.replace('T', ' ').substring(0, 16) : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesModule;
