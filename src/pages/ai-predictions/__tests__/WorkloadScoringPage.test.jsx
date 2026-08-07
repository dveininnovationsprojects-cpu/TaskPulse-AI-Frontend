import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkloadScoringPage from '../WorkloadScoringPage';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const USER = { id: 4, name: 'Dev Dan', role: 'DEVELOPER' };

function mockRoutes() {
  api.get.mockImplementation((url) => {
    if (url === '/api/users') return Promise.resolve({ data: [USER] });
    if (url === '/api/projects') return Promise.resolve({ data: [{ id: 100, projectName: 'Atlas' }] });
    if (url === '/api/employees') return Promise.resolve({ data: [{ id: 4, userId: 4, capacityHours: 80 }] });
    if (url === '/api/tasks/project/100') return Promise.resolve({ data: [{ id: 1, taskName: 'Task A', status: 'IN_PROGRESS', assignee: { id: 4 }, estimatedHours: 76, priority: 'HIGH' }] });
    return Promise.resolve({ data: [] });
  });
  // Mirrors the real DTO: workload_score is a 0-1 XGBoost output, same convention
  // as delay_risk_score and sprint_risk_score elsewhere in this module.
  // Unlike delay_risk_score and sprint_risk_score, workload_score from the AI service
  // is already scaled 0-100 (see ai-service/main.py workload_score endpoint, which
  // clamps to [0, 100] and applies 80/40 thresholds — confirmed against live "Workload"
  // table data, max observed 80). Do not multiply by 100 here.
  api.post.mockResolvedValue({ data: { employee_id: '4', workload_score: 92, workload_level: 'Overloaded' } });
}

describe('WorkloadScoringPage (functional + UI)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRoutes(); });

  it('FUNC-4 renders one card per assignable user with the correct workload level label', async () => {
    render(<WorkloadScoringPage />);
    await waitFor(() => expect(screen.getByText('Dev Dan')).toBeInTheDocument());
    expect(document.body.textContent).toContain('Overloaded');
  });

  it('workload score renders as-is (already 0-100 scale), not multiplied by 100 like the 0-1-scale prediction types', async () => {
    render(<WorkloadScoringPage />);
    await waitFor(() => expect(screen.getByText('Dev Dan')).toBeInTheDocument());
    expect(screen.queryByText(/92\/100/)).toBeInTheDocument();
    expect(screen.queryByText(/9200\/100/)).not.toBeInTheDocument();
  });
});
