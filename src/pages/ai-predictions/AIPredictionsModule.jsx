import React, { useState } from 'react';
import { Brain, TrendingDown, Gauge, ShieldAlert, UserCheck, ChevronRight } from 'lucide-react';
import DelayPredictionPage from './DelayPredictionPage';
import WorkloadScoringPage from './WorkloadScoringPage';
import SprintRiskPage from './SprintRiskPage';
import RecommendEmployeePage from './RecommendEmployeePage';

const CARDS = [
  {
    id: 'delay',
    title: 'Delay Prediction',
    description: 'Flags open tasks likely to miss their deadline based on remaining work, blockers and priority.',
    icon: TrendingDown,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)'
  },
  {
    id: 'workload',
    title: 'Workload Scoring',
    description: "Scores each team member's current load so work can be balanced before burnout hits.",
    icon: Gauge,
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)'
  },
  {
    id: 'risk',
    title: 'Sprint Risk',
    description: 'Rolls up blocked tasks, overdue work and schedule slippage into a per-sprint risk score.',
    icon: ShieldAlert,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)'
  },
  {
    id: 'recommend',
    title: 'Recommend Employee',
    description: 'Ranks candidates for unassigned tasks by free capacity and track record on similar work.',
    icon: UserCheck,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)'
  }
];

const AIPredictionsModule = () => {
  const [activeView, setActiveView] = useState('overview');

  if (activeView === 'delay') return <DelayPredictionPage onBack={() => setActiveView('overview')} />;
  if (activeView === 'workload') return <WorkloadScoringPage onBack={() => setActiveView('overview')} />;
  if (activeView === 'risk') return <SprintRiskPage onBack={() => setActiveView('overview')} />;
  if (activeView === 'recommend') return <RecommendEmployeePage onBack={() => setActiveView('overview')} />;

  return (
    <div className="module-container">
      <div className="module-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={22} color="#11b1c6" />
          <h2 className="module-title">AI Predictions</h2>
        </div>
      </div>

      <div className="module-content">
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Predictions are served by XGBoost regression models trained on your live project, task and work-log data via the TaskPulse AI service.
        </p>

        <div className="ai-predictions-grid">
          {CARDS.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveView(card.id)}
                style={{
                  textAlign: 'left',
                  background: 'white',
                  border: '1px solid rgba(17,177,198,0.1)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(12, 89, 101, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ padding: '10px', background: card.bg, borderRadius: '12px', color: card.color }}>
                    <Icon size={22} />
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#0c5965', fontSize: '1.05rem', fontWeight: 600 }}>{card.title}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>{card.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIPredictionsModule;
