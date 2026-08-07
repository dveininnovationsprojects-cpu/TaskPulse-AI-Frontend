import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIPredictionsModule from '../AIPredictionsModule';

// Mock the network layer only — real component + real utils logic run for real.
vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })), post: vi.fn(() => Promise.resolve({ data: {} })) },
}));

describe('AIPredictionsModule (UI)', () => {
  it('UI-1 renders all four AI prediction cards on the overview screen', () => {
    render(<AIPredictionsModule />);
    expect(screen.getByText('Delay Prediction')).toBeInTheDocument();
    expect(screen.getByText('Workload Scoring')).toBeInTheDocument();
    expect(screen.getByText('Sprint Risk')).toBeInTheDocument();
    expect(screen.getByText('Recommend Employee')).toBeInTheDocument();
  });

  it('UI-2 clicking the Delay Prediction card navigates into that sub-view', async () => {
    render(<AIPredictionsModule />);
    await userEvent.click(screen.getByText('Delay Prediction'));
    expect(screen.getByRole('heading', { name: 'Delay Prediction' })).toBeInTheDocument();
    // Back button should be present to return to the overview grid.
    expect(screen.getByTitle('Back to AI Predictions')).toBeInTheDocument();
  });

  it('UI-3 clicking Recommend Employee card navigates into that sub-view', async () => {
    render(<AIPredictionsModule />);
    await userEvent.click(screen.getByText('Recommend Employee'));
    expect(screen.getByRole('heading', { name: 'Recommend Employee' })).toBeInTheDocument();
  });
});
